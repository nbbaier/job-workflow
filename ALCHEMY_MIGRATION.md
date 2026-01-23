# Migration Plan: wrangler.toml → alchemy.run.ts

This document outlines the steps to migrate the job-flow app from wrangler-based Cloudflare Workers to alchemy.run infrastructure-as-code.

## Overview

| Aspect | Before (wrangler) | After (alchemy) |
|--------|-------------------|-----------------|
| Config format | TOML | TypeScript |
| Secrets | `wrangler secret put` | `alchemy.secret()` + env vars |
| State | Managed by Cloudflare | Local `.alchemy/` directory |
| Type safety | Limited | Full TypeScript inference |

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

// Adopt the existing R2 bucket
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

Replace wrangler scripts with alchemy commands:

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

## Step 7: Delete wrangler files

Remove these files after successful migration:

- `wrangler.toml`

---

## Step 8: First deployment

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
- [ ] `wrangler.toml` deleted

---

## Rollback

If issues occur, restore `wrangler.toml` and revert `package.json` scripts. The existing Cloudflare resources remain unchanged.
