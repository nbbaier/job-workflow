# MVP Implementation Guide and Checklist

This guide expands the MVP scope into an implementation plan with verifiable milestones. It assumes a standalone Mastra service deployed to Vercel using `@mastra/deployer-vercel`.

## Constraints (Vercel + MVP)

-  Use a Node.js serverless runtime (not Edge) for Mastra execution and PDF rendering.
-  No persistent local filesystem on Vercel. Use external storage for artifacts and a hosted database.
-  Keep requests stateless; store run state and outputs in DB/blob storage.
-  Fit within typical serverless timeouts; avoid long-running synchronous work.
-  Prefer a Hono-based server (via `@mastra/server`) with custom routes over Next.js API routes.

## Mastra Integration Notes (MVP)

-  `@mastra/core` provides the `Mastra` orchestration class; register agents, workflows, tools there.
-  `@mastra/server` exposes framework-agnostic handlers; the docs show mounting them in Hono and calling `handlers.agents.*` for list/generate.
-  Mastra's server layer is built on Hono with OpenAPI support; expose only the endpoints you need for MVP.
-  `@mastra/core/storage` includes `DefaultStorage` (LibSQL/SQLite) with `url` config and auto table init; use hosted LibSQL (Turso) on Vercel.
-  `@mastra/deployer-vercel` generates `vercel.json` and `index.mjs` for `@vercel/node`, and supports `maxDuration`, `memory`, `regions` via `.vc-config.json`.
-  The deployer is configured in your `Mastra` instance (`new VercelDeployer({ maxDuration, memory, regions })`).

## Milestones

### M0 - Repo and Config Baseline

Checklist

-  [ ] Define env vars: `DATABASE_URL`, `JOB_STORAGE_MODE` (`local` or `blob`), `JOB_STORAGE_ROOT`, `RESUME_SOURCE`, `API_KEY`.
-  [ ] Add runtime deps: `@mastra/core`, `@mastra/server`, `@mastra/deployer-vercel`, and `hono`.
-  [ ] Create `mastra.mjs` (or equivalent) that instantiates `Mastra` with `VercelDeployer` and a Hono server.
-  [ ] Add a health endpoint (`/health`) on the Hono app.
-  [ ] Document local dev and Vercel env setup in `README.md` or `ENV.md`.

Verify

-  `curl http://localhost:3000/health` returns 200 with JSON `{ "ok": true }`.

### M1 - Mastra Workflow Skeleton (Parse + Write)

Checklist

-  [ ] Define workflow input schema: `{ source: "url" | "text", payload: string }`.
-  [ ] Implement URL fetch with timeout and content-length limits; fallback to pasted text.
-  [ ] Parse agent returns `job_posting.json` with required fields (title, company, requirements, responsibilities).
-  [ ] Write agent reads master resume JSON and produces `resume_customized.json`.
-  [ ] Enforce "no fabrication" rule in Write agent instructions.

Verify

-  API call with a sample job text returns a 200 response and a run id.
-  Stored `job_posting.json` and `resume_customized.json` match the schema.

### M2 - Resume Source Loader (Vercel-Compatible)

Checklist

-  [ ] Implement a loader chain: `RESUME_SOURCE=path|blob|env`.
-  [ ] `path` loads a local file (CLI/local dev).
-  [ ] `blob` loads from object storage (Vercel Blob or S3).
-  [ ] `env` loads from a base64 env var for small resumes.
-  [ ] Cache in memory per request; do not write to local disk on Vercel.

Verify

-  Switching `RESUME_SOURCE` changes the data source without code changes.
-  Resume content is identical across loaders for the same input.

### M3 - Storage Adapter + Job Folder Layout

Checklist

-  [ ] Implement storage adapter with `local` and `blob` modes.
-  [ ] Generate job folder name using slug + short hash + date.
-  [ ] Write `metadata.json`, `job_posting.json`, `resume_customized.json`, `diff.html`.
-  [ ] Store a manifest of artifact paths/URLs.

Verify

-  Local mode writes files under `jobs/<slug>_<date>/`.
-  Blob mode lists the same artifact names with accessible URLs.

### M4 - Inline Diff Generation

Checklist

-  [ ] Generate a diff between master resume and customized resume.
-  [ ] Render diff as HTML (`diff.html`) with minimal styling.

Verify

-  `diff.html` highlights added/removed content for a sample job.

### M5 - Minimal LaTeX/PDF Rendering (MVP)

Checklist

-  [ ] Add `templates/resume_ats.tex` and `templates/resume_shared.sty`.
-  [ ] Implement a renderer using `tectonic` to produce `resume_ats.pdf`.
-  [ ] Ensure rendering is optional if `tectonic` is unavailable (clear notice).
-  [ ] Decide how `tectonic` runs on Vercel (vendored binary or external service).

Verify

-  Local: `resume_ats.pdf` is generated for a sample job.
-  Vercel: rendering path either produces `resume_ats.pdf` or returns a clear "renderer unavailable" status.

### M6 - API Endpoint (Standalone Mastra Server)

Checklist

-  [ ] Implement `POST /api/job` as a Hono route with API key auth (header `x-api-key`).
-  [ ] Ensure the handler uses Node runtime and does not rely on local disk.
-  [ ] If exposing Mastra endpoints, mount `@mastra/server` handlers under `/mastra` (Hono example in docs).
-  [ ] Return a response with run id and artifact locations.

Verify

-  Unauthorized request returns 401.
-  Authorized request returns 200 and a valid run id plus artifact URLs.

### M7 - CLI Client

Checklist

-  [ ] Add `job-flow <url>` and `job-flow` interactive mode.
-  [ ] CLI calls the API endpoint with retries and clear errors.
-  [ ] CLI prints the run id and artifact locations.

Verify

-  CLI works end-to-end against local dev server and Vercel preview URL.

### M8 - Vercel Deployment Milestone

Checklist

-  [ ] Configure environment variables in Vercel.
-  [ ] Ensure DB connection is a hosted service (SQLite via libSQL/Turso or Vercel Postgres).
-  [ ] Confirm storage adapter uses blob mode in production.
-  [ ] Use `@mastra/deployer-vercel` and set `maxDuration`/`memory`/`regions` for PDF + LLM work.
-  [ ] Verify `vercel.json` and `index.mjs` are generated for `@vercel/node` (routes point to `index.mjs`).
-  [ ] Inspect `.vc-config.json` for the configured `maxDuration` and `memory`.
-  [ ] Deploy a preview and run a full job flow.

Verify

-  Preview deployment processes a job and stores artifacts in blob storage.
-  Re-running the same input does not overwrite without confirmation.

### M9 - MVP Definition of Done

Checklist

-  [ ] All M0-M8 verification steps pass.
-  [ ] Outputs match the MVP artifact guarantee in `SPEC.md`.
-  [ ] API and CLI usage documented with a copy-paste example.
