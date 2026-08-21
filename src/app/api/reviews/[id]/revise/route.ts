import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiContext, HttpError, route } from "@/lib/guard";
import { runGeneration } from "@/lib/ai/review";
import { AiConfigError } from "@/lib/ai/provider";

const Body = z.object({ note: z.string().trim().min(2, "Say what to change.").max(2_000) });

export const POST = route(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { workspace } = await apiContext();
  const { id } = await ctx.params;

  const review = await db.review.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!review) throw new HttpError(404, "That review is gone.");
  if (!review.output) throw new HttpError(400, "Nothing has been written yet.");

  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

  const answers = (review.answers as Record<string, string> | null) ?? {};

  try {
    const output = await runGeneration(review, answers, { note: parsed.data.note });
    return NextResponse.json({ output });
  } catch (error) {
    if (error instanceof AiConfigError) throw new HttpError(503, error.message);
    throw error;
  }
});
