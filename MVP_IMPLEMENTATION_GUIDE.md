# MVP Implementation Guide and Checklist

This guide covers the minimal job application workflow: paste a job posting, get a customized resume back.

## Stack

| Concern      | Solution                |
| ------------ | ----------------------- |
| Runtime      | Cloudflare Workers      |
| Framework    | Hono                    |
| LLM          | Anthropic Claude Sonnet |
| Storage      | Cloudflare R2           |
| Job Fetching | Jina Reader API         |
| Auth         | Bearer token            |

No database. No orchestration framework. Single API endpoint.

## Constraints

-  Stateless: all state lives in R2 or is passed in the request
-  Workers have 30s CPU time limit (plenty for one LLM call)
-  R2 is eventually consistent (fine for this use case)
-  No local filesystem persistence

## Milestones

### M0 - Project Setup

**Checklist**

-  [ ] Initialize project with `npm init`
-  [ ] Install dependencies: `hono`, `@anthropic-ai/sdk`
-  [ ] Install dev dependencies: `wrangler`, `typescript`, `@cloudflare/workers-types`
-  [ ] Create `wrangler.toml` with R2 bucket binding
-  [ ] Create `tsconfig.json` for Workers environment
-  [ ] Create R2 bucket: `wrangler r2 bucket create job-flow`
-  [ ] Set secrets: `wrangler secret put ANTHROPIC_API_KEY`, `wrangler secret put API_TOKEN`

**Verify**

```bash
npm run dev
curl http://localhost:8787/ -H "Authorization: Bearer YOUR_TOKEN"
# Returns: {"status":"ok","service":"job-flow"}
```

---

### M1 - Resume Storage

**Checklist**

-  [ ] Implement `PUT /resume` endpoint to upload JSON Resume to R2
-  [ ] Implement `GET /resume` endpoint to retrieve current resume
-  [ ] Validate JSON Resume has required `basics.name` field
-  [ ] Create sample `resume.json` following JSON Resume schema

**Verify**

```bash
# Upload resume
curl -X PUT http://localhost:8787/resume \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @sample-resume.json

# Retrieve resume
curl http://localhost:8787/resume \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### M2 - Job Text Fetching

**Checklist**

-  [ ] Implement `getJobText()` helper function
-  [ ] Detect URL vs raw text input
-  [ ] For URLs, fetch via Jina Reader (`https://r.jina.ai/{url}`)
-  [ ] Handle fetch failures gracefully (fall back to treating input as raw text)
-  [ ] Log fetch failures for debugging

**Verify**

```bash
# Test with a real job URL (should return markdown)
curl "https://r.jina.ai/https://boards.greenhouse.io/anthropic/jobs/4020515008"
```

---

### M3 - Core Customization Endpoint

**Checklist**

-  [ ] Implement `POST /customize` endpoint
-  [ ] Accept `{ input: string }` body (URL or pasted text)
-  [ ] Fetch job text using M2 helper
-  [ ] Load resume from R2
-  [ ] Build prompt with job text + resume
-  [ ] Call Claude Sonnet with system prompt
-  [ ] Parse JSON response from Claude
-  [ ] Return structured response: `{ job, original, customized, changes, reasoning }`

**Verify**

```bash
curl -X POST http://localhost:8787/customize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "Software Engineer at Acme Corp\n\nRequirements:\n- 3+ years TypeScript\n- React experience"}'
```

Response should include:

-  Parsed job details (title, company, requirements)
-  Original resume
-  Customized resume with modifications
-  List of changes with rationale
-  Overall reasoning

---

### M4 - Prompt Engineering

**Checklist**

-  [ ] Write system prompt with clear instructions for Claude
-  [ ] Define output JSON schema in prompt
-  [ ] Include rules: no fabrication, preserve voice, ATS-friendly
-  [ ] Build user prompt combining job text + resume
-  [ ] Handle JSON parsing with fallback for markdown fences
-  [ ] Test with variety of job posting formats

**Verify**

-  Run against 3-5 different job postings
-  Verify `changes` array accurately reflects differences
-  Verify no hallucinated experience in customized resume
-  Verify keywords from job posting appear naturally in output

---

### M5 - Auth & Error Handling

**Checklist**

-  [ ] Add bearer token auth middleware
-  [ ] Return 401 for missing/invalid token
-  [ ] Return 400 for malformed requests
-  [ ] Return 500 with details for LLM/parsing failures
-  [ ] Include raw LLM response in error for debugging
-  [ ] Add CORS headers for web form access

**Verify**

```bash
# No auth - should 401
curl http://localhost:8787/resume
# Returns: 401 Unauthorized

# Bad JSON - should 400
curl -X POST http://localhost:8787/customize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "not json"
# Returns: 400 with error message
```

---

### M6 - Deploy to Cloudflare

**Checklist**

-  [ ] Run `npm run deploy`
-  [ ] Verify secrets are set in Cloudflare dashboard (or via `wrangler secret put`)
-  [ ] Verify R2 bucket exists and is bound
-  [ ] Test all endpoints against production URL
-  [ ] Upload production resume to R2

**Verify**

```bash
# Test production
curl https://job-flow.YOUR_SUBDOMAIN.workers.dev/ \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -X POST https://job-flow.YOUR_SUBDOMAIN.workers.dev/customize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "https://some-job-posting-url.com"}'
```

---

### M7 - MVP Complete

**Definition of Done**

-  [ ] `POST /customize` accepts URL or pasted text
-  [ ] Returns parsed job, customized resume, changes, reasoning
-  [ ] Master resume stored in R2, accessible via `GET /resume`
-  [ ] Resume updateable via `PUT /resume`
-  [ ] All endpoints protected by bearer token
-  [ ] Deployed and working on Cloudflare Workers
-  [ ] README documents setup and usage

---

## Post-MVP Enhancements

These are explicitly deferred:

| Feature                | Notes                                       |
| ---------------------- | ------------------------------------------- |
| Job output persistence | Save results to R2 under `jobs/{slug}/`     |
| Diff HTML generation   | Render visual diff of resume changes        |
| PDF generation         | Use external service or client-side tooling |
| CLI tool               | Simple wrapper around the API               |
| Web form UI            | Basic HTML form for non-technical users     |
| Fit scoring            | Analyze agent to score job match            |
| Cover letters          | Additional output from Write agent          |
| SQLite/Turso           | Only if you need querying job history       |

Add these incrementally as you feel the need, not upfront.

## Troubleshooting

### "Master resume not found in R2"

Upload your resume first:

```bash
curl -X PUT https://job-flow.YOUR_SUBDOMAIN.workers.dev/resume \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @your-resume.json
```

### Jina Reader returns empty/truncated content

Some sites block Jina. Fall back to pasting the job text directly.

### Claude returns malformed JSON

Check the `raw` field in the error response. Common issues:

-  Response too long (increase `max_tokens`)
-  Model wrapped JSON in markdown fences (parser handles this)
-  Model added commentary outside JSON (parser should strip this)

### Workers timeout

The 30s CPU limit should be plenty. If hitting it:

-  Check if Jina fetch is hanging (add timeout)
-  Check if Claude call is taking too long (model issue, retry)
