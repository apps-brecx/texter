import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { z } from "zod";

export type ImageInput = { mediaType: string; base64: string };

export type CallOptions = {
  provider: string;
  model: string;
  system: string;
  prompt: string;
  images?: ImageInput[];
  maxTokens?: number;
};

export class AiConfigError extends Error {}

/**
 * Both providers are asked for a bare JSON object and the reply is validated
 * against a zod schema. If the first parse fails we hand the model its own
 * output plus the error and let it repair — one attempt, then we give up.
 */
export async function generateJson<T extends z.ZodTypeAny>(
  schema: T,
  options: CallOptions,
): Promise<{ data: z.infer<T>; model: string; provider: string }> {
  const raw = await callModel(options);
  const first = tryParse(schema, raw);
  if (first.ok) return { data: first.value, model: options.model, provider: options.provider };

  const repaired = await callModel({
    ...options,
    images: undefined,
    prompt: [
      "Your previous reply could not be used. Return the corrected JSON only.",
      "",
      "Previous reply:",
      raw.slice(0, 6000),
      "",
      "Validation errors:",
      first.error,
    ].join("\n"),
  });

  const second = tryParse(schema, repaired);
  if (second.ok) return { data: second.value, model: options.model, provider: options.provider };
  throw new Error(`The model returned something we could not read. ${second.error}`);
}

function tryParse<T extends z.ZodTypeAny>(
  schema: T,
  raw: string,
): { ok: true; value: z.infer<T> } | { ok: false; error: string } {
  const json = extractJson(raw);
  if (!json) return { ok: false, error: "No JSON object found in the reply." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    return { ok: false, error: `Invalid JSON: ${(error as Error).message}` };
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; "),
    };
  }
  return { ok: true, value: result.data };
}

/** Models sometimes wrap JSON in prose or a fence; take the outermost object. */
function extractJson(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return body.slice(start, end + 1);
}

async function callModel({ provider, model, system, prompt, images = [], maxTokens = 12000 }: CallOptions) {
  return provider === "openai"
    ? callOpenAI({ model, system, prompt, images, maxTokens })
    : callAnthropic({ model, system, prompt, images, maxTokens });
}

async function callAnthropic({
  model,
  system,
  prompt,
  images,
  maxTokens,
}: Omit<CallOptions, "provider"> & { images: ImageInput[]; maxTokens: number }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiConfigError("ANTHROPIC_API_KEY is not set. Add it in your environment and restart.");
  }
  const client = new Anthropic();

  const content: Anthropic.ContentBlockParam[] = [
    ...images.map<Anthropic.ContentBlockParam>((image) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: image.mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
        data: image.base64,
      },
    })),
    { type: "text", text: prompt },
  ];

  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    messages: [{ role: "user", content }],
  });

  const message = await stream.finalMessage();
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

async function callOpenAI({
  model,
  system,
  prompt,
  images,
  maxTokens,
}: Omit<CallOptions, "provider"> & { images: ImageInput[]; maxTokens: number }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new AiConfigError("OPENAI_API_KEY is not set. Add it in your environment and restart.");
  }
  const client = new OpenAI();

  const response = await client.chat.completions.create({
    model,
    max_completion_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          ...images.map((image) => ({
            type: "image_url" as const,
            image_url: { url: `data:${image.mediaType};base64,${image.base64}` },
          })),
          { type: "text" as const, text: prompt },
        ],
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}
