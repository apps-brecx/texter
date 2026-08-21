import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiContext, HttpError, route } from "@/lib/guard";
import { outputToText } from "@/lib/ai/format";
import { learnFromEdit } from "@/lib/ai/brain";
import type { Output } from "@/lib/ai/types";

const Body = z.object({ finalText: z.string().max(40_000) });

export const POST = route(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { workspace, user } = await apiContext();
  const { id } = await ctx.params;

  const review = await db.review.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!review) throw new HttpError(404, "That review is gone.");
  if (!review.output) throw new HttpError(400, "Nothing has been written yet.");

  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, "Approved text was malformed.");

  const aiVersion = outputToText(review.output as Output);
  const finalText = parsed.data.finalText.trim() || aiVersion;

  await db.review.update({
    where: { id: review.id },
    data: { stage: "APPROVED", approvedText: finalText, approvedAt: new Date() },
  });
  await db.activityLog.create({
    data: { workspaceId: workspace.id, userId: user.id, action: "review.approved", detail: review.title },
  });

  // The learning pass is best-effort: approving must never fail because the
  // model was slow or the key expired.
  let learned = 0;
  if (normalize(finalText) !== normalize(aiVersion)) {
    try {
      learned = (await learnFromEdit(review, finalText, aiVersion)).length;
    } catch (error) {
      console.error("[texter] learning pass failed", error);
    }
  }

  return NextResponse.json({ learned });
});

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
