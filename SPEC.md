# Job Application Workflow - Technical Specification

## Overview

An AI-powered workflow built with Mastra that reduces friction in job hunting by automating job posting analysis, resume customization, and application material generation. The tool parses job postings, provides fit analysis, and generates customized resumes tailored to each role.

Inspired by: https://github.com/mattwoodco/mastra-job-workflow

## Architecture

### System Design

```bash
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Mastra)                     │
├─────────────────────────────────────────────────────────────┤
│  CLI Client  │  Web Form  │  (Future: Browser Extension)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent Orchestrator                       │
├──────────┬──────────┬──────────────────┬────────────────────┤
│  Parse   │ Analyze  │      Write       │       Review       │
│  Agent   │  Agent   │      Agent       │       Agent        │
└──────────┴──────────┴──────────────────┴────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
├─────────────────────────┬───────────────────────────────────┤
│  SQLite (job history,   │  Private Git Repo                 │
│  agent cache, queue)    │  (master resume.json)             │
└─────────────────────────┴───────────────────────────────────┘
```

### Agent Architecture (4 Specialized Agents)

MVP runs Parse + Write; Analyze and Review are added later.

1. **Parse Agent**

   -  Extracts structured data from job postings
   -  Handles URL fetching with fallback to pasted content
   -  Identifies: title, company, requirements, responsibilities, salary (if listed), benefits, tech stack
   -  Uses cheaper/faster LLM (e.g., GPT-3.5, Claude Haiku)

2. **Analyze Agent**

   -  Computes a heuristic fit score with factor breakdown (skills match, role clarity, company signals when available)
   -  Treats missing data as "unknown" (does not penalize), lowers confidence, and requests research if needed
   -  Identifies red flags and potential concerns
   -  Uses cheaper/faster LLM for scoring with rule-based aggregation to avoid false precision

3. **Write Agent**

   -  Generates customized resume based on master JSON Resume
   -  Creates cover letter drafts (multiple tone options: formal, casual, adapted to company culture when provided) (post-MVP)
   -  Produces inline diff showing proposed changes
   -  Does not fabricate experience; only reframes existing content
   -  Uses more capable LLM (e.g., GPT-4, Claude Sonnet/Opus)

4. **Review Agent** (configurable authority)
   -  Quality checks generated content
   -  Configurable thresholds: auto-fix minor issues OR flag for human review
   -  Can request Write Agent rewrite if below quality threshold
   -  Uses capable LLM for nuanced review

### Data Storage

-  **SQLite Database**: Job history, processing queue, agent state cache, failed job retry queue
-  **Private Git Repository** (separate from code): Master `resume.json` in JSON Resume format
-  **Job Output Folders**: One folder per processed job containing available artifacts

## Input Methods

### MVP

-  **API endpoint**: POST job URL or text to the Mastra API
-  **CLI**: `job-flow <url>` or interactive mode
-  **Web form**: Simple form for pasting job text

### Input Handling

1. Try to fetch URL content
2. If fetch fails (auth required, blocked), prompt user to paste content
3. Parse pasted content identically to fetched content

## Output Format

### Per-Job Folder Structure

```bash
jobs/
└── {company}_{title}_{date}/
    ├── metadata.json          # Job data, fit score (if available), processing info
    ├── job_posting.json       # Parsed structured job data
    ├── resume_customized.json # Modified JSON Resume
    ├── resume_customized.tex  # LaTeX version (post-MVP)
    ├── resume_ats.pdf         # ATS-friendly plain PDF (post-MVP)
    ├── resume_pretty.pdf      # Visually styled PDF (post-MVP)
    ├── cover_letter_*.md      # Cover letter options (post-MVP)
    ├── diff.html              # Inline diff view of resume changes
    └── research/              # (Post-MVP, when triggered)
        ├── company_notes.md
        ├── contacts.md
        └── interview_prep.md
```

Folder names are slugified and include a short hash to avoid collisions and illegal characters; date format is YYYY-MM-DD.
MVP guarantees `metadata.json`, `job_posting.json`, `resume_customized.json`, and `diff.html`; other artifacts are post-MVP.

### Resume Output Formats

-  JSON Resume (source of truth)
-  LaTeX (for custom styling)
-  PDF - ATS-friendly (simple formatting for automated screening)
-  PDF - Pretty (styled version for human readers)
   MVP outputs JSON Resume only. LaTeX/PDF generation runs only when templates and a renderer are configured; otherwise outputs are skipped with a clear notice.

## Core Features

### Fit Score (Prominent Display)

