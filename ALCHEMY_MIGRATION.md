# Alchemy Deployment Plan

This document outlines the steps to deploy the job-flow app with `alchemy.run.ts` infrastructure-as-code.

---

## Step 1: Install alchemy

```bash
bun add alchemy
```

---

## Step 2: Create `alchemy.run.ts`

Create this file in the project root:

```typescript
import alchemy from "alchemy";
import { Worker, R2Bucket } from "alchemy/cloudflare";

const app = await alchemy("job-flow", {
   stage: process.env.STAGE ?? "production",
   password: process.env.ALCHEMY_PASSWORD,
});

// Use the R2 bucket for the master resume
const bucket = await R2Bucket("job-flow", {
   name: "job-flow",
   adopt: true,
});

// Deploy the Hono worker
export const worker = await Worker("job-flow", {
   name: "job-flow",
   entrypoint: "./src/index.ts",
   url: true,
   compatibilityDate: "2024-01-01",
   bindings: {
      BUCKET: bucket,
      ANTHROPIC_API_KEY: alchemy.secret(process.env.ANTHROPIC_API_KEY!),
      API_TOKEN: alchemy.secret(process.env.API_TOKEN!),
   },
});

await app.finalize();
```

---

## Step 3: Update `src/types.ts`

Replace the manual `Env` type definition with alchemy's inferred types:

```typescript
import type { worker } from "../alchemy.run";

export type Env = typeof worker.Env;
```

This gives you full type safety for all bindings.

---

## Step 4: Update `package.json` scripts

Use alchemy commands for development and deployment:

```json
{
   "scripts": {
      "dev": "alchemy dev --env-file .env.local",
      "deploy": "alchemy deploy",
      "destroy": "alchemy destroy"
   }
}
```

---

## Step 5: Create environment files

### `.env.local` (for local development)

```bash
ALCHEMY_PASSWORD=your-secret-passphrase-for-encrypting-state
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
ANTHROPIC_API_KEY=your-anthropic-key
API_TOKEN=your-api-token
```

### `.env.production` (optional, for CI/CD)

Same variables, production values.

---

## Step 6: Update `.gitignore`

Add these entries:

```
.alchemy/
.env.local
.env.production
```

Note: `.alchemy/` state files are safe to commit (secrets are encrypted), but you may prefer to keep them out of git.

---

## Step 7: First deployment

```bash
# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your values

# Deploy
bun run deploy
```

---

## Verification checklist

- [ ] `bun add alchemy` succeeds
- [ ] `alchemy.run.ts` created and TypeScript compiles
- [ ] `src/types.ts` updated to use inferred Env type
- [ ] `.env.local` created with all required secrets
- [ ] `.gitignore` updated
- [ ] `bun run deploy` succeeds
- [ ] Worker responds at workers.dev URL
- [ ] R2 bucket binding works (test `/resume` endpoints)
- [ ] Secrets work (test `/customize` endpoint)

---

## Secrets guidance

Secrets are supplied via environment variables and injected in `alchemy.run.ts` using `alchemy.secret(...)`. Keep API tokens out of source control and prefer `.env.local` for development and CI secrets for deployments.
