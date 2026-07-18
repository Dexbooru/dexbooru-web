# Dexbooru-Web Codebase Audit

**Date:** 2026-07-17  
**Scope:** `src/`, `scripts/`, controllers/DB/cache/upload/rate-limit hot paths  
**Verdict:** Solid bones, industrious copy-paste, and a few landmines that will eventually explode in production. The architecture *wants* to be clean — thin routes, fat controllers, `db/actions`, cache strategies, RabbitMQ publishers — but the codebase keeps solving the same problem five times instead of once.

Grades below are harsh on purpose. This is not “bad junior code.” It’s competent product code that never got a second pass for abstraction, security, or scale.

| Category | Grade | One-liner |
|---|---|---|
| DRYness | **D+** | You invented Ctrl+C as a design pattern |
| Module organization | **B-** | Good skeleton, soft boundaries, weird names |
| Dead code | **C** | Not a graveyard, but corpses and typos remain |
| Performance & ops | **D** | Caching exists; rate limits don’t; SQL is spicy |
| Design patterns / ugliness | **C+** | Half-applied patterns, half-manual boilerplate |

---

## 1. DRYness — “Ctrl+C is not a design pattern”

### Grade: D+

The request-validation layer (`validateAndHandleRequest`) is actually good and used widely. Everything *inside* those handlers is where DRY went to die.

### 1.1 The “get posts by label” quintet

Five controllers that are ~95% the same text:

- `getPostsWithTagName.ts` (104 lines)
- `getPostsWithArtistName.ts` (105)
- `getPostsWithCharacterName.ts` (105)
- `getPostsWithSourceTitle.ts` (105)
- `getPostsByAuthor.ts` (105)

That’s **~524 lines** of “check cache → query → split `tagString`/`artistString` → cache → return,” differing mostly by entity name and which cache TTL constant you paste in.

The same clone factory exists one layer down:

- `findPostsByTagName` / `findPostsByArtistName` / `findPostsByCharacterName` / `findPostsBySourceTitle`
- Four near-identical Zod schemas in `request-schemas/posts.ts`

**Bonus humiliation:** `getPostsWithTagName` returns a success message about the *artist* name. Even the copy-paste didn’t get proofread.

```83:87:src/lib/server/controllers/posts/getPostsWithTagName.ts
				return createSuccessResponse(
					handlerType,
					`Successfully fetched the posts with the artist name of: ${tagName}`,
					responseData,
				);
```

### 1.2 Reports: triplicated end-to-end

Post / user / collection reports are the same CRUD pipeline, three times, at every layer:

| Layer | Multiplicity |
|---|---|
| Controllers | 3 folders × ~5 handlers ≈ 18 files |
| DB actions | `postReport.ts`, `userReport.ts`, `collectionReport.ts` |
| Client API | `postReports.ts`, `userReports.ts`, `collectionReports.ts` (35 lines each) |

This is the textbook case for a generic report repository + thin config. Right now adding a fourth reportable entity means cloning ~9 files and hoping you don’t typo `occcured` again.

### 1.3 Image pipelines: four flavors of the same blender

In `helpers/images.ts`:

- `runPostImageTransformationPipeline`
- `applyCollectionImageTransformationPipeline`
- (plus profile-picture cousins)

Same shape: webp → resize → optional blur. Width/height constants are the only real difference. That’s a strategy/config object, not four functions.

### 1.4 Tag/artist string hydration copy-pasta

```ts
post.tags = post.tagString.split(',').map((tag) => ({ name: tag }));
post.artists = post.artistString.split(',').map((artist) => ({ name: artist }));
```

Appears in ~8 controllers. `getPost.ts` even has a local `assignTagAndArtistEntities` helper — and **nobody else uses it**. The DRY instinct fired once and then went back to sleep.

### 1.5 What you did right (so the grade isn’t an F)

- `validateAndHandleRequest` / response helpers — consistent, reused (~85/144 controllers)
- `BasePublisher<T>` — real Template Method, not cargo cult
- Cache key helpers in `cache-strategies/*` — at least the *keys* are centralized even when the *flow* isn’t

**Brutal summary:** You abstract the boring HTTP ceremony and then hand-copy the business logic like it’s 2014 WordPress plugin development.

---

## 2. Module organization — “Good folders, soft laws”

### Grade: B-

### What’s working

```
src/lib/{client,server,shared}
src/lib/server/{controllers,db/actions,helpers,middleware,rabbitmq,aws,events,...}
```

