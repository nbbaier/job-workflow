import alchemy from "alchemy";
import { Assets, KVNamespace, R2Bucket, Worker } from "alchemy/cloudflare";
import { GitHubComment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";

const app = await alchemy("job-flow-app", {
  password: process.env.ALCHEMY_PASSWORD,
  stateStore: (scope) => new CloudflareStateStore(scope),
});

const kv = await KVNamespace("job-flow-kv", { adopt: true });

const bucket = await R2Bucket("job-flow-r2", {
  name: "job-flow-r2",
  adopt: true,
});

export const worker = await Worker("job-flow", {
  name: `job-flow-${app.stage}`,
  entrypoint: "./src/index.ts",
  adopt: true,
  url: true,
  compatibilityDate: "2026-01-24",
  compatibilityFlags: ["nodejs_compat"],
  assets: {
    html_handling: "auto-trailing-slash",
    not_found_handling: "single-page-application",
  },
  bindings: {
    KV: kv,
    ASSETS: await Assets({ path: "./public" }),
    BUCKET: bucket,
    ANTHROPIC_API_KEY: alchemy.secret(process.env.ANTHROPIC_API_KEY),
    API_TOKEN: alchemy.secret(process.env.API_TOKEN),
  },
});

console.log(`Worker URL: ${worker.url}`);
console.log(`Worker name: ${worker.name}`);
console.log(`R2 Bucket: ${bucket.name}`);
console.log(`App stage: ${app.stage}`);

if (process.env.PULL_REQUEST) {
  const previewUrl = worker.url;

  await GitHubComment("pr-preview-comment", {
    owner: process.env.GITHUB_REPOSITORY_OWNER || "nbbaier",
    repository: process.env.GITHUB_REPOSITORY_NAME || "idea-explorer",
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `
## 🚀 Preview Deployed

Your preview is ready!

**Preview URL:** ${previewUrl}

This preview was built from commit ${process.env.GITHUB_SHA}

---
<sub>🤖 This comment will be updated automatically when you push new commits to this PR.</sub>`,
  });
}

await app.finalize();
