/**
 * ATS Resolver - Fetches job data from public ATS APIs
 *
 * Supported platforms (no authentication required):
 * - Workable
 * - Greenhouse
 * - Lever
 * - Ashby
 * - Recruitee
 * - Gem
 * - SmartRecruiters
 */

export interface ATSJobData {
  source: string;
  client: string;
  jobId?: string;
  title: string;
  description?: string;
  location?: string;
  department?: string;
  employmentType?: string;
  remote?: boolean;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  applyUrl?: string;
  postedAt?: string;
  raw: unknown;
}

export interface ATSMatch {
  platform: string;
  client: string;
  jobId?: string;
}

interface WorkableJob {
  shortcode?: string;
  title: string;
  description?: string;
  full_description?: string;
  code?: string;
  shortlink?: string;
  country?: string;
  city?: string;
  state?: string;
  education?: string;
  experience?: string;
  function?: string;
  industry?: string;
  department?: string;
  employment_type?: string;
  telecommuting?: boolean;
  remote?: boolean;
  locations?: Array<{
    country?: string;
    countryCode?: string;
    city?: string;
    region?: string | null;
    hidden?: boolean;
  }>;
  salary?: {
    salary_from?: number;
    salary_to?: number;
    salary_currency?: string;
  };
  application_url?: string;
  url?: string;
  published_on?: string;
  created_at?: string;
}

interface WorkableResponse {
  name: string;
  description?: string;
  jobs: WorkableJob[];
}

interface GreenhouseJob {
  id: number;
  title: string;
  content?: string;
  location?: { name?: string };
  departments?: Array<{
    id?: number;
    name?: string;
    child_ids?: number[];
    parent_id?: number | null;
  }>;
  employment_type?: string;
  absolute_url?: string;
  updated_at?: string;
  internal_job_id?: number;
  company_name?: string;
  data_compliance?: Array<{
    type?: string;
    requires_consent?: boolean;
    requires_processing_consent?: boolean;
    requires_retention_consent?: boolean;
    retention_period?: string | null;
    demographic_data_consent_applies?: boolean;
  }>;
  metadata?: Array<{
    id?: number;
    name?: string;
    value?: string | string[] | null;
    value_type?: string;
  }>;
  offices?: Array<{
    id?: number;
    name?: string;
    location?: string;
    child_ids?: number[];
    parent_id?: number | null;
  }>;
  requisition_id?: string;
  first_published?: string;
  language?: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
  meta?: { total?: number };
}

interface LeverJob {
  id: string;
  text: string;
  description?: string;
  descriptionPlain?: string;
  descriptionBody?: string;
  descriptionBodyPlain?: string;
  additional?: string;
  additionalPlain?: string;
  opening?: string;
  openingPlain?: string;
  lists?: Array<{ text?: string; content?: string }>;
  categories?: {
    location?: string;
    department?: string;
    commitment?: string;
    team?: string;
    allLocations?: string[];
  };
  workplaceType?: string;
  salaryRange?: {
    min?: number | null;
    max?: number | null;
    currency?: string | null;
    interval?: string;
  };
  salaryDescription?: string;
  salaryDescriptionPlain?: string;
  applyUrl?: string;
  hostedUrl?: string;
  createdAt?: number;
  country?: string;
}

interface AshbyJob {
  id: string;
  title: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
  address?: string | null;
  location?: string;
  department?: string;
  employmentType?: string;
  isRemote?: boolean | null;
  isListed?: boolean;
  compensation?: {
    compensationTierSummary?: {
      min?: number | null;
      max?: number | null;
      currency?: string | null;
    } | null;
    compensationTiers?: Array<{
      id?: string;
      tierSummary?: string;
      title?: string;
      additionalInformation?: string | null;
      components?: Array<{
        id?: string;
        summary?: string;
        compensationType?: string;
        interval?: string;
        currencyCode?: string | null;
        minValue?: number | null;
        maxValue?: number | null;
      }>;
    }>;
    scrapeableCompensationSalarySummary?: {
      min?: number | null;
      max?: number | null;
      currency?: string | null;
    } | null;
    summaryComponents?: Array<{
      id?: string;
      summary?: string;
      compensationType?: string;
      interval?: string;
      currencyCode?: string | null;
      minValue?: number | null;
      maxValue?: number | null;
    }>;
  };
  applyUrl?: string;
  jobUrl?: string;
  publishedAt?: string;
  secondaryLocations?: Array<{
    location?: string;
    address?: { postalAddress?: Record<string, string> } | null;
  }>;
  shouldDisplayCompensationOnJobPostings?: boolean;
  team?: string;
}

