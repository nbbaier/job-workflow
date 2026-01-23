import alchemy from "alchemy";
import { R2Bucket, Worker } from "alchemy/cloudflare";

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
    ANTHROPIC_API_KEY: alchemy.secret(process.env.ANTHROPIC_API_KEY),
    API_TOKEN: alchemy.secret(process.env.API_TOKEN),
  },
});

await app.finalize();
