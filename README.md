# job-flow

AI-powered job application workflow. Paste a job URL or text, get a customized resume back.

## Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **LLM**: Claude Sonnet (via Anthropic API)
- **Storage**: R2 (resume + future job outputs)
- **Job Fetching**: Jina Reader API

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create R2 bucket

```bash
wrangler r2 bucket create job-flow
```

### 3. Set secrets

```bash
wrangler secret put ANTHROPIC_API_KEY
# paste your Anthropic API key

wrangler secret put API_TOKEN
# create a random token for authenticating requests
# e.g.: openssl rand -hex 32
```

### 4. Upload your resume

First, create your `resume.json` following the [JSON Resume schema](https://jsonresume.org/schema/). See `sample-resume.json` for an example.

Then upload it:

```bash
# Local dev
curl -X PUT http://localhost:8787/resume \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @resume.json

# Production
curl -X PUT https://job-flow.YOUR_SUBDOMAIN.workers.dev/resume \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @resume.json
```

### 5. Deploy

```bash
npm run deploy
```

## Usage

### Customize resume for a job

```bash
# With a URL (uses Jina Reader to extract content)
curl -X POST https://job-flow.YOUR_SUBDOMAIN.workers.dev/customize \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "https://boards.greenhouse.io/company/jobs/12345"}'

# With pasted job text
curl -X POST https://job-flow.YOUR_SUBDOMAIN.workers.dev/customize \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "Software Engineer at Acme Corp\n\nWe are looking for..."}'
```

### Response

```json
{
  "job": {
    "title": "Software Engineer",
    "company": "Acme Corp",
    "requirements": ["3+ years experience", "TypeScript"],
    "responsibilities": ["Build features", "Code review"],
    "techStack": ["TypeScript", "React", "Node.js"]
  },
  "original": { /* your original resume */ },
  "customized": { /* modified resume */ },
  "changes": [
    {
      "section": "basics.summary",
      "field": "summary",
      "before": "Full stack developer...",
      "after": "Full stack developer with expertise in TypeScript...",
      "rationale": "Added emphasis on TypeScript to match job requirements"
    }
  ],
  "reasoning": "The role emphasizes TypeScript and React experience..."
}
```

### Get/update resume

```bash
# Get current resume
curl https://job-flow.YOUR_SUBDOMAIN.workers.dev/resume \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Update resume
curl -X PUT https://job-flow.YOUR_SUBDOMAIN.workers.dev/resume \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @resume.json
```

## Local Development

```bash
npm run dev
# Worker runs at http://localhost:8787
```

For local dev, you'll need to either:
- Have R2 configured (wrangler handles this)
- Or modify the code to use a local file for the resume

## Future Ideas

- [ ] Persist job outputs to R2 (`jobs/{company}_{title}_{date}/`)
- [ ] Simple web form frontend
- [ ] Diff viewer UI
- [ ] LaTeX/PDF generation
- [ ] Fit scoring agent
- [ ] Cover letter generation