interface AshbyResponse {
  apiVersion?: string;
  jobs: AshbyJob[];
}

interface RecruiteeJob {
  id: number;
  slug?: string;
  title: string;
  description?: string;
  location?: string;
  city?: string;
  state_code?: string;
  state_name?: string;
  country?: string;
  country_code?: string;
  department?: string;
  requirements?: string;
  category_code?: string;
  education_code?: string;
  employment_type_code?: string;
  experience_code?: string;
  remote?: boolean;
  hybrid?: boolean;
  on_site?: boolean;
  salary?: {
    min?: string | number | null;
    max?: string | number | null;
    period?: string | null;
    currency?: string | null;
  };
  careers_url?: string;
  careers_apply_url?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface RecruiteeResponse {
  offers: RecruiteeJob[];
}

interface GemJob {
  id: string;
  title: string;
  absolute_url?: string;
  content?: string;
  content_plain?: string;
  created_at?: string;
  updated_at?: string;
  first_published_at?: string;
  internal_job_id?: string;
  requisition_id?: string;
  employment_type?: string;
  location?: { name?: string };
  location_type?: string;
  departments?: Array<{
    id?: string;
    name?: string;
    parent_id?: string | null;
    child_ids?: string[];
  }>;
  offices?: Array<{
    id?: string;
    name?: string;
    location?: { name?: string };
    parent_id?: string | null;
  }>;
}

type GemResponse = GemJob[];

interface SmartRecruitersJob {
  id?: string;
  uuid?: string;
  name?: string;
  jobAdId?: string;
  jobId?: string;
  defaultJobAd?: boolean;
  refNumber?: string;
  ref?: string;
  company?: { identifier?: string; name?: string };
  jobAd?: {
    sections?: {
      companyDescription?: { title?: string; text?: string };
      jobDescription?: { title?: string; text?: string };
      qualifications?: { title?: string; text?: string };
      additionalInformation?: { title?: string; text?: string };
    };
  };
  location?: {
    city?: string;
    region?: string;
    country?: string;
    remote?: boolean;
    hybrid?: boolean;
    fullLocation?: string;
    latitude?: string;
    longitude?: string;
  };
  department?: { id?: string | number; label?: string };
  typeOfEmployment?: { id?: string; label?: string };
  experienceLevel?: { id?: string; label?: string };
  industry?: { id?: string; label?: string };
  function?: { id?: string; label?: string };
  language?: { code?: string; label?: string; labelNative?: string };
  customField?: Array<{
    fieldId?: string;
    fieldLabel?: string;
    valueId?: string;
    valueLabel?: string;
  }>;
  applyUrl?: string;
  postingUrl?: string;
  referralUrl?: string;
  releasedDate?: string;
  active?: boolean;
  visibility?: string;
}

interface SmartRecruitersResponse {
  content: SmartRecruitersJob[];
  limit?: number;
  offset?: number;
  totalFound?: number;
}

// ============================================================================
// URL Matchers
// ============================================================================

const ATS_PATTERNS: Record<string, RegExp[]> = {
  workable: [
    /^https?:\/\/apply\.workable\.com\/([^/]+)(?:\/j\/([A-Z0-9]+))?/i,
    /^https?:\/\/([^.]+)\.workable\.com\/(?:j\/([A-Z0-9]+))?/i,
  ],
  greenhouse: [
    /^https?:\/\/boards\.greenhouse\.io\/([^/]+)(?:\/jobs\/(\d+))?/i,
    /^https?:\/\/([^.]+)\.greenhouse\.io\/(?:jobs\/(\d+))?/i,
    /^https?:\/\/job-boards\.greenhouse\.io\/([^/]+)(?:\/jobs\/(\d+))?/i,
  ],
  lever: [/^https?:\/\/jobs\.lever\.co\/([^/]+)(?:\/([a-f0-9-]+))?/i],
  ashby: [/^https?:\/\/jobs\.ashbyhq\.com\/([^/]+)(?:\/([a-f0-9-]+))?/i],
  recruitee: [/^https?:\/\/([^.]+)\.recruitee\.com(?:\/o\/([^/]+))?/i],
  gem: [/^https?:\/\/jobs\.gem\.com\/([^/]+)(?:\/([^/]+))?/i],
  smartrecruiters: [
    /^https?:\/\/jobs\.smartrecruiters\.com\/([^/]+)(?:\/([^/]+))?/i,
    /^https?:\/\/careers\.smartrecruiters\.com\/([^/]+)(?:\/([^/]+))?/i,
  ],
};

/**
 * Match a URL to a known ATS platform
 */
export function matchATSUrl(url: string): ATSMatch | null {
  for (const [platform, patterns] of Object.entries(ATS_PATTERNS)) {
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return {
          platform,
          client: match[1],
          jobId: match[2] || undefined,
        };
      }
    }
  }
  return null;
}

