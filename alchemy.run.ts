import alchemy from "alchemy";
import { R2Bucket, Worker } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";

const app = await alchemy("job-flow-app", {
  stage: process.env.STAGE ?? "production",
  password: process.env.ALCHEMY_PASSWORD,
  stateStore: (scope) => new CloudflareStateStore(scope),
});

const bucket = await R2Bucket("job-flow-storage", {
  name: "job-flow-storage",
  adopt: true,
});

export const worker = await Worker("job-flow", {
  name: "job-flow",
  entrypoint: "./src/index.ts",
  url: true,
  compatibilityDate: "2024-01-01",
  bindings: {
    BUCKET: bucket,
    ANTHROPIC_API_KEY: alchemy.secret(process.env.ANTHROPIC_API_KEY),
    API_TOKEN: alchemy.secret(process.env.API_TOKEN),
  },
});

console.log("Worker URL:", worker.url);

await app.finalize();