Routes are thin. Controllers own orchestration. DB actions mostly own Prisma. Shared types live in `shared/`. That’s a real architecture, not a SvelteKit junk drawer.

### What’s soft or dishonest

1. **Layering leaks**  
   Controllers generally go through `db/actions`, except when they don’t:
   - `fetchResourceGenerics.ts` hits `prisma` directly
   - `getAdvancedPostSearchResults.ts` runs `prisma.post.findMany(ormQuery)` inline  
   The rule is “usually,” which is the worst kind of rule.

2. **Naming that lies**  
   - `fetchResourceGenerics` = site-wide counts, not TypeScript generics  
   - `notifcations.ts` — the typo is the filename; the whole import graph worships it  
   - `reports/` vs `postReports/` / `userReports/` / `collectionReports/` — three siblings that should be one module with config

3. **Two test religions**  
   - `tests/**` (~62 files)  
   - `src/**/__tests__` (~6 files)  
   No documented convention. New code picks a church at random.

4. **Fat files emerging**  
   - `db/actions/user.ts` (~399 lines)  
   - `db/actions/post.ts` (~369)  
   - `request-schemas/users.ts` (~308)  
   Not catastrophic yet, but these are the files that become un-reviewable.

5. **Pub/sub schizophrenia**  
   - App config: Redis pub/sub (multi-instance aware)  
   - Upload status: in-process `EventEmitter` (single-instance only)  
   Same problem domain (fan out events to clients), opposite scale stories. Horizontal scale will silently break SSE upload progress while config invalidation keeps working — the worst kind of “works on my machine / one pod.”

6. **Scripts folder is a landfill with a useful entrance**  
   Useful seed/migration scripts live next to a **382MB** local `scripts/venv` (gitignored, still a local tax). Repo root also keeps stale `vite.config.ts.timestamp-*.mjs` and `.env.bak`. Hygiene is not organization, but the mess makes the tree feel larger than the product.

**Brutal summary:** You built a decent airport. Gates are labeled inconsistently, some planes land on the taxiway, and half the security scanners are unplugged.

---

## 3. Dead code — “Not haunted, but dusty”

### Grade: C

### Confirmed corpses / zombies

| Item | Evidence |
|---|---|
| `NoPostsFound.svelte` | Zero imports. `PostGrid.svelte` inlines `"No posts found"` instead |
| `hideImageCarousel: false` in `findUserSelf` select | Prisma `select: false` *excludes* the field — preference is persisted/read elsewhere but this query never returns it. Live bug wearing a “dead field” costume |
| Phantom `apexcharts` type import | `analytics.ts` imports a module not in `package.json` |
| Compile holes | `Prisma` namespace used in `post.ts` without import; `scripts/helpers/dumpData.ts` has multiple TS errors |

### Floating-promise zombies (dead *await*, living race)

`deleteCommentById` fires count decrements without `await`:

```101:123:src/lib/server/db/actions/comment.ts
	if (deletedComment.parentCommentId) {
		prisma.comment.update({
			// ...
		});
	}

	prisma.post.update({
		// ...
	});
```

`createComment` awaits the symmetric updates. Delete path is the drunk twin.

`createPost` rollback similarly fire-and-forgets `deletePostById` / `deleteBatchFromBucket` — rollback that may not finish before the process moves on.

### Dead *intent* rather than dead files

- Rate-limit middleware is fully built… and used in **one** controller (`likePost`). Everywhere else it’s dead infrastructure.
- Cache association lists (`cacheMultipleToCollectionRemotely`) exist for list→post invalidation, but create-post invalidation hardcodes **page 0** keys only. The machinery is smarter than its callers.

### Hygiene tells

- Filename typo `notifcations.ts` propagated across client + routes
- `"occured"` / `"Enqueing"` typos everywhere (consistency of error messaging: wrong)
- Zero `TODO`/`FIXME` in `src`/`scripts` — either monastic discipline or comments get stripped while bugs stay
- ESLint is clean across hundreds of files while `tsc` still finds real errors → lint is a vibe check, not a gate

**Brutal summary:** You don’t have a dead-code museum. You have a few abandoned components, a preference field that gaslights the UI, and async cleanup that shrugs and walks away.

---

## 4. Performance — “Cache is not a personality”

### Grade: D

Caching is present and often thoughtful. Rate limiting is theater. Search is a security incident wearing a performance hat. Uploads ask the Node process to be ImageMagick.

