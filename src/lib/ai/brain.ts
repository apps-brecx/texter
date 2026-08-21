import "server-only";
import type { ContentType, Review } from "@prisma/client";
import { db } from "@/lib/db";
import { generateJson } from "@/lib/ai/provider";
import { lessonPrompt, renderBrain, systemPrompt } from "@/lib/ai/prompts";
import { LessonSchema } from "@/lib/ai/types";

const MAX_ENTRIES = 90;

/**
 * Everything the brain knows that is relevant to this format, heaviest first.
 * Weight is bumped whenever a rule survives a human edit, so the rules that keep
 * proving themselves stay at the top of the prompt.
 */
export async function loadBrain(workspaceId: string, contentType: ContentType) {
  return db.brainEntry.findMany({
    where: {
      workspaceId,
      status: "ACTIVE",
      OR: [{ appliesTo: { isEmpty: true } }, { appliesTo: { has: contentType } }],
    },
    orderBy: [{ weight: "desc" }, { updatedAt: "desc" }],
    take: MAX_ENTRIES,
  });
}

export async function markBrainUsed(ids: string[]) {
  if (ids.length === 0) return;
  await db.brainEntry.updateMany({ where: { id: { in: ids } }, data: { timesUsed: { increment: 1 } } });
}

/**
 * The self-teaching half. Diffs what the model wrote against what the human
 * actually shipped and files the difference as pending rules for review.
 */
export async function learnFromEdit(review: Review, humanVersion: string, aiVersion: string) {
  const workspace = await db.workspace.findUniqueOrThrow({ where: { id: review.workspaceId } });
  const brain = await loadBrain(workspace.id, review.contentType);
  const style = review.styleId
    ? await db.styleProfile.findUnique({ where: { id: review.styleId } })
    : null;

  const { data } = await generateJson(LessonSchema, {
    provider: workspace.aiProvider,
    model: workspace.aiModel,
    maxTokens: 6000,
    system: systemPrompt({ workspace, style, brain, contentType: review.contentType }),
    prompt: lessonPrompt({
      aiVersion,
      humanVersion,
      contentType: review.contentType,
      existing: brain.map((entry) => entry.title),
    }),
  });

  if (data.lessons.length === 0) {
    // Nothing changed worth learning — the rules that produced this copy held up.
    await db.brainEntry.updateMany({
      where: { id: { in: brain.map((entry) => entry.id) } },
      data: { weight: { increment: 1 } },
    });
    return [];
  }

  const created = await db.$transaction(
    data.lessons.map((lesson) =>
      db.brainEntry.create({
        data: {
          workspaceId: workspace.id,
          kind: lesson.kind,
          origin: "LEARNED",
          status: "PENDING",
          title: lesson.title,
          body: lesson.body,
          wrongForm: lesson.wrongForm,
          rightForm: lesson.rightForm,
          appliesTo: lesson.appliesTo,
          authorId: review.authorId,
          sourceReviewId: review.id,
        },
      }),
    ),
  );

  return created;
}

export { renderBrain };
