import Anthropic from "@anthropic-ai/sdk";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { cors } from "hono/cors";
import { buildUserPrompt, parseResponse, SYSTEM_PROMPT } from "./prompt";
import type {
	CustomizeRequest,
	CustomizeResponse,
	Env,
	JSONResume,
	LLMResponse,
} from "./types";

const app = new Hono<{ Bindings: Env }>();

// CORS for web form access
app.use("*", cors());

// Auth middleware - all routes require bearer token
app.use("*", async (c, next) => {
	const auth = bearerAuth({ token: c.env.API_TOKEN });
	return auth(c, next);
});

// Health check
app.get("/", (c) => {
	return c.json({ status: "ok", service: "job-flow" });
});

// Main customization endpoint
app.post("/customize", async (c) => {
	const body = await c.req.json<CustomizeRequest>();
	const { input } = body;

	if (!input || typeof input !== "string") {
		return c.json({ error: "Missing or invalid 'input' field" }, 400);
	}

	// 1. Fetch job text (URL or raw text)
	const jobText = await getJobText(input);

	// 2. Load master resume from R2
	const resume = await getResume(c.env.BUCKET);
	if (!resume) {
		return c.json(
			{ error: "Master resume not found in R2. Upload resume.json first." },
			500,
		);
	}

	// 3. Call Claude to customize
	const anthropic = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });

	const message = await anthropic.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 8192,
		messages: [
			{
				role: "user",
				content: buildUserPrompt(jobText, resume),
			},
		],
		system: SYSTEM_PROMPT,
	});

	// Extract text content from response
	const textBlock = message.content.find((block) => block.type === "text");
	if (!textBlock || textBlock.type !== "text") {
		return c.json({ error: "No text response from Claude" }, 500);
	}

	// 4. Parse the response
	let parsed: LLMResponse;
	try {
		parsed = parseResponse(textBlock.text);
	} catch (e) {
		return c.json(
			{
				error: "Failed to parse Claude response",
				details: e instanceof Error ? e.message : String(e),
				raw: textBlock.text,
			},
			500,
		);
	}

	// 5. Build response
	const response: CustomizeResponse = {
		job: parsed.job,
		original: resume,
		customized: parsed.customized,
		changes: parsed.changes,
		reasoning: parsed.reasoning,
	};

	return c.json(response);
});

// Upload/update master resume
app.put("/resume", async (c) => {
	const resume = await c.req.json<JSONResume>();

	// Basic validation
	if (!resume.basics?.name) {
		return c.json({ error: "Invalid JSON Resume: missing basics.name" }, 400);
	}

	await c.env.BUCKET.put("resume.json", JSON.stringify(resume, null, 2), {
		httpMetadata: { contentType: "application/json" },
	});

	return c.json({ status: "ok", message: "Resume uploaded" });
});

// Get current master resume
app.get("/resume", async (c) => {
	const resume = await getResume(c.env.BUCKET);
	if (!resume) {
		return c.json({ error: "No resume found" }, 404);
	}
	return c.json(resume);
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function getJobText(input: string): Promise<string> {
	const trimmed = input.trim();

	// Check if it looks like a URL
	if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
		try {
			// Use Jina Reader API for clean extraction
			const jinaUrl = `https://r.jina.ai/${trimmed}`;
			const response = await fetch(jinaUrl, {
				headers: {
					// Jina respects Accept header for format
					Accept: "text/plain",
				},
			});

			if (response.ok) {
				const text = await response.text();
				// Jina returns markdown - that's fine for our purposes
				if (text && text.length > 100) {
					return text;
				}
			}
			// If Jina fails or returns too little, fall through
			console.log(
				"Jina fetch failed or returned insufficient content, using raw input",
			);
		} catch (e) {
			console.log("Jina fetch error:", e);
			// Fall through to return raw input
		}
	}

	// Not a URL, or URL fetch failed - treat as raw job text
	return trimmed;
}

async function getResume(bucket: R2Bucket): Promise<JSONResume | null> {
	const object = await bucket.get("resume.json");
	if (!object) return null;

	const text = await object.text();
	return JSON.parse(text) as JSONResume;
}

export default app;
