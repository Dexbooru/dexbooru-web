# Dexbooru Web — Agent Guide

Canonical instructions for AI agents working in this repository. Refresh this file when project conventions or structure change materially.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | Svelte 5, SvelteKit 2, Tailwind CSS 4 |
| Components | Flowbite-Svelte, Flowbite-Svelte-Icons |
| Backend | Node.js ≥20, SvelteKit API routes |
| Database | PostgreSQL, Prisma 7 |
| Cache / rate limits | Redis |
| Object storage | AWS S3 (Localstack locally) |
| Messaging | RabbitMQ, AWS SQS |
| Validation | Zod 4 |
| Testing | Vitest 4 |
| Package manager | **pnpm only** (`preinstall` enforces this) |

---

## Local Development

### Prerequisites

- Node.js ≥20
- pnpm (`packageManager` in `package.json`)
- Docker + Docker Compose
- `.env` at repo root (see `.env.example` and `README.md`)

### Core commands

```bash
pnpm install          # install deps; runs prisma generate via postinstall
pnpm dev              # Vite dev server (default http://localhost:5173)
pnpm build            # production build
pnpm run-build        # run built app
pnpm check            # svelte-check + TypeScript
pnpm test             # vitest run
pnpm test:coverage    # coverage report
pnpm lint             # prettier + eslint
pnpm lint:fix         # auto-fix
```

### Database (Prisma)

```bash
pnpm dbmigrate        # prisma migrate dev
pnpm dbreset          # migrate reset (dev only)
pnpm dbpush           # db push
pnpm dbseed           # force-reset + seed
pnpm dbstudio         # Prisma Studio
pnpm dbgenerate       # regenerate client
pnpm datamigration:run   # run custom data migrations
pnpm appconfig:sync   # sync instance-configuration.yaml overrides
```

### Docker services

`docker-compose.yml` runs **postgres**, **redis**, **localstack** (S3 + SQS), and optionally **app**.

```bash
# Start infra only (typical local dev)
docker compose up postgres redis localstack -d

# Or use helper scripts from README:
# scripts/setup-db.sh       — postgres + redis + seed
# scripts/setup-aws-resources.sh — legacy localstack setup
pnpm setup:localstack     — init S3 buckets + SQS queues via init script
```

Localstack endpoint: `http://localhost:4566`. Buckets and queues are created by `scripts/init-localstack.sh` on container ready.

### Instance configuration

Optional `instance-configuration.yaml` at repo root overrides runtime limits (auth, posts, rate limits, etc.). Sync with `pnpm appconfig:sync`.

---

## Project Structure

```
src/
├── lib/
│   ├── client/     # Browser-only: components, api clients, helpers, stores
│   ├── server/     # Node-only: never import into client components
│   └── shared/     # Safe on both sides: types, constants, pure helpers
├── routes/
│   ├── api/        # Thin +server.ts handlers → lib/server/controllers
│   └── [pages]/    # +page.svelte, +page.server.ts, +layout.*
├── hooks.server.ts
└── app.css

tests/              # Mirrors src/lib layout; mocks in tests/mocks/
prisma/schema/      # Split Prisma schema files
scripts/            # One-off scripts, localstack init, data migrations
```

---

## lib/ Boundaries — Where Code Belongs

### `$lib/client` — browser only

Put code here when it uses DOM APIs, `fetch` wrappers for the UI, Svelte components, client-side state, or browser-only helpers.

```
client/
├── api/            # fetch() wrappers calling /api/* (e.g. posts.ts, users.ts)
├── components/     # .svelte UI (auth/, posts/, moderation/, reusable/)
├── constants/      # UI labels, toast options, layout tokens
├── helpers/        # Client-side formatting, URL builders, draft storage
├── notifications/  # WebSocket client classes
└── types/          # Client-specific response shapes (ICoreApiResponse, etc.)
```

**Never** import `$lib/server/*` from client code or `.svelte` files that ship to the browser.

### `$lib/server` — Node.js only

Secrets, DB, auth, file processing, email, AWS, Redis, RabbitMQ.

```
server/
├── controllers/        # Request handlers (handleCreatePost, handleUserAuth…)
│   └── request-schemas/  # Zod schemas per domain
├── db/
│   ├── actions/        # Prisma queries (one module per entity)
│   └── prisma.ts
├── helpers/            # controllers.ts, sessions, cookies, password, oauth
├── middleware/         # rateLimit.ts
├── applicationConfiguration/
├── logging/
├── rabbitmq/
├── constants/
└── types/
```

**Route files stay thin.** Example pattern:

```typescript
// src/routes/api/posts/+server.ts
import { handleCreatePost, handleGetPosts } from '$lib/server/controllers/posts';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
  return (await handleGetPosts(request, 'api-route')) as ReturnType<RequestHandler>;
};
```

