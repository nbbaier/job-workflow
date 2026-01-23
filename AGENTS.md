# AGENTS.md

Instructions for AI coding agents working with this codebase.

## Architecture Overview

This is a minimal job application workflow API built with:

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **LLM**: Anthropic Claude (Sonnet)
- **Storage**: Cloudflare R2
- **Job Fetching**: Jina Reader API (`r.jina.ai`)

No database. No multi-agent orchestration framework. Just a single API endpoint that takes a job posting and returns a customized resume.

## Key Files

```
src/
├── index.ts    # Hono app with routes: GET /, POST /customize, GET/PUT /resume
├── prompt.ts   # System prompt and user prompt builder for Claude
└── types.ts    # TypeScript types (JSONResume, ParsedJob, API contracts)

alchemy.run.ts  # Alchemy infrastructure config for Cloudflare Workers + R2
```

## Core Flow

1. `POST /customize` receives `{ input: string }` (URL or pasted job text)
2. If input is a URL, fetch via Jina Reader (`https://r.jina.ai/{url}`)
3. Load master `resume.json` from R2
4. Call Claude with job text + resume → get customized resume + changes + reasoning
5. Return structured response

## Environment & Secrets

Set via environment variables (see `.env.local.example`):

- `ALCHEMY_PASSWORD` - encrypts `.alchemy/` state
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `ANTHROPIC_API_KEY` - Anthropic API key
- `API_TOKEN` - Bearer token for authenticating requests

R2 bucket binding is configured in `alchemy.run.ts`:

- `BUCKET` - R2 bucket named `job-flow` storing `resume.json`

## Development

```bash
bun install
cp .env.local.example .env.local
bun run dev           # local dev at http://localhost:8787
bun run deploy        # deploy to Cloudflare
```

## Design Decisions

### Why not Mastra/LangChain/etc?

The core task is a single LLM call with structured output. Orchestration frameworks add complexity without benefit here. If we later need multi-agent workflows, persistent state, or observability, we can add them incrementally.

### Why Cloudflare Workers + R2?

- Deploys in seconds, scales to zero
- R2 is cheap/free for low volume, no egress fees
- No cold start concerns for this use case
- Simple mental model: stateless functions + object storage

### Why Jina Reader for URL fetching?

- Free, no auth required
- Handles JavaScript-heavy job sites (Greenhouse, Lever, etc.)
- Returns clean markdown, which Claude handles well
- Falls back gracefully - if it fails, user can paste

### Why JSON Resume format?

- Open standard with good tooling ecosystem
- Can render to PDF/HTML with existing tools (resume-cli, jsonresume.io)
- Structured enough for programmatic manipulation
- Human-readable for manual editing

## Extending

### Adding job output persistence

Store results to R2 under `jobs/{slug}_{date}/`:

```typescript
const slug = slugify(`${job.company}_${job.title}`);
const date = new Date().toISOString().split("T")[0];
const key = `jobs/${slug}_${date}/result.json`;
await env.BUCKET.put(key, JSON.stringify(response));
```

### Adding PDF generation

Options:

1. Client-side: Return JSON Resume, let user render with `resume-cli` or jsonresume.io
2. Server-side: Use a PDF service (e.g., Browserless, PDFShift) called from the worker
3. Separate service: A small container that runs LaTeX/tectonic

For MVP, client-side rendering is simplest.

### Adding more agents

If you need Parse → Analyze → Write → Review pipeline:

1. Keep them as separate functions in `src/agents/`
2. Call sequentially in the route handler
3. Consider streaming responses for long workflows

Don't reach for an orchestration framework until you feel the pain of not having one.

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bunx ultracite fix`
- **Check for issues**: `bunx ultracite check`
- **Diagnose setup**: `bunx ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
   - Provide meaningful alt text for images
   - Use proper heading hierarchy
   - Add labels for form inputs
   - Include keyboard event handlers alongside mouse events
   - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `bunx ultracite fix` before committing to ensure compliance.
