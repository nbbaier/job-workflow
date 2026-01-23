# Deployment Guide

This guide covers deploying the job-flow application to Cloudflare Workers.

## Implementation Status

✅ **All code is complete and ready to deploy!**

### Completed Milestones

- **M0 - Project Setup**: All dependencies installed, config files ready
- **M1 - Resume Storage**: GET/PUT `/resume` endpoints implemented
- **M2 - Job Text Fetching**: Jina Reader integration with fallback
- **M3 - Core Customization**: POST `/customize` endpoint fully functional
- **M4 - Prompt Engineering**: System prompts and JSON parsing complete
- **M5 - Auth & Error Handling**: Bearer auth and CORS configured

## Prerequisites

1. **Cloudflare Account**: Sign up at https://cloudflare.com
2. **Anthropic API Key**: Get from https://console.anthropic.com
3. **Wrangler CLI**: Already installed as dev dependency

## Deployment Steps

### 1. Authenticate with Cloudflare

```bash
# Interactive login (for local development)
bunx wrangler login

# OR set API token for CI/CD
export CLOUDFLARE_API_TOKEN="your-api-token"
```

To create an API token:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Add "Account.Account Settings:Read" and "Workers R2 Storage:Edit" permissions

### 2. Create R2 Bucket

```bash
bunx wrangler r2 bucket create job-flow
```

This creates the R2 bucket that stores your master resume.

### 3. Set Secrets

```bash
# Set Anthropic API key
bunx wrangler secret put ANTHROPIC_API_KEY
# Paste your Anthropic API key when prompted

# Set API authentication token (create a secure random token)
bunx wrangler secret put API_TOKEN
# Paste your chosen bearer token when prompted
```

To generate a secure token:
```bash
# On macOS/Linux
openssl rand -base64 32

# Or use any password generator
```

### 4. Deploy to Cloudflare

```bash
bun run deploy
```

This will:
- Build and bundle your code
- Deploy to Cloudflare Workers
- Output your worker URL (e.g., `https://job-flow.YOUR_SUBDOMAIN.workers.dev`)

### 5. Upload Your Resume

```bash
# Replace with your actual worker URL and API_TOKEN
curl -X PUT https://job-flow.YOUR_SUBDOMAIN.workers.dev/resume \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @sample-resume.json
```

Or upload your own resume.json file following the JSON Resume schema.

### 6. Test the Endpoints

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
# Make sure secrets are set first (see step 3)
bun run dev
```

The server will start at http://localhost:8787

**Note**: Local development requires the same secrets to be set via `wrangler secret put`.

## Environment Variables

These are configured via Cloudflare:

| Variable | Type | Description |
|----------|------|-------------|
| `ANTHROPIC_API_KEY` | Secret | Your Anthropic API key for Claude |
| `API_TOKEN` | Secret | Bearer token for authenticating requests |
| `BUCKET` | R2 Binding | R2 bucket named "job-flow" (configured in wrangler.toml) |

## Troubleshooting

### "Master resume not found in R2"
Upload your resume first using the PUT /resume endpoint (see step 5).

### "Authentication error"
Verify your API_TOKEN secret is set correctly:
```bash
bunx wrangler secret list
```

### "Anthropic API error"
Verify your ANTHROPIC_API_KEY secret is set and valid:
```bash
bunx wrangler secret list
```

### Local development not working
Make sure you've set the secrets using `wrangler secret put` before running `bun run dev`.

### Deployment fails
- Check you're authenticated: `bunx wrangler whoami`
- Verify R2 bucket exists: `bunx wrangler r2 bucket list`
- Check for TypeScript errors: `bunx tsc --noEmit`

## CI/CD Deployment

For automated deployment:

1. Set `CLOUDFLARE_API_TOKEN` in your CI environment
2. Set `CLOUDFLARE_ACCOUNT_ID` (found in Cloudflare dashboard)
3. Run deployment:
```bash
bunx wrangler deploy
```

Secrets (ANTHROPIC_API_KEY, API_TOKEN) need to be set once via `wrangler secret put` and will persist across deployments.

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