Business logic lives in `controllers/` and `db/actions/`, not in `+server.ts`.

### `$lib/shared` — isomorphic

Pure functions, Zod-free or runtime-safe validation helpers, constants, and DTO types used by both client and server.

```
shared/
├── types/          # TUser, TPost, auth form field types
├── helpers/        # password/username rules, labels, comments
├── constants/      # session keys, auth defaults, pagination limits
└── applicationConfiguration/
```

**Share when:** no Node/browser APIs, no secrets, no Prisma imports.

**Do not share when:** the code touches `process.env`, filesystem, DB, cookies, or JWT signing — keep that in `server/`.

---

## TypeScript Conventions

### Inference over annotation

Prefer inferred types. Add explicit types at module boundaries (exported APIs, Zod-inferred shapes, public controller signatures) only when inference is unclear.

```typescript
// Good — inference
const count = data.length;
export async function deletePostById(postId: string) { … }

// Good — boundary type
export type TUser = User & { preferences: TPreference };

// Avoid — redundant locals
const count: number = data.length;
```

### `type` vs `interface`

This codebase **prefers `type`** for data shapes, unions, and mapped types. **`interface`** is reserved for extensible contracts (e.g. `IOauthProvider`) and a few client response wrappers (`ICoreApiResponse`).

| Use | Pattern | Example |
|-----|---------|---------|
| Data / DTO / union | `type` with `T` prefix | `TPost`, `TLoginFormFields` |
| Extensible contract | `interface` with `I` prefix | `IOauthProvider` |
| Class implementations | `class` | `GoogleOauthProvider`, `NotificationWebSocketClient` |

### Naming

| Kind | Convention | Example |
|------|------------|---------|
| Types | `T` + PascalCase | `TRequestSchema`, `TRateLimitRedis` |
| Interfaces | `I` + PascalCase | `IOauthProvider` |
| Functions | camelCase verb phrases | `handleCreatePost`, `findUserByName` |
| Constants | SCREAMING_SNAKE or camelCase objects | `SESSION_ID_KEY`, `NULLABLE_USER` |
| Files (TS) | camelCase | `getPostComments.ts`, `rateLimit.ts` |
| Components | PascalCase.svelte | `LoginForm.svelte` |
| Controller handlers | `handle` + action | `handleUserAuthFlowValidate` |
| DB actions | verb + entity | `deletePostById`, `findUserByEmail` |

### Classes vs functions

- **Functions** for stateless logic (most of the codebase).
- **Classes** when extending a base (`SkeletonOauthProvider`), encapsulating connection state (`NotificationWebSocketClient`), or publisher patterns (`NewPostCommentPublisher`).

### Request handling

Controllers use `validateAndHandleRequest` with Zod schemas from `request-schemas/`. Handler variant is `'api-route'` or `'form-action'`. Use `createSuccessResponse` / `createErrorResponse` from `$lib/server/helpers/controllers`.

---

## Comments

**Minimize comments.** Code should read through naming and structure.

Add a comment only when it explains non-obvious *why* (security tradeoff, fail-open behavior, external API quirk, Prisma workaround). Never narrate *what* the next line does.

```typescript
// Good — explains policy
// Fail-open: do not block traffic when Redis is unavailable.
logger.error('Rate limit check failed (Redis); allowing request', …);

// Bad
// Increment the counter
const count = await redis.incr(key);
```

---

## Svelte 5 Practices

Use runes — no legacy `export let` for component props.

```svelte
<script lang="ts">
  type Props = {
    form: ActionData;
  };

  let { form }: Props = $props();
  let showPassword = $state(false);
  const disabled = $derived.by(() => !(username.length > 0 && password.length > 0));
</script>
```

- **`$props()`** — component inputs with a `Props` type
- **`$state()`** — mutable local state
- **`$derived` / `$derived.by()`** — computed values
- Import route types from `$types` where applicable (`ActionData`, `PageData`)
- Use `$app/state` (`page`) instead of deprecated stores where the codebase already does

**Before shipping Svelte changes:** run the Svelte MCP `svelte-autofixer` on new/edited components until clean.

**SvelteKit patterns:**
- Form mutations: `+page.server.ts` actions
- API: `+server.ts` delegating to controllers
- Auth user on server: `event.locals.user` populated in `hooks.server.ts`

---

## Flowbite-Svelte

Import components individually — do not barrel-import the whole library.

```svelte
import Button from 'flowbite-svelte/Button.svelte';
import Input from 'flowbite-svelte/Input.svelte';
import Card from 'flowbite-svelte/Card.svelte';
import EyeOutline from 'flowbite-svelte-icons/EyeOutline.svelte';
```

