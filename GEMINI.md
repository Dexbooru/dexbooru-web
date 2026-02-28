# Dexbooru Web - Technology Guide

## Tech Stack

### Frontend

- **Svelte 5** - Reactive, compiler-based UI framework
- **SvelteKit** (v5) - Full-stack framework with routing, API endpoints, and server-side rendering
- **Flowbite-Svelte** - Component library providing pre-built, accessible UI components

### Backend

- **Node.js** - Runtime environment for server-side code
- **SvelteKit API Routes** - Server endpoints in `src/routes/api/`

### Database

- **PostgreSQL** - Relational database
- **Prisma** - Modern ORM for type-safe database access

### Development & Build

- **Vite** - Fast build tool and dev server (integrated with SvelteKit)
- **TypeScript** - Type checking and IDE support

---

## Project Structure

### `/src/lib` Directory Organization

The `lib` directory is organized into three main sections for clean separation of concerns:

#### `/src/lib/client`

Client-side utilities, stores, and helpers that run in the browser.

- Svelte stores for state management
- Client-side utility functions
- Browser-specific helpers
- Components that depend on client APIs

#### `/src/lib/server`

Server-only code that executes on the backend.

- Database queries and operations
- Authentication logic
- API helpers
- Secret handling
- Never import server code into client-side components

#### `/src/lib/shared`

Shared types, utilities, and logic usable by both client and server.

- Data type definitions
- Utility functions (formatting, validation, transformation)
- Constants
- API request/response schemas

### Key Directory Roles

```
src/
├── lib/
│   ├── client/        # Browser-only code
│   ├── server/        # Node.js backend only
│   ├── shared/        # Usable everywhere
├── routes/
│   ├── api/           # API endpoints (server)
│   └── [page]/        # Pages (client + server)
├── app.html           # HTML shell
├── app.css            # Global styles
└── hooks.server.ts    # Server hooks
```

---

## Important Guidelines

### TypeScript Usage

- Use TypeScript for type checking and IDE support
- **Avoid explicit type annotations in code** where possible - rely on type inference
- Let the TypeScript compiler infer types from assignments and function calls
- Only add explicit types when inference is ambiguous or for public API boundaries

**Good:**

```typescript
const user = await db.user.findUnique({ where: { id: userId } });
const count = data.length;
```

**Avoid:**

```typescript
const user: User = await db.user.findUnique({ where: { id: userId } });
const count: number = data.length;
```

### Code Comments

- **Minimize comments in code** - write code that is self-explanatory through clear naming
- Comments should explain _why_ something is done, not _what_ is being done
- Avoid comment-heavy code generation outputs
- If a function needs extensive comments to understand, refactor for clarity instead

**Good:**

```typescript
const activeUsers = users.filter((u) => u.isActive && u.lastLogin > cutoffDate);
```

**Avoid:**

```typescript
// Filter users to get only active ones and those who logged in recently
const activeUsers = users.filter((u) => u.isActive && u.lastLogin > cutoffDate);
```

---

## Unit Testing & Mocking

### Testing Framework

- **Vitest** - Fast, Vite-native testing framework
- **Setup File** - `tests/setup.ts` configures global mocks and Vitest environment

### Mocking Strategy

The project uses a structured, reusable mocking system located in `tests/mocks/`. This allows for consistent behavior across different test suites and reduces boilerplate.

#### Reusable Mocks Directory (`tests/mocks/`)

Mocks are organized to mirror the `src/lib/server` structure:

- **AWS Services**: `tests/mocks/aws/` (S3, SQS)
- **Database Actions**: `tests/mocks/db/actions/` (Post, User, etc.)
- **Core Helpers**: `tests/mocks/helpers/` (Controller helpers, Sessions)
- **System Services**: `tests/mocks/logging/` (Logger), `tests/mocks/events/` (Upload Status)

#### Using Reusable Mocks

To use these mocks in your tests, import them from the central `tests/mocks/index.ts` or directly from their specific mock file.

**Example usage in a controller test:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { handleCreatePost } from '$lib/server/controllers/posts/createPost';
import { mockPostActions, mockS3Actions, mockControllerHelpers } from '../../../../mocks';

describe('handleCreatePost', () => {
	it('should successfully create a post', async () => {
		// Pre-configure mock behavior
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: mockData });
			},
		);

		mockPostActions.createPost.mockResolvedValue({ id: 'new-id' });

		const result = await handleCreatePost(mockEvent, 'api-route');

		expect(mockPostActions.createPost).toHaveBeenCalled();
		expect(result.status).toBe(201);
	});
});
```

#### Global Mocks

Core platform features (SvelteKit `redirect`, `error`, `fail`) and essential services (Prisma, Redis, Logger) are globally mocked in `tests/setup.ts`. You can still override their behavior in individual tests using `vi.mocked()`.

#### Mocking Gotchas & Best Practices

- **Hoisting Issues:** Avoid calling `vi.mock` inside your test files for modules that are imported by other modules you are testing. Vitest hoists `vi.mock` calls, which can lead to "ReferenceError: Cannot access '**vi_import_x**' before initialization". **Prefer adding global mocks to `tests/setup.ts`**.
- **Testing Real Implementations:** If you need to test the actual logic of a module that is globally mocked (e.g., a database action), you MUST call `vi.unmock('$lib/server/db/actions/yourModule')` at the very top of your test file (before any imports).
- **Synchronized Mocks:** When adding new methods to repositories or helpers, ensure you update the corresponding mock object in `tests/mocks/`. This prevents `undefined` errors in tests that rely on those mocks.
- **Explicit vs. Implicit:** Use the exported mock objects from `tests/mocks/` to configure specific behaviors in your tests. This keeps tests readable and prevents accidental side effects.

---

## Development Workflow

### Running the Application

```bash
pnpm dev
```

Starts the development server at `http://localhost:5173`

### Building for Production

```bash
pnpm build
```

Creates optimized production build in `/build` directory

### Database Operations

#### Migrate Schema Changes

```bash
pnpm prisma migrate dev --name <description>
```

#### Reset Database (Development Only)

```bash
pnpm prisma migrate reset
```

#### View Database UI

```bash
pnpm prisma studio
```

---

## Best Practices

### File Naming

- Use camelCase for TypeScript modules: `someFile.ts`, `fetchPost.ts`
- Components are PascalCase: `UserForm.svelte`

### Component Structure

- Keep components focused and single-responsibility
- Use Flowbite-Svelte components as building blocks
- Extract logic to shared utilities in `/lib/shared` or server functions

### Database Operations

- Encapsulate database queries in server-side functions
- Use Prisma for all database operations
- Leverage Prisma's generated types for type safety

### API Routes

- Place endpoints in `/src/routes/api/[resource]/+server.ts`
- Keep business logic in `/lib/server`
- Validate input data on the server

### Forms & Data

- Use SvelteKit form actions for mutations (`+page.server.ts`)
- Validate on both client (UX) and server (security)
- Type request/response data in `/lib/shared`

---

## Resources

- [SvelteKit Documentation](https://kit.svelte.dev)
- [Svelte 5 Documentation](https://svelte.dev)
- [Flowbite-Svelte Components](https://flowbite-svelte.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vite Documentation](https://vitejs.dev)

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
