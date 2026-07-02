---
name: code-performance
description: >-
  Performance review for Dexbooru Web: database indexes, query efficiency, rate
  limiting, memory and CPU tradeoffs. Default scope is staged git changes; user
  may request branch or full-repo review.
disable-model-invocation: true
---

# Code Performance Subagent

Review code changes for performance regressions and missing optimizations. Output actionable findings for agentic coders.

## When to Run

- User asks for performance review or `/code-performance`
- Before merging DB schema/query changes, list endpoints, bulk operations, image processing, or caching logic
- When adding N+1-prone relation loads or new hot-path API routes

## Diff Scope (default → optional)

**Default:** staged changes only.

```bash
git diff --cached
git diff --cached --name-only
```

If staged diff is empty, fall back to unstaged and state scope.

**Branch diff** (when user asks):

```bash
git diff $(git merge-base HEAD origin/main)...HEAD
```

**Full codebase** (only when user explicitly requests):

Focus on `src/lib/server/db/`, controllers with list/search endpoints, `prisma/schema/`, middleware, and image/upload pipelines.

Always state the diff scope in the review header.

---

## Phase 1 — Database & Queries

### Indexes (Prisma)

Existing patterns in `prisma/schema/`:

- Foreign keys indexed: `authorId`, `postId`, `userId`
- Filter + sort composites: `@@index([moderationStatus, createdAt(sort: Desc)])`
- Review status queues: `@@index([reviewStatus, createdAt])`

**Flag when diff introduces:**

- New `where` / `orderBy` on unindexed columns used at scale
- Queries that filter on one column and sort on another without composite index
- Missing index after adding a foreign key used in joins
- `@@unique` omitted where uniqueness is assumed in application logic

**Recommend:** concrete `@@index([...])` additions in the appropriate `prisma/schema/*.prisma` file.

### Query patterns in `db/actions/`

| Anti-pattern | Prefer |
|--------------|--------|
| `findMany` without `select`/`include` discipline | Explicit `select` for list views |
| N+1 loops calling `findUnique` per item | `findMany` with `where: { id: { in: ids } }` or `include` |
| Unbounded `findMany` | Pagination (`take`/`skip` or cursor); respect config limits |
| `count` + `findMany` as separate full scans | Consider `$transaction` or combined strategy when hot |
| Loading full relation graphs for card/list UI | Minimal selectors (`PUBLIC_POST_SELECTORS` pattern) |

### Raw SQL

`$queryRaw` usage (e.g. application configuration validation) must:

- Use parameterized queries
- Avoid full table scans on large tables without `WHERE` limits
- Consider index support for aggregated columns (`max`, `min` length checks)

---

## Phase 2 — Rate Limiting & Caching

### Rate limits

Implementation: `$lib/server/middleware/rateLimit.ts` + `$lib/server/constants/rateLimit.ts`

- Abuse-prone mutations (likes, comments, auth attempts) should use `consumeRateLimit`
- Limits configurable via `instance-configuration.yaml` (`rateLimit` section)
- **Fail-open on Redis failure** is intentional — do not flag as bug; note if new endpoints skip rate limiting entirely

**Flag when:**

- New public mutation endpoint has no rate limit
- Rate limit key uses easily spoofed identifier without IP fallback
- Window/max values are hardcoded instead of using application configuration

### Redis caching

Review `$lib/server/applicationConfiguration/cache.ts` and similar patterns:

- Cache invalidation on writes
- TTL appropriate to data freshness requirements
- Avoid caching large payloads without size bounds

---

## Phase 3 — Memory & CPU Tradeoffs

### Image processing (Sharp)

- Resize/compress before S3 upload — avoid loading full-resolution buffers multiple times
- Stream where possible for large files
- Respect `maximumPostImageUploadSizeMb` and related config limits

### Node.js / API handlers

| Concern | Guidance |
|---------|----------|
| Sync CPU on request path | Offload heavy work to queues (RabbitMQ/SQS publishers exist) |
| Large in-memory arrays | Paginate; stream CSV/exports |
| `Promise.all` fan-out | Cap concurrency for DB/external API calls |
| JSON serialization | Avoid serializing huge objects to client |
| Logging | `redaction.ts` — also avoid logging large payloads every request |

### Client bundle (secondary)

- Prefer individual Flowbite imports (already project convention) — avoids barrel bloat
- Lazy-load heavy client modules where routes already split by SvelteKit

### List endpoints & search

Controllers under `getPosts`, search, tags/artists indexes:

- Pagination enforced server-side
- Sort columns should match indexed fields
- Full-text or ILIKE scans on large tables need index strategy or dedicated search

---

## Phase 4 — Infrastructure Awareness

Local dev uses Docker Compose (postgres, redis, localstack). Performance findings should note:

- Dev DB size ≠ production — flag algorithmic complexity, not just constant factors
- Redis unavailable → rate limit fail-open (availability over strict limiting)
- S3/Localstack latency differs from CloudFront CDN in production

---

## Output Format

```markdown
## Performance Review — <scope: staged | branch | full>

### Database & queries
| Impact | Location | Finding | Recommendation |
|--------|----------|---------|----------------|

### Rate limiting & caching
| Impact | Location | Finding | Recommendation |
|--------|----------|---------|----------------|

### Memory & CPU
| Impact | Location | Finding | Recommendation |
|--------|----------|---------|----------------|

### Summary
- High: N
- Medium: N
- Low: N
- Verdict: PASS | PASS WITH NOTES | NEEDS WORK
```

**Impact guide:**

- **High** — likely production degradation (missing index on hot path, N+1 at scale, unbounded query)
- **Medium** — inefficiency under load; fix soon
- **Low** — micro-optimization or future-proofing

---

## Rules

- **Read-only review** — report findings; do not fix unless user asks
- **Evidence-based** — cite file:line and expected load context
- Prefer concrete fixes (index definition, query rewrite sketch) over vague "optimize this"
- Default to **staged diff**; expand scope only when user requests or staged is empty
- Do not recommend premature optimization on cold paths (admin-only, seed scripts)
