// Cloudflare bindings
export interface Env {
  BUCKET: R2Bucket;
  ANTHROPIC_API_KEY: string;
  API_TOKEN: string;
}

// JSON Resume schema (simplified - extend as needed)
// Full spec: https://jsonresume.org/schema/
export interface JSONResume {
  basics: {
    name: string;
    label?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: {
      city?: string;
      region?: string;
      countryCode?: string;
    };
    profiles?: Array<{
      network: string;
      username?: string;
      url?: string;
    }>;
  };
  work?: Array<{
    name: string;
    position: string;
    url?: string;
    startDate: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
  }>;
  education?: Array<{
    institution: string;
    area?: string;
    studyType?: string;
    startDate?: string;
    endDate?: string;
    score?: string;
    courses?: string[];
  }>;
  skills?: Array<{
    name: string;
    level?: string;
    keywords?: string[];
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    highlights?: string[];
    keywords?: string[];
    url?: string;
    startDate?: string;
    endDate?: string;
  }>;
  // Add other sections as needed: awards, publications, languages, interests, references
}

// Parsed job posting structure
export interface ParsedJob {
  title: string;
  company: string;
  location?: string;
  salary?: string;
  employmentType?: string; // full-time, contract, etc.
  remote?: string; // remote, hybrid, on-site
  requirements: string[];
  responsibilities: string[];
  niceToHave?: string[];
  benefits?: string[];
  techStack?: string[];
  aboutCompany?: string;
  rawText: string; // preserve original for reference
}

// API request/response types
export interface CustomizeRequest {
  input: string; // URL or pasted job text
}

export interface CustomizeResponse {
  job: ParsedJob;
  original: JSONResume;
  customized: JSONResume;
  changes: ResumeChange[];
  reasoning: string;
}

export interface ResumeChange {
  section: string;
  field: string;
  before: string;
  after: string;
  rationale: string;
}

// LLM response structure (what we ask Claude to return)
export interface LLMResponse {
  job: ParsedJob;
  customized: JSONResume;
  changes: ResumeChange[];
  reasoning: string;
}
