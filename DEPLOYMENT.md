# Deployment Guide

Deploy the job-flow worker to Cloudflare Workers using Alchemy with R2-backed resume storage.

## Prerequisites

1. **Cloudflare Account**: Sign up at https://cloudflare.com
2. **Anthropic API Key**: Get from https://console.anthropic.com
3. **Bun**: Install from https://bun.sh
4. **Alchemy**: Installed via project dependencies

## Deployment Steps

### 1. Create the R2 Bucket

Create an R2 bucket named `job-flow` in the Cloudflare dashboard. The Alchemy config adopts it.

### 2. Configure Environment Secrets

```bash
cp .env.local.example .env.local
# edit .env.local with your secrets
```

Required values:

- `ALCHEMY_PASSWORD` for encrypting state
- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
- `ANTHROPIC_API_KEY` and `API_TOKEN` for the worker

### 3. Deploy to Cloudflare

```bash
bun run deploy
```

This will build and deploy the worker, then output your worker URL (for example: `https://job-flow.YOUR_SUBDOMAIN.workers.dev`).

### 4. Upload Your Resume

```bash
# Replace with your actual worker URL and API_TOKEN
curl -X PUT https://job-flow.YOUR_SUBDOMAIN.workers.dev/resume \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @sample-resume.json
```

Or upload your own resume.json file following the JSON Resume schema.

### 5. Test the Endpoints

```bash
# Health check
curl https://job-flow.YOUR_SUBDOMAIN.workers.dev/ \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Get resume
curl https://job-flow.YOUR_SUBDOMAIN.workers.dev/resume \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Customize resume with job posting
curl -X POST https://job-flow.YOUR_SUBDOMAIN.workers.dev/customize \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "https://boards.greenhouse.io/anthropic/jobs/4020515008"}'

# Or with pasted job text
curl -X POST https://job-flow.YOUR_SUBDOMAIN.workers.dev/customize \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "Software Engineer at Acme Corp\n\nRequirements:\n- 3+ years TypeScript\n- React experience\n- Strong communication skills"}'
```

## Local Development

Run the development server locally:

```bash
bun run dev
```

The server will start at http://localhost:8787 and load secrets from `.env.local`.

## Environment Variables

These are configured via Cloudflare:

| Variable                | Type   | Description                              |
| ----------------------- | ------ | ---------------------------------------- |
| `ALCHEMY_PASSWORD`      | Secret | Encrypts the `.alchemy/` state           |
| `CLOUDFLARE_API_TOKEN`  | Secret | Cloudflare API token for deployments     |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Cloudflare account ID                    |
| `ANTHROPIC_API_KEY`     | Secret | Your Anthropic API key for Claude        |
| `API_TOKEN`             | Secret | Bearer token for authenticating requests |

## Troubleshooting

### "Master resume not found in R2"

Upload your resume first using the PUT /resume endpoint (see step 5).

### "Authentication error"

Verify your `API_TOKEN` in `.env.local` or CI secrets matches what your client is sending.

### "Anthropic API error"

Verify `ANTHROPIC_API_KEY` is set in the environment used for deployment.

### Local development not working

Confirm `.env.local` exists and contains all required variables.

### Deployment fails

- Confirm `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are valid
- Verify the R2 bucket exists in your account
- Check for TypeScript errors: `bunx tsc --noEmit`

## CI/CD Deployment

For automated deployment:

1. Set the same secrets used in `.env.local` as CI environment variables
2. Run deployment:

```bash
bun run deploy
```

## Cost Estimates

With Cloudflare's free tier:

- **Workers**: 100,000 requests/day free
- **R2 Storage**: 10GB free
- **R2 Operations**: Class A (1M/mo free), Class B (10M/mo free)

Anthropic API costs:

- **Claude Sonnet 4**: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- Typical resume customization: ~2K input + ~4K output = ~$0.08 per job

So you can customize ~1,250 resumes per month for ~$100 in API costs.

## Next Steps

See MVP_IMPLEMENTATION_GUIDE.md for post-MVP enhancements like:

- Job output persistence
- PDF generation
- Web form UI
- CLI tool
