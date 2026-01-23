# job-flow

AI-powered job application workflow. Provide a job URL or pasted text, get a tailored JSON Resume back.

## Stack

- **Runtime**: Cloudflare Workers (provisioned with Alchemy)
- **Framework**: Hono
- **LLM**: Claude Sonnet (via Anthropic API)
- **Storage**: R2 (resume + future job outputs)
- **Job Fetching**: Jina Reader API

## Quick Start

### 1. Install dependencies

```bash
bun install
```

### 2. Create the R2 bucket

Create an R2 bucket named `job-flow` in the Cloudflare dashboard. The Alchemy config adopts it.

### 3. Set environment secrets

```bash
cp .env.local.example .env.local
# edit .env.local with your secrets
```

### 4. Upload your resume

Create `resume.json` following the [JSON Resume schema](https://jsonresume.org/schema/). See `sample-resume.json` for an example.

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
bun run deploy
```

Need more detail? See `DEPLOYMENT.md`.

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
  "original": {
    "...": "your original resume"
  },
  "customized": {
    "...": "modified resume"
  },
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
bun run dev
# Worker runs at http://localhost:8787
```

Local development loads secrets from `.env.local`.

## Future Ideas

- [ ] Persist job outputs to R2 (`jobs/{company}_{title}_{date}/`)
- [ ] Simple web form frontend
- [ ] Diff viewer UI
- [ ] LaTeX/PDF generation
- [ ] Fit scoring agent
- [ ] Cover letter generation
