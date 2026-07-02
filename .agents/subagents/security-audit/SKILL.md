---
name: security-audit
description: >-
  Security audit for Dexbooru Web: pnpm dependency vulnerabilities and
  application-level findings (auth, crypto, roles, server logic). Default scope
  is staged git changes; user may request branch or full-repo review.
disable-model-invocation: true
---

# Security Audit Subagent

Review code changes for dependency and application security issues. Output actionable findings for agentic coders to fix before merge.

## When to Run

- User asks for security review, audit, or `/security-audit`
- Before merging changes touching auth, sessions, passwords, OAuth, moderation roles, API authorization, file uploads, or secrets
- After adding or upgrading npm dependencies

## Diff Scope (default → optional)

**Default:** staged changes only.

```bash
git diff --cached
git diff --cached --name-only
```

If staged diff is empty, also check unstaged working tree and report which scope was reviewed:

```bash
git diff
```

**Branch diff** (when user asks to review branch work or PR):

```bash
git diff $(git merge-base HEAD origin/main)...HEAD
# or replace origin/main with the repo's default branch
```

**Full codebase** (only when user explicitly requests):

Scan `src/`, `scripts/`, `prisma/`, and root config files. Do not run unbounded scans without explicit request.

Always state the diff scope in the review header.

---

## Phase 1 — Dependency Security (pnpm)

Use **pnpm only** (never npm/yarn). Run from repository root:

```bash
# Known vulnerabilities in direct + transitive deps
pnpm audit

# JSON output for structured parsing
pnpm audit --json 2>/dev/null || pnpm audit

# Outdated packages (upgrade candidates for patched versions)
pnpm outdated

# Optional: inspect why a vulnerable package is installed
pnpm why <package-name>
```

### What to report

| Severity | Action |
|----------|--------|
| critical / high | Block merge; recommend pinned upgrade or override with documented reason |
| moderate | Recommend upgrade in this PR or immediate follow-up |
| low / informational | Note; batch with routine maintenance |

Cross-reference new dependencies in the diff against `package.json` / `pnpm-lock.yaml` changes:

- Is the package maintained and necessary?
- Does it expand attack surface (native bindings, postinstall scripts, network at install time)?
- Are versions pinned responsibly in lockfile?

---

## Phase 2 — Application Security

Review changed files for logic flaws. Prioritize by severity.

### Authentication & sessions

- Session cookie flags: `httpOnly`, `secure` (production), `sameSite` — see `$lib/server/helpers/cookies.ts`
- JWT validation failures must reject requests; no silent anonymous elevation
- `populateAuthenticatedUser` in hooks — controllers must re-verify authorization, not trust client input
- Logout and account deletion must invalidate sessions
- TOTP/OAuth state parameter validation (`validateAuthState`)

### Passwords & crypto

- Passwords hashed with `bcryptjs` via server helpers — never plaintext storage or custom hashes
- Compare passwords with constant-time helpers (`doPasswordsMatch`)
- OTP/TOTP secrets from env (`OTP_PRIVATE_KEY`, `JWT_PRIVATE_KEY`) — never hardcoded or logged
- No weak randomness for security tokens (`Math.random` for secrets)

### Authorization & roles

- Moderation and owner actions gated server-side (`ownerRoleCheck`, role helpers in `$lib/shared/helpers/auth/role.ts`)
- Users cannot mutate resources they do not own unless role permits
- Admin/promote endpoints require explicit privilege checks
- IDOR: verify resource ownership using DB lookup, not client-supplied IDs alone

### Input validation & injection

- All API/form inputs validated with Zod in `request-schemas/` before use
- Raw SQL only via parameterized Prisma/`$queryRaw` with bound values — no string concatenation
- HTML/Markdown sanitized (`sanitize-html`, markdown pipelines) before render or storage
- File uploads: size limits from application configuration; type/size checks server-side

### Server-side logic errors

- Error responses must not leak stack traces or internal paths in production (`hooks.server.ts` pattern)
- Sensitive fields redacted in logs (`$lib/server/logging/redaction.ts`)
- Rate limiting on abuse-prone endpoints (`consumeRateLimit`)
- SSRF: validate outbound URLs if fetching user-supplied links
- Secrets not in client bundle — no `$env/static/public` for private keys

### SvelteKit-specific

- No `$lib/server` imports in client components
- `+server.ts` routes delegate to controllers; auth checks inside controllers
- Form actions validate server-side even if client validates

---

## Output Format

```markdown
## Security Audit — <scope: staged | branch | full>

### Dependency findings
| Severity | Package | Issue | Recommendation |
|----------|---------|-------|----------------|

### Application findings
| Severity | Location | Finding | Recommendation |
|----------|----------|---------|----------------|

### Summary
- Critical/High: N
- Moderate: N
- Low/Info: N
- Verdict: PASS | PASS WITH NOTES | BLOCK
```

Sort findings by severity (Critical → High → Moderate → Low → Info).

**Severity guide:**

- **Critical** — exploitable without auth, RCE, secret exposure, auth bypass
- **High** — IDOR, privilege escalation, weak crypto, SQL injection risk
- **Moderate** — missing validation, verbose errors, missing rate limit on sensitive endpoint
- **Low/Info** — defense-in-depth improvements, outdated low-severity deps

---

## Rules

- **Read-only review** — report findings; do not fix unless user asks
- **Evidence-based** — cite file:line and the vulnerable pattern
- **No false positives without note** — if uncertain, mark as "verify" with reasoning
- **pnpm only** for package commands
- Default to **staged diff**; expand scope only when user requests or staged is empty