### 4.1 CRITICAL — SQL injection in search

`db/actions/search.ts` interpolates user query into SQL via `Prisma.raw`:

```17:19:src/lib/server/db/actions/search.ts
          t."searchable" @@ phraseto_tsquery('english', ${Prisma.raw(`'${query}'`)}) OR
          LOWER(t."name") ILIKE ${Prisma.raw(`'%${query}%'`)} OR
          LOWER(t."id") ILIKE ${Prisma.raw(`'%${query}%'`)}
```

All five section searchers do this. `Prisma.raw` does **not** escape. The request schema only lowercases/trims. Tests mock `$queryRaw` and never assert the SQL string.

Same file also skips moderation filters — rejected/flagged content can leak through search while other list endpoints filter `PENDING`/`APPROVED`. Advanced search `QueryBuilder` has the same gap: no default moderation clause unless the user types one.

This is not “perf debt.” This is “please don’t put this on the public internet until fixed.”

### 4.2 Rate limiting: built, then abandoned

`consumeRateLimit` is a real Redis fixed-window limiter (fail-open on Redis errors — fine for availability, bad for abuse).

Used by: **`likePost` only.**

Not used by:

- login / registration / password recovery
- comment create
- post upload (CPU + S3 + SQS heavy)
- search
- webhooks (aside from a non-timing-safe secret compare)

`hooks.server.ts` does config load + auth populate. No global throttle. Fixed-window also allows ~2× burst at boundaries — academic for a limiter nobody calls.

### 4.3 Database query performance

**Unindexed / poorly indexed paths**

- Public `orderBy` allows `views` and `updatedAt`; schema indexes favor `createdAt` / `likes` / `commentCount` with `moderationStatus`. Sorting by `views`/`updatedAt` invites sort+scan pain as the table grows.
- Tag/artist listing uses `tagString`/`artistString` `contains` (substring) — no `pg_trgm` GIN in schema. Character/source listing uses relational `sources.some` and can use FKs. Same product feature, two performance universes, historical denormalization winning by inertia.

**Similarity search**

`findSimilarPosts` pulls up to `MAXIMUM_SIMILAR_POSTS_PER_POST * 50` (= 300) candidates with sources into Node, scores in JS, then re-fetches winners. Fine at small scale; degrades when admins crank config or the corpus grows. Two round trips on every cache miss of a popular post.

### 4.4 Upload / CPU path

Post create pipeline (request thread):

1. Sharp webp + resize + optional Gaussian blur (`Promise.all` over images, no global concurrency cap)
2. S3 upload
3. Duplicate hash search
4. DB insert
5. SQS enqueue + RabbitMQ publish
6. Fire-and-forget ML index

Sharp work is in-process. Many concurrent uploads = CPU spikes on app pods. You already have SQS/RabbitMQ for async work — image transforms are the obvious candidate to offload, and they remain synchronous.

Also: SSE progress via in-process emitter means multi-instance deployments lie to the user about upload status.

### 4.5 Caching strategies — the bright spot with asterisks

**Good:**

- Dedicated `cache-strategies/*` for keys + TTLs
- List caches associate post IDs for invalidation (`cacheMultipleToCollectionRemotely`)
- Preference-aware similarity cache keys (hash of blacklist + safe mode)
- Negative cache for no-results search (300s) vs hits (60s)

**Ugly / incomplete:**

- Cache-aside boilerplate hand-rolled in 20+ controllers instead of `withCache(key, ttl, fn)`
- TTLs are a grab bag with no documented rationale (`35s` for post sources, `25s` comments, `60/120` posts by type)
- Create-post invalidates only page-0 general/uploaded/author/pending keys — other pages and orderings can stay stale until TTL
- Like path invalidates more carefully than create path (the association list exists; create doesn’t use it consistently)

### 4.6 Misc ops nits

- ML `fetch` calls have no timeout/`AbortController`
- Webhook secret compared with `!==` (timing side-channel; low practical risk, high “we know better” embarrassment)
- `logger.info(event)` every request depends on a custom formatter not dumping the whole RequestEvent — fragile contract

**Brutal summary:** You redis-cache list pages for a minute while leaving search injectable and uploads unthrottled. That’s rearranging deck chairs while the hull has a hole labeled `Prisma.raw`.

---

## 5. Ugly-but-working — “Patterns half-remembered”

### Grade: C+

These aren’t broken. They’re correct-enough procedures that scream for a named pattern.