// ============================================================================
// API Fetchers
// ============================================================================

// Find response at responses/workable-jobs.json
async function fetchWorkableJobs(client: string): Promise<WorkableResponse> {
  const res = await fetch(
    `https://apply.workable.com/api/v1/widget/accounts/${client}`
  );
  if (!res.ok) {
    throw new Error(`Workable API error: ${res.status}`);
  }
  return res.json();
}

// Find response at responses/greenhouse-jobs.json
async function fetchGreenhouseJobs(
  client: string
): Promise<GreenhouseResponse> {
  const res = await fetch(
    `https://api.greenhouse.io/v1/boards/${client}/jobs?content=true`
  );
  if (!res.ok) {
    throw new Error(`Greenhouse API error: ${res.status}`);
  }
  return res.json();
}

// Find response at responses/greenhouse-job.json
async function fetchGreenhouseJob(
  client: string,
  jobId: string
): Promise<GreenhouseJob> {
  const res = await fetch(
    `https://api.greenhouse.io/v1/boards/${client}/jobs/${jobId}`
  );
  if (!res.ok) {
    throw new Error(`Greenhouse API error: ${res.status}`);
  }
  return res.json();
}

// Find response at responses/lever-jobs.json
async function fetchLeverJobs(client: string): Promise<LeverJob[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${client}`);
  if (!res.ok) {
    throw new Error(`Lever API error: ${res.status}`);
  }
  return res.json();
}

// Find response at responses/lever-job.json
async function fetchLeverJob(client: string, jobId: string): Promise<LeverJob> {
  const res = await fetch(
    `https://api.lever.co/v0/postings/${client}/${jobId}`
  );
  if (!res.ok) {
    throw new Error(`Lever API error: ${res.status}`);
  }
  return res.json();
}

// Find response at responses/ashby-jobs.json
async function fetchAshbyJobs(
  client: string
): Promise<{ jobs: AshbyJob[]; apiVersion: string }> {
  const res = await fetch(
    `https://api.ashbyhq.com/posting-api/job-board/${client}?includeCompensation=true`
  );
  if (!res.ok) {
    throw new Error(`Ashby API error: ${res.status}`);
  }
  return res.json();
}

// Find response at responses/recruitee-jobs.json
async function fetchRecruiteeJobs(client: string): Promise<RecruiteeResponse> {
  const res = await fetch(`https://${client}.recruitee.com/api/offers`);
  if (!res.ok) {
    throw new Error(`Recruitee API error: ${res.status}`);
  }
  return res.json();
}

// Find response at responses/gem-jobs.json
async function fetchGemJobs(client: string): Promise<GemResponse> {
  const res = await fetch(
    `https://api.gem.com/job_board/v0/${client}/job_posts/`
  );
  if (!res.ok) {
    throw new Error(`Gem API error: ${res.status}`);
  }
  return res.json();
}

// Find response at responses/smartrecruiters-jobs.json
async function fetchSmartRecruitersJobs(
  client: string
): Promise<SmartRecruitersResponse> {
  const res = await fetch(
    `https://api.smartrecruiters.com/v1/companies/${client}/postings`
  );
  if (!res.ok) {
    throw new Error(`SmartRecruiters API error: ${res.status}`);
  }
  return res.json();
}

// Find response at responses/smartrecruiters-job.json
async function fetchSmartRecruitersJob(
  client: string,
  jobId: string
): Promise<SmartRecruitersJob> {
  const res = await fetch(
    `https://api.smartrecruiters.com/v1/companies/${client}/postings/${jobId}`
  );
  if (!res.ok) {
    throw new Error(`SmartRecruiters API error: ${res.status}`);
  }
  return res.json();
}

