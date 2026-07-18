# Controller Strategies Playbook

Use this when adding routes that look like an existing family (paginated post lists by label, reportable entities, etc.). Prefer registering a strategy over cloning a controller file.

## Layout

| Path | Role |
|---|---|
| `src/lib/server/controllers/strategies/withRemoteCache.ts` | Cache-aside helper |
| `src/lib/server/controllers/strategies/createCachedPaginatedHandler.ts` | Factory for cached paginated post lists |
| `src/lib/server/controllers/strategies/createReportHandlers.ts` | Factory for report CRUD handlers |
| `src/lib/server/controllers/strategies/postsByLabel.ts` | Tag / artist / character / source / author registry |
| `src/lib/server/controllers/strategies/reports.ts` | Post / user / collection report registry |
| `src/lib/server/db/actions/reportFactory.ts` | Shared Prisma report actions |
| `src/lib/client/api/reportClient.ts` | Shared browser report API client |
| `src/lib/server/helpers/postHydration.ts` | `tagString` / `artistString` → entities |

Routes stay thin: import a named handler and call it.

## Cached paginated list (new label / filter)

1. Add or reuse a Zod request schema (see `createGetPostsByNameSchema` in `request-schemas/posts.ts`).
2. Add a DB finder in `db/actions/*` (or reuse an existing one).
3. Add a cache key helper + TTL in `cache-strategies/`.
4. Append a `TPostsByLabelStrategy` object in `strategies/postsByLabel.ts` (or a new registry file for a new family).
5. Export `handleX = createCachedPaginatedHandler(strategy)`.
6. Re-export from the domain `index.ts` if needed.
7. Point the route at that named export (same one-liner pattern as today).

Example strategy sketch:

```ts
const fooStrategy: TPostsByLabelStrategy = {
  schema: GetPostsWithFooSchema,
  getLabel: (data) => data.pathParams.name,
  buildCacheKey: (label, page, orderBy, ascending) =>
    getCacheKeyWithPostCategoryWithLabel('tag', label, page, orderBy, ascending),
  cacheTtlSeconds: CACHE_TIME_TAG_POSTS,
  findPosts: ({ label, pageNumber, pageLimit, orderBy, ascending, selectors }) =>
    findPostsByFoo(label, pageNumber, pageLimit, orderBy, ascending, selectors),
  successMessage: (label) => `Successfully fetched posts for: ${label}`,
  errorMessage: 'An unexpected error occurred while fetching posts',
};

export const handleGetPostsWithFoo = createCachedPaginatedHandler(fooStrategy);
```

Optional hooks:

- `shouldCache(handlerType)` — e.g. author lists only cache on `page-server-load`
- `enrichResponse(pagination, label)` — attach extra fields (e.g. `author`)

## New reportable entity

1. Add the Prisma model.
2. Create thin DB exports via `createReportActions(prisma.fooReport, 'fooId')`.
3. Add request schemas (create / getByTarget / getGeneral / delete / updateStatus).
4. Add one `TReportStrategy` entry in `strategies/reports.ts`.
5. Destructure named handlers from `createReportHandlers(strategy)` and export them.
6. Add client config via `createReportClientApi({...})`.
7. Add routes that call the named handlers.

`resolveCreateTarget` / `resolveGetTarget` / `resolveDeleteTarget` encode entity-specific lookup (direct id vs username resolve vs existence check). Use `onStatusUpdated` for side effects (e.g. flag user when a report is accepted).

## Rules of thumb

- Do not copy a 100-line controller to make a sibling route.
- Keep public handler names stable so routes and tests stay boring.
- Prefer shared hydration (`hydratePostsTagAndArtistEntities`) over inline `split(',')` maps.
- If a new route family appears twice, extract a factory before the third copy.
