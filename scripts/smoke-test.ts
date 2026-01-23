const baseUrl = process.env.BASE_URL ?? "http://localhost:8787";
const token = process.env.API_TOKEN;

if (!token) {
  console.error("API_TOKEN is required (set env var).");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
};

async function request(
  path: string,
  options?: RequestInit
): Promise<{ status: number; body: string }> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers ?? {}),
    },
  });

  return {
    status: response.status,
    body: await response.text(),
  };
}

function expectStatus(name: string, status: number, expected: number): void {
  if (status !== expected) {
    console.error(`${name} failed: expected ${expected}, got ${status}`);
    process.exit(1);
  }
}

async function loadResumePayload(): Promise<string> {
  const resumeFile = Bun.file("sample-resume.json");
  if (await resumeFile.exists()) {
    return resumeFile.text();
  }
  return JSON.stringify({ basics: { name: "Test User" } });
}

async function main(): Promise<void> {
  const root = await request("/");
  expectStatus("GET /", root.status, 200);

  const badCustomize = await request("/customize", {
    method: "POST",
    body: "not json",
  });
  expectStatus("POST /customize invalid JSON", badCustomize.status, 400);

  const resumePayload = await loadResumePayload();
  const putResume = await request("/resume", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: resumePayload,
  });
  expectStatus("PUT /resume", putResume.status, 200);

  const getResume = await request("/resume");
  expectStatus("GET /resume", getResume.status, 200);

  if (process.env.RUN_CUSTOMIZE === "1") {
    const customizeInput =
      process.env.CUSTOMIZE_INPUT ??
      "Software Engineer at Acme Corp\n\nRequirements:\n- 3+ years TypeScript\n- React experience";
    const customize = await request("/customize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: customizeInput }),
    });
    expectStatus("POST /customize", customize.status, 200);
  }

  console.log("Smoke tests passed.");
}

await main();