// ============================================================================
// Normalizers - Convert platform-specific data to common format
// ============================================================================

function normalizeWorkableJob(job: WorkableJob, client: string): ATSJobData {
  const primaryLocation =
    job.locations?.find((location) => !location.hidden) ?? job.locations?.[0];
  const locationParts = [
    primaryLocation?.city,
    primaryLocation?.region,
    primaryLocation?.country,
  ].filter((value): value is string => Boolean(value));
  const location =
    (locationParts.length ? locationParts.join(", ") : undefined) ||
    job.city ||
    job.country;

  return {
    source: "workable",
    client,
    jobId: job.shortcode,
    title: job.title,
    description: job.description || job.full_description,
    location,
    department: job.department,
    employmentType: job.employment_type,
    remote: job.telecommuting || job.remote,
    salary: job.salary
      ? {
          min: job.salary.salary_from,
          max: job.salary.salary_to,
          currency: job.salary.salary_currency,
        }
      : undefined,
    applyUrl: job.application_url || job.url,
    postedAt: job.published_on || job.created_at,
    raw: job,
  };
}

function normalizeGreenhouseJob(
  job: GreenhouseJob,
  client: string
): ATSJobData {
  const employmentType = job.metadata?.find(
    (meta) => meta.name === "Employment Type"
  )?.value;
  const employmentTypeValue = Array.isArray(employmentType)
    ? employmentType[0]
    : employmentType;

  return {
    source: "greenhouse",
    client,
    jobId: String(job.id),
    title: job.title,
    description: job.content,
    location: job.location?.name,
    department: job.departments?.[0]?.name,
    employmentType:
      typeof employmentTypeValue === "string"
        ? employmentTypeValue
        : job.employment_type,
    remote: job.location?.name?.toLowerCase().includes("remote") ?? false,
    applyUrl: job.absolute_url,
    postedAt: job.updated_at,
    raw: job,
  };
}

function normalizeLeverJob(job: LeverJob, client: string): ATSJobData {
  return {
    source: "lever",
    client,
    jobId: job.id,
    title: job.text,
    description: job.descriptionPlain || job.description,
    location: job.categories?.location,
    department: job.categories?.department,
    employmentType: job.categories?.commitment,
    remote:
      job.workplaceType === "remote" ||
      job.categories?.location?.toLowerCase().includes("remote"),
    salary: job.salaryRange
      ? {
          min: job.salaryRange.min ?? undefined,
          max: job.salaryRange.max ?? undefined,
          currency: job.salaryRange.currency ?? undefined,
        }
      : undefined,
    applyUrl: job.applyUrl || job.hostedUrl,
    postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
    raw: job,
  };
}

function normalizeAshbyJob(job: AshbyJob, client: string): ATSJobData {
  const compensationSummary =
    job.compensation?.compensationTierSummary ??
    job.compensation?.scrapeableCompensationSalarySummary;

  return {
    source: "ashby",
    client,
    jobId: job.id,
    title: job.title,
    description: job.descriptionHtml || job.descriptionPlain,
    location: job.location,
    department: job.department,
    employmentType: job.employmentType,
    remote: job.isRemote ?? undefined,
    salary: compensationSummary
      ? {
          min: compensationSummary.min ?? undefined,
          max: compensationSummary.max ?? undefined,
          currency: compensationSummary.currency ?? undefined,
        }
      : undefined,
    applyUrl: job.applyUrl || job.jobUrl,
    postedAt: job.publishedAt,
    raw: job,
  };
}

function normalizeRecruiteeJob(job: RecruiteeJob, client: string): ATSJobData {
  const parseSalaryValue = (
    value: string | number | null | undefined
  ): number | undefined => {
    if (value === null || value === undefined) {
      return undefined;
    }
    const numericValue =
      typeof value === "number" ? value : Number.parseFloat(value);
    return Number.isNaN(numericValue) ? undefined : numericValue;
  };

  return {
    source: "recruitee",
    client,
    jobId: job.slug || String(job.id),
    title: job.title,
    description: job.description,
    location: job.location,
    department: job.department,
    employmentType: job.employment_type_code,
    remote: job.remote,
    salary: job.salary
      ? {
          min: parseSalaryValue(job.salary.min),
          max: parseSalaryValue(job.salary.max),
          currency: job.salary.currency ?? undefined,
        }
      : undefined,
    applyUrl: job.careers_url || job.careers_apply_url,
    postedAt: job.published_at,
    raw: job,
  };
}

