import Anthropic from "@anthropic-ai/sdk";
import type { Context } from "hono";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { buildUserPrompt, parseResponse, SYSTEM_PROMPT } from "./prompt";
import type {
  CustomizeRequest,
  CustomizeResponse,
  Env,
  JSONResume,
  LLMResponse,
} from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());
app.use("/api/*", (c, next) => {
  if (c.req.method === "OPTIONS") {
    return next();
  }
  return bearerAuth({ token: c.env.API_TOKEN })(c, next);
});

app.get("/", async (c) => {
  const url = new URL(c.req.url);
  return await c.env.ASSETS.fetch(new URL(url.origin));
});

app.post("/api/customize", async (c) => {
  const parsedBody = await parseJsonBody<CustomizeRequest>(c);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { input } = parsedBody.value;

  if (!input || typeof input !== "string") {
    return jsonError(c, 400, "Missing or invalid 'input' field");
  }

  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return jsonError(c, 400, "Input cannot be empty");
  }

  if (trimmedInput.length > 50_000) {
    return jsonError(c, 413, "Input too large");
  }

  const jobText = await getJobText(trimmedInput);

  const resumeResult = await getResume(c.env.BUCKET);
  if (!resumeResult.ok) {
    if (resumeResult.reason === "corrupt") {
      return jsonError(c, 500, "Stored resume.json is corrupted");
    }
    return jsonError(
      c,
      500,
      "Master resume not found in R2. Upload resume.json first."
    );
  }
  const resume = resumeResult.resume;

  const anthropic = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });

  let message: Anthropic.Message;
  try {
    message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(jobText, resume),
        },
      ],
      system: SYSTEM_PROMPT,
    });
  } catch (e) {
    return jsonError(c, 500, "Claude request failed", {
      details: e instanceof Error ? e.message : String(e),
    });
  }

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return jsonError(c, 500, "No text response from Claude", {
      raw: message.content,
    });
  }

  let parsed: LLMResponse;
  try {
    parsed = parseResponse(textBlock.text);
  } catch (e) {
    return jsonError(c, 500, "Failed to parse Claude response", {
      details: e instanceof Error ? e.message : String(e),
      raw: textBlock.text,
    });
  }

  const response: CustomizeResponse = {
    job: parsed.job,
    original: resume,
    customized: parsed.customized,
    changes: parsed.changes,
    reasoning: parsed.reasoning,
  };

  return c.json(response);
});

app.put("/api/resume", async (c) => {
  const parsedBody = await parseJsonBody<JSONResume>(c);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const resume = parsedBody.value;

  if (!resume.basics?.name) {
    return jsonError(c, 400, "Invalid JSON Resume: missing basics.name");
  }

  try {
    await c.env.BUCKET.put("resume.json", JSON.stringify(resume, null, 2), {
      httpMetadata: { contentType: "application/json" },
    });
  } catch (e) {
    return jsonError(c, 500, "Failed to write resume", {
      details: e instanceof Error ? e.message : String(e),
    });
  }

  return c.json({ status: "ok", message: "Resume uploaded" });
});

app.get("/api/resume", async (c) => {
  const resumeResult = await getResume(c.env.BUCKET);
  if (!resumeResult.ok) {
    if (resumeResult.reason === "corrupt") {
      return jsonError(c, 500, "Stored resume.json is corrupted");
    }
    return jsonError(c, 404, "No resume found");
  }
  return c.json(resumeResult.resume);
});

async function getJobText(input: string): Promise<string> {
  const trimmed = input.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const jinaUrl = `https://r.jina.ai/${trimmed}`;
      const response = await fetch(jinaUrl, {
        headers: {
          Accept: "text/plain",
        },
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.length > 100) {
          return text;
        }
      }
      console.log(
        "Jina fetch failed or returned insufficient content, using raw input"
      );
    } catch (e) {
      console.log("Jina fetch error:", e);
    }
  }

  return trimmed;
}

type ResumeResult =
  | { ok: true; resume: JSONResume }
  | { ok: false; reason: "missing" | "corrupt" };

async function getResume(bucket: R2Bucket): Promise<ResumeResult> {
  const object = await bucket.get("resume.json");
  if (!object) {
    return { ok: false, reason: "missing" };
  }

  const text = await object.text();
  try {
    return { ok: true, resume: JSON.parse(text) as JSONResume };
  } catch {
    return { ok: false, reason: "corrupt" };
  }
}

type JsonParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; response: Response };

function jsonError(
  c: Context,
  status: number,
  error: string,
  options?: { details?: string; raw?: unknown }
): Response {
  const body: {
    error: string;
    details?: string;
    raw?: unknown;
  } = { error };

  if (options?.details) {
    body.details = options.details;
  }
  if (options?.raw !== undefined) {
    body.raw = options.raw;
  }

  return c.json(body, status as ContentfulStatusCode);
}

async function parseJsonBody<T>(c: Context): Promise<JsonParseResult<T>> {
  try {
    const value = await c.req.json<T>();
    return { ok: true, value };
  } catch (e) {
    return {
      ok: false,
      response: jsonError(c, 400, "Invalid JSON body", {
        details: e instanceof Error ? e.message : String(e),
      }),
    };
  }
}

export default app;