Common components in this project: `Button`, `Input`, `Label`, `Card`, `Checkbox`, `Alert`, `Modal`, `Tabs`/`TabItem`, `Textarea`, `Avatar`, `Fileupload`, `Dropdown`, `Badge`.

Combine Flowbite structure with Tailwind utility classes (`class="mt-4 p-6 shadow-lg"`). Use `dark:` variants for theme support.

Charts: `@flowbite-svelte-plugins/chart` where needed.

Docs: https://flowbite-svelte.com

---

## Testing Requirements

**All shipped code must include meaningful tests** covering happy path, error/validation paths, and edge cases. Do not merge behavior changes without tests.

### Layout

Tests mirror source under `tests/`:

```
tests/lib/server/controllers/posts/createPost.test.ts  ↔  src/lib/server/controllers/posts/createPost.ts
tests/db/actions/post.test.ts                          ↔  src/lib/server/db/actions/post.ts
```

Co-located tests also exist (e.g. `src/lib/shared/helpers/__tests__/`) — prefer `tests/` for new server/controller tests to match existing convention.

### Running tests

```bash
pnpm test                    # full suite
pnpm test path/to/file.test.ts
pnpm test:coverage
```

### Mocking

- Global mocks in `tests/setup.ts` (Prisma, Redis, SvelteKit `redirect`/`error`/`fail`, AWS, logger)
- Reusable mocks in `tests/mocks/` — mirror `src/lib/server` structure
- Configure behavior per test via exported mock objects from `tests/mocks/index.ts`
- **Do not** add `vi.mock()` in test files for modules already globally mocked (hoisting issues)
- To test real DB action logic: `vi.unmock('$lib/server/db/actions/…')` at top of file before imports
- When adding repository/helper methods, update corresponding mocks

### What to test

| Layer | Focus |
|-------|--------|
| Controllers | Auth gates, validation failures, success responses, side effects |
| DB actions | Query behavior with mocked Prisma; edge cases (not found, constraints) |
| Shared helpers | Pure logic, boundary values |
| Validation (Zod + custom) | Invalid input, min/max, cross-field rules |
| Middleware | Rate limit exceeded, fail-open, key construction |

Example edge-case coverage (from existing tests):

```typescript
it('rejects reduced varchar lengths below current row data max', async () => { … });
it('allows increased minimumUsernameLength when there are no users', async () => { … });
```

---

## Database & Performance Expectations

- Encapsulate all Prisma access in `db/actions/`
- Add `@@index` for columns used in `where`, `orderBy`, and join filters — see `prisma/schema/*.prisma`
- Composite indexes for common filter + sort patterns (e.g. `[moderationStatus, createdAt(sort: Desc)]`)
- Rate limiting via Redis (`consumeRateLimit` in `$lib/server/middleware/rateLimit.ts`) — respect `rateLimit` section in instance config
- Use `select`/`include` intentionally; avoid over-fetching large relations in list endpoints

---

## Security Expectations

- Validate all input server-side with Zod — client validation is UX only
- Auth: session JWT in httpOnly cookie (`SESSION_ID_KEY`); check `event.locals.user` in controllers
- Password hashing via server helpers (`bcryptjs`) — never roll custom crypto
- Role/moderation checks in controller layer before mutations (see `ownerRoleCheck.ts`, moderation controllers)
- Redact sensitive fields in logs (`redaction.ts`)
- Never commit secrets; use `.env` locally

For automated review of changes, invoke the **security-audit** subagent (see `.agents/subagents/security-audit/SKILL.md`).

---

## Agent Subagents

Specialized review agents live in `.agents/subagents/`. Symlinked into `.cursor/skills/`, `.claude/skills/`, and `.gemini/skills/`.

| Subagent | Purpose | Invoke when |
|----------|---------|-------------|
| `security-audit` | Dependency vulnerabilities + app-level security | Before merging auth, crypto, or API changes |
| `code-performance` | Indexes, rate limits, memory/CPU tradeoffs | Before merging DB queries, list endpoints, or hot paths |

**Default scope:** staged changes (`git diff --cached`). User may request branch diff or full codebase scan explicitly.

---

## Svelte MCP Tools

When working on Svelte/SvelteKit:

1. `list-sections` — discover docs
2. `get-documentation` — fetch relevant sections
3. `svelte-autofixer` — validate components (required before shipping)
4. `playground-link` — only on user request, never for project files

---

## Quick Checklist Before Shipping

- [ ] Code in correct `lib/` tier (client / server / shared)
- [ ] No server imports in client bundle
- [ ] Types inferred where possible; `T`/`I` prefixes at boundaries
- [ ] Minimal comments
- [ ] Zod validation on server inputs
- [ ] Tests for major, minor, and edge cases
- [ ] `pnpm test` and `pnpm check` pass
- [ ] Svelte components validated with autofixer
- [ ] Flowbite imports are per-component paths