function normalizeGemJob(job: GemJob, client: string): ATSJobData {
  return {
    source: "gem",
    client,
    jobId: job.id,
    title: job.title,
    description: job.content_plain || job.content,
    location: job.location?.name,
    department: job.departments?.[0]?.name,
    employmentType: job.employment_type,
    applyUrl: job.absolute_url,
    postedAt: job.first_published_at || job.created_at || job.updated_at,
    raw: job,
  };
}

function normalizeSmartRecruitersJob(
  job: SmartRecruitersJob,
  client: string
): ATSJobData {
  const locationParts = [
    job.location?.city,
    job.location?.region,
    job.location?.country,
  ].filter((value): value is string => Boolean(value));
  const location =
    locationParts.length > 0
      ? locationParts.join(", ")
      : job.location?.fullLocation;

  return {
    source: "smartrecruiters",
    client,
    jobId: job.id || job.uuid,
    title: job.name ?? job.refNumber ?? job.id ?? job.uuid ?? "Unknown role",
    description: job.jobAd?.sections?.jobDescription?.text,
    location,
    department: job.department?.label,
    employmentType: job.typeOfEmployment?.label,
    remote: job.location?.remote,
    applyUrl: job.ref || job.applyUrl,
    postedAt: job.releasedDate,
    raw: job,
  };
}

// ============================================================================
// Platform Handlers - Single job fetch
// ============================================================================

async function handleWorkableJob(
  client: string,
  jobId?: string
): Promise<ATSJobData | null> {
  const data = (await fetchWorkableJobs(client)) as WorkableResponse;
  const jobs = data.jobs || [];
  if (jobId) {
    const job = jobs.find(
      (j: WorkableJob) =>
        j.shortcode === jobId ||
        j.shortcode?.toLowerCase() === jobId.toLowerCase()
    );
    return job ? normalizeWorkableJob(job, client) : null;
  }
  return jobs[0] ? normalizeWorkableJob(jobs[0], client) : null;
}

async function handleGreenhouseJob(
  client: string,
  jobId?: string
): Promise<ATSJobData | null> {
  if (jobId) {
    const job = (await fetchGreenhouseJob(client, jobId)) as GreenhouseJob;
    return normalizeGreenhouseJob(job, client);
  }
  const data = (await fetchGreenhouseJobs(client)) as GreenhouseResponse;
  const jobs = data.jobs || [];
  return jobs[0] ? normalizeGreenhouseJob(jobs[0], client) : null;
}

async function handleLeverJob(
  client: string,
  jobId?: string
): Promise<ATSJobData | null> {
  if (jobId) {
    const job = (await fetchLeverJob(client, jobId)) as LeverJob;
    return normalizeLeverJob(job, client);
  }
  const jobs = (await fetchLeverJobs(client)) as LeverJob[];
  return jobs[0] ? normalizeLeverJob(jobs[0], client) : null;
}

async function handleAshbyJob(
  client: string,
  jobId?: string
): Promise<ATSJobData | null> {
  const data = (await fetchAshbyJobs(client)) as AshbyResponse;
  const jobs = data.jobs || [];
  if (jobId) {
    const job = jobs.find((j: AshbyJob) => j.id === jobId);
    return job ? normalizeAshbyJob(job, client) : null;
  }
  return jobs[0] ? normalizeAshbyJob(jobs[0], client) : null;
}

async function handleRecruiteeJob(
  client: string,
  jobId?: string
): Promise<ATSJobData | null> {
  const data = (await fetchRecruiteeJobs(client)) as RecruiteeResponse;
  const jobs = data.offers || [];
  if (jobId) {
    const job = jobs.find(
      (j: RecruiteeJob) => j.slug === jobId || String(j.id) === jobId
    );
    return job ? normalizeRecruiteeJob(job, client) : null;
  }
  return jobs[0] ? normalizeRecruiteeJob(jobs[0], client) : null;
}

