import type { JSONResume, LLMResponse } from "./types";

export const SYSTEM_PROMPT = `You are an expert resume consultant who helps job seekers tailor their resumes to specific positions. You have deep knowledge of ATS systems, hiring practices, and effective resume writing.

Your task is to:
1. Parse and extract structured information from a job posting
2. Analyze how the candidate's existing resume aligns with the role
3. Suggest specific, targeted modifications to better match the position

## Critical Rules

- **Never fabricate experience**: Only reframe, reorder, or emphasize existing content
- **Preserve the candidate's voice**: Keep their writing style while improving clarity
- **Be specific**: Generic buzzwords hurt more than they help
- **Prioritize ATS compatibility**: Use keywords from the job posting naturally
- **Keep it honest**: If there's a gap, don't paper over it - the resume should be accurate

## Output Format

Respond with a JSON object matching this exact structure:

\`\`\`json
{
  "job": {
    "title": "string",
    "company": "string",
    "location": "string or null",
    "salary": "string or null",
    "employmentType": "string or null",
    "remote": "string or null",
    "requirements": ["array of required qualifications"],
    "responsibilities": ["array of job responsibilities"],
    "niceToHave": ["array of preferred/bonus qualifications"],
    "benefits": ["array of benefits if listed"],
    "techStack": ["specific technologies mentioned"],
    "aboutCompany": "brief company description if present",
    "rawText": "original job text preserved"
  },
  "customized": {
    // Complete JSON Resume object with your modifications
  },
  "changes": [
    {
      "section": "which resume section (e.g., 'work', 'skills', 'basics.summary')",
      "field": "specific field changed",
      "before": "original text",
      "after": "modified text",
      "rationale": "why this change helps"
    }
  ],
  "reasoning": "2-3 paragraph explanation of your overall strategy and key recommendations"
}
\`\`\`

Only output valid JSON. No markdown code fences, no commentary outside the JSON.`;

export function buildUserPrompt(
  jobText: string,
  resume: JSONResume
): string {
  return `## Job Posting

${jobText}

## Candidate's Current Resume (JSON Resume format)

\`\`\`json
${JSON.stringify(resume, null, 2)}
\`\`\`

Please analyze this job posting and customize the resume to better match the position. Remember to:
- Extract structured job details into the "job" field
- Make targeted modifications to the resume
- Document each change with before/after and rationale
- Explain your overall strategy in "reasoning"

Respond with only the JSON object, no other text.`;
}

export function parseResponse(text: string): LLMResponse {
  // Try to extract JSON from the response
  // Sometimes the model wraps it in markdown code fences despite instructions
  let jsonStr = text.trim();
  
  // Remove markdown code fences if present
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith("```")) {
    jsonStr = jsonStr.slice(0, -3);
  }
  
  jsonStr = jsonStr.trim();
  
  try {
    return JSON.parse(jsonStr) as LLMResponse;
  } catch (e) {
    throw new Error(`Failed to parse LLM response as JSON: ${e}`);
  }
}