### 5.1 Strategy pattern — posts-by-label

Replace five controllers + schemas with:

```ts
const strategies = {
  tag: { find: findPostsByTagName, cacheKey: ..., ttl: CACHE_TIME_TAG_POSTS },
  artist: { ... },
  // ...
};
```

One handler. One schema with a `labelType` or path discriminator. Delete ~400 lines of clones.

### 5.2 Repository / generic CRUD — reports

One `ReportService` parameterized by Prisma delegate + entity FK field + cache keys. Three config objects. Stop shipping DNA replicas.

### 5.3 Strategy / lookup table — moderation amend

`ownerAmendResourceModerationStatus` is already an if/else strategy:

```28:57:src/lib/server/controllers/moderation/ownerAmendResourceModerationStatus.ts
				if (payload.resourceType === 'post') {
					const updatedPost = await updatePost(payload.resourceId, {
						moderationStatus: payload.status,
					});
					// ...
				}

				if (payload.resourceType === 'user') {
					const updatedUser = await updateUserModerationStatus(payload.resourceId, payload.status);
					// ...
				}

				const updatedCollection = await updateCollectionModerationStatus(
```

Make it a map. Adding a fourth resource becomes data, not another branch.

### 5.4 Decorator / HOF — cache-aside

Every list controller reinvents:

```
cached = getRemoteResponseFromCache(key)
if (cached) return cached
data = await db...
hydrate tags/artists
cacheResponseRemotely(key, data, ttl)
associate keys
return success
```

Extract `withRemoteCache(key, ttl, compute)`. Controllers shrink to “build key + compute.”

### 5.5 Unified Observer — events

You already have Redis pub/sub for config. Upload SSE should use the same transport abstraction:

- Local `EventEmitter` in single-process/dev
- Redis (or Rabbit) in multi-instance/prod

Two emitters with different scale semantics is how you ship “works until we scale.”

### 5.6 Unify search builders

You have:

1. Raw SQL full-text + ILIKE (`db/actions/search.ts`) — injectable, no moderation defaults  
2. `QueryBuilder` class (`helpers/search.ts`) — token parser + Prisma where, still no default moderation  

That’s two independent search brains. Pick one abstraction, parameterize transport (FTS vs relational), always apply moderation defaults, always parameterize user input.

### 5.7 Positive exemplar: `BasePublisher<T>`

Template Method done right — exchange setup, retry logging, `toMessageDto`, publish/close. The reports and label controllers should be jealous of this file.

### 5.8 Transactions that aren’t

`createFriend` / `deleteFriend` do two sequential `user.update` connects/disconnects with no `$transaction`. Crash between them → one-way friendship. Functionally “works” until it doesn’t.

**Brutal summary:** You already know the patterns — you used them for RabbitMQ and request validation. Everywhere else you reimplemented the pattern with `if`, `copy`, and prayer.

---

## Priority fix list (if you only do five things)

1. **Fix SQL injection in `db/actions/search.ts`** — use parameterized `Prisma.sql` fragments / `$queryRaw` bindings; never `Prisma.raw` for user strings. Add a regression test that asserts the query is parameterized.
2. **Default moderation filters** on every public search/list path (raw SQL + `QueryBuilder`).
3. **Wire rate limiting** into auth, upload, comment, and search — or into `hooks` / `validateAndHandleRequest` so opt-in can’t be forgotten.
4. **Collapse the label + report clone armies** into strategy/repository modules (biggest maintainability win).
5. **Make upload transforms + SSE multi-instance safe** (offload Sharp; Redis-backed progress events).

Honorable mentions: await your counter updates; put `hideImageCarousel` back to `true` in the select; delete `NoPostsFound.svelte` or use it; rename `notifcations.ts`; run `svelte-check`/tsc in CI like you mean it.

---

## Closing roast

This codebase is what happens when a thoughtful engineer ships features faster than they extract patterns. The scaffolding is real: thin routes, controller helpers, cache strategy modules, Rabbit publishers, app-config hot reload. Then the product surface area grew sideways — tags/artists/characters/sources, three report types, two search systems — and each sibling was born by cloning its older brother.

It’s not unmaintainable today. It’s *expensive* tomorrow. The SQL injection and missing rate limits mean “tomorrow” might arrive as an incident, not a refactor ticket.

You don’t need a rewrite. You need a ruthless DRY pass, one security week, and the courage to delete the fifth copy of `getPostsWithX`.