async function handleGemJob(
  client: string,
  jobId?: string
): Promise<ATSJobData | null> {
  const jobs = (await fetchGemJobs(client)) as GemResponse;
  if (jobId) {
    const job = jobs.find((j: GemJob) => j.id === jobId);
    return job ? normalizeGemJob(job, client) : null;
  }
  return jobs[0] ? normalizeGemJob(jobs[0], client) : null;
}

async function handleSmartRecruitersJob(
  client: string,
  jobId?: string
): Promise<ATSJobData | null> {
  if (jobId) {
    const job = (await fetchSmartRecruitersJob(
      client,
      jobId
    )) as SmartRecruitersJob;
    return normalizeSmartRecruitersJob(job, client);
  }
  const data = (await fetchSmartRecruitersJobs(
    client
  )) as SmartRecruitersResponse;
  const jobs = data.content || [];
  return jobs[0] ? normalizeSmartRecruitersJob(jobs[0], client) : null;
}

type JobHandler = (
  client: string,
  jobId?: string
) => Promise<ATSJobData | null>;

const JOB_HANDLERS: Record<string, JobHandler> = {
  workable: handleWorkableJob,
  greenhouse: handleGreenhouseJob,
  lever: handleLeverJob,
  ashby: handleAshbyJob,
  recruitee: handleRecruiteeJob,
  gem: handleGemJob,
  smartrecruiters: handleSmartRecruitersJob,
};

// ============================================================================
// Main API
// ============================================================================

/**
 * Fetch job data from a URL if it matches a known ATS
 * Returns null if URL doesn't match any known ATS pattern
 */
export async function fetchJobFromUrl(url: string): Promise<ATSJobData | null> {
  const match = matchATSUrl(url);
  if (!match) {
    return null;
  }

  const { platform, client, jobId } = match;
  const handler = JOB_HANDLERS[platform];

  if (!handler) {
    return null;
  }

  try {
    return await handler(client, jobId);
  } catch (error) {
    console.error(`Error fetching from ${platform}:`, error);
    return null;
  }
}

/**
 * Fetch all jobs from a company's ATS
 */
export async function fetchAllJobsFromUrl(
  url: string
): Promise<ATSJobData[] | null> {
  const match = matchATSUrl(url);
  if (!match) {
    return null;
  }

  const { platform, client } = match;

  try {
    switch (platform) {
      case "workable": {
        const data = (await fetchWorkableJobs(client)) as WorkableResponse;
        return (data.jobs || []).map((j: WorkableJob) =>
          normalizeWorkableJob(j, client)
        );
      }

      case "greenhouse": {
        const data = (await fetchGreenhouseJobs(client)) as GreenhouseResponse;
        return (data.jobs || []).map((j: GreenhouseJob) =>
          normalizeGreenhouseJob(j, client)
        );
      }

      case "lever": {
        const jobs = (await fetchLeverJobs(client)) as LeverJob[];
        return jobs.map((j: LeverJob) => normalizeLeverJob(j, client));
      }

      case "ashby": {
        const data = (await fetchAshbyJobs(client)) as AshbyResponse;
        return (data.jobs || []).map((j: AshbyJob) =>
          normalizeAshbyJob(j, client)
        );
      }

      case "recruitee": {
        const data = (await fetchRecruiteeJobs(client)) as RecruiteeResponse;
        return (data.offers || []).map((j: RecruiteeJob) =>
          normalizeRecruiteeJob(j, client)
        );
      }

      case "gem": {
        const jobs = (await fetchGemJobs(client)) as GemResponse;
        return jobs.map((j: GemJob) => normalizeGemJob(j, client));
      }

      case "smartrecruiters": {
        const data = (await fetchSmartRecruitersJobs(
          client
        )) as SmartRecruitersResponse;
        return (data.content || []).map((j: SmartRecruitersJob) =>
          normalizeSmartRecruitersJob(j, client)
        );
      }

      default:
        return null;
    }
  } catch (error) {
    console.error(`Error fetching from ${platform}:`, error);
    return null;
  }
}

/**
 * Check if a URL matches a known ATS with a public API
 */
export function isKnownATSUrl(url: string): boolean {
  return matchATSUrl(url) !== null;
}

/**
 * Get the platform name for a URL
 */
export function getATSPlatform(url: string): string | null {
  const match = matchATSUrl(url);
  return match?.platform || null;
}