Composite heuristic score with factor breakdown and confidence (not a probability). Shown only when the Analyze Agent is enabled.

-  **Skills Match**: How well experience aligns with requirements
-  **Company Signals**: Red flags in reviews, funding concerns, turnover indicators (only when data is available)
-  **Role Clarity**: Well-defined vs. vague responsibilities

### Resume Customization

-  Hybrid approval workflow: generate options, user picks changes via inline diff
-  Preserve user's voice while adapting to job keywords
-  Avoid keyword stuffing; keep edits factual and grounded in existing experience
-  Multiple resume variants if needed

### Cover Letter Generation

-  Multiple tone options per job
-  User selects preferred tone
-  Future: memory layer learns from tone selections
   Post-MVP.

## User-Triggered Features (Not Automatic)

### Company Research

Activated on demand, fetches:

-  Culture signals (Glassdoor reviews, employee sentiment)
-  Tech stack (engineering blogs, job postings, BuiltWith)
-  Interview prep (common questions, process details)
   Use only permitted sources/APIs and user-provided data; avoid scraping that violates ToS.

### Contact/Networking Intelligence

Activated on demand:

-  Surfaces relevant people at the company
-  Generates cold outreach drafts with talking points
-  Identifies potential referral paths (manual lookup initially)
-  Interview prep: who you might talk to, their background, common ground
   Use only user-provided contacts or permitted data sources; do not scrape restricted platforms.

## MVP Scope (Weekend Project)

### Must Have

-  [ ] API layer (Mastra workflow endpoint)
-  [ ] Parse Agent: URL fetch with paste fallback
-  [ ] Write Agent: Basic resume customization (JSON Resume output + inline diff)
-  [ ] CLI: `job-flow <url>` command
-  [ ] Web form: Simple paste interface
-  [ ] Job folder output with core artifacts (metadata, parsed job, customized resume, diff)
-  [ ] Simple auth (API key protection)

### Defer to Later

-  [ ] Analyze Agent (fit scoring)
-  [ ] Review Agent
-  [ ] Cover letter generation
-  [ ] LaTeX/PDF resume rendering
-  [ ] Company research features
-  [ ] Contact/networking features
-  [ ] Memory layer (learning from edits)
-  [ ] Full web UI beyond basic form
-  [ ] Email notifications
-  [ ] Offline editing with sync
-  [ ] Job board API integrations

## Technical Stack

### Backend

-  **Framework**: Mastra
-  **Database**: SQLite
-  **LLM Strategy**: Mix by task
   -  Cheap/fast (GPT-3.5, Claude Haiku): Parsing, scoring
   -  Capable (GPT-4, Claude Sonnet): Writing, reviewing

### Frontend

-  **Framework**: Next.js
-  **MVP**: Simple form only
-  **Future**: Full dashboard with job history, diff viewer, research panels

### Deployment

-  **Target**: Cloud platform (Vercel, Railway, or Fly.io)
-  **Auth**: Simple API key or password (single user)

### CLI

-  Single entry point: `job-flow <url>` with flags
-  Interactive mode: `job-flow` prompts through steps
-  Both modes for flexibility

## Error Handling

-  **Partial Results**: Return whatever succeeded, clearly flag what failed
-  **Retry Queue**: Failed jobs saved for later retry
-  **Fallback Flow**: URL fails → prompt for paste → continue processing

## Master Resume Setup

### Initial Setup Options

1. **Migration Helper**: Best-effort extraction from TeX/PDF to JSON Resume with manual validation
2. **Setup Wizard**: Interactive process to build JSON Resume from scratch
3. **Import**: Parse existing resume into JSON Resume format

### Storage

-  Lives in separate private git repo (not in tool's public repo)
-  Path configured via environment variable or config file
-  Cached in SQLite for fast agent access (optional, never source of truth)
-  Sync on startup or file change detection with cache invalidation

## Job History (Light Tracking)

-  Log each processed job: URL, date, generated outputs, fit score (if available)
-  Warn on re-processing same job (confirm overwrite)
-  No full CRM features for MVP

## Export/Backup

-  SQLite database dump
-  JSON export of all jobs (metadata plus file references to outputs)
-  Per-job folder as zip
-  All formats available for flexibility

## Notifications

-  Email (future): Summary with link to web interface
-  No inline attachments when notifications are added

## Future Considerations

-  Job board API integrations (when scraping becomes unreliable)
-  Browser extension for one-click capture
-  Multi-user support with proper auth
-  Advanced memory/learning from editing patterns
-  Saved searches / job board monitoring
-  LinkedIn network cross-reference for referral discovery (only with user permission and compliant APIs)
