import "server-only";
import { db } from "@/lib/db";
import { specFor } from "@/lib/ai/content-types";
import { outputToText } from "@/lib/ai/format";
import type { Output, Question } from "@/lib/ai/types";

/** How many earlier pieces to feed forward, newest first. */
const MAX_PIECES = 6;
const MAX_COPY_CHARS = 900;
const MAX_ANSWERS = 8;

export type CampaignMemory = {
  name: string;
  brief: string | null;
  /** Rendered for the prompt. Empty string when there's nothing to say yet. */
  text: string;
  pieceCount: number;
};

/**
 * Everything already established elsewhere in this campaign, written out for
 * the model: what each piece was for, the answers a human already gave, and
 * the copy that actually shipped.
 *
 * This is the difference between "what's the offer?" being asked once and
 * being asked on every single piece.
 */
export async function campaignMemory(
  campaignId: string | null,
  excludeReviewId: string | null,
): Promise<CampaignMemory | null> {
  if (!campaignId) return null;

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    include: {
      reviews: {
        where: excludeReviewId ? { id: { not: excludeReviewId } } : undefined,
        orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
        take: MAX_PIECES,
      },
    },
  });
  if (!campaign) return null;

  const pieces = campaign.reviews.filter((review) => review.output || review.answers);

  const lines: string[] = [`## The campaign: ${campaign.name}`];
  if (campaign.brief) lines.push(`Brief: ${campaign.brief}`);

  if (pieces.length === 0) {
    lines.push("This is the first piece. Nothing has been produced for it yet.");
    return { name: campaign.name, brief: campaign.brief, text: lines.join("\n"), pieceCount: 0 };
  }

  lines.push(
    "",
    `Already produced for this campaign (${pieces.length} piece${pieces.length === 1 ? "" : "s"}):`,
  );

  for (const piece of pieces) {
    const spec = specFor(piece.contentType);
    const state = piece.approvedAt ? "shipped" : "drafted, not shipped yet";
    lines.push("", `### ${spec.label} — "${piece.title}" (${state})`);

    const answers = (piece.answers as Record<string, string> | null) ?? {};
    const understanding = answers.__understanding;
    if (understanding) lines.push(`What it was for: ${understanding}`);

    const questions = (piece.questions as Question[] | null) ?? [];
    const answered = questions
      .filter((question) => answers[question.id]?.trim())
      .slice(0, MAX_ANSWERS);

    if (answered.length > 0) {
      lines.push("Already established:");
      for (const question of answered) {
        lines.push(`- ${question.question} -> ${answers[question.id]}`);
      }
    }

    const copy = piece.approvedText ?? outputToText(piece.output as Output | null);
    if (copy) lines.push("Copy used:", truncate(copy, MAX_COPY_CHARS));
  }

  lines.push(
    "",
    "Treat everything above as settled fact for this campaign. Do not ask about it",
    "again, do not contradict it, and do not restate the same sentences word for word.",
  );

  return {
    name: campaign.name,
    brief: campaign.brief,
    text: lines.join("\n"),
    pieceCount: pieces.length,
  };
}

function truncate(value: string, limit: number) {
  const clean = value.trim();
  return clean.length <= limit ? clean : `${clean.slice(0, limit)}…`;
}
