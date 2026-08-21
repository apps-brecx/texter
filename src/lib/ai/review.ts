import "server-only";
import { Prisma, type ContentType, type Review } from "@prisma/client";
import { db } from "@/lib/db";
import { generateJson, type DocumentInput, type ImageInput } from "@/lib/ai/provider";
import { isPdf } from "@/lib/upload";
import { analysisPrompt, generationPrompt, systemPrompt } from "@/lib/ai/prompts";
import { AnalysisSchema, OutputSchema, type Analysis, type Output, type Question } from "@/lib/ai/types";
import { loadBrain, markBrainUsed } from "@/lib/ai/brain";
import { campaignMemory } from "@/lib/ai/campaign";

async function context(workspaceId: string, contentType: ContentType, styleId: string | null) {
  const [workspace, brain, style] = await Promise.all([
    db.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
    loadBrain(workspaceId, contentType),
    styleId ? db.styleProfile.findUnique({ where: { id: styleId } }) : Promise.resolve(null),
  ]);
  return { workspace, brain, style };
}

type Attachment = { images: ImageInput[]; documents: DocumentInput[] };

const NOTHING: Attachment = { images: [], documents: [] };

async function attachmentFor(assetId: string | null): Promise<Attachment> {
  if (!assetId) return NOTHING;
  const asset = await db.asset.findUnique({ where: { id: assetId } });
  if (!asset) return NOTHING;

  const base64 = Buffer.from(asset.data).toString("base64");
  return isPdf(asset.mimeType)
    ? { images: [], documents: [{ filename: asset.filename, base64 }] }
    : { images: [{ mediaType: asset.mimeType, base64 }], documents: [] };
}

/** Phase 1: read what came in, flag what's wrong, work out what's missing. */
export async function runAnalysis(review: Review): Promise<Analysis> {
  const { workspace, brain, style } = await context(review.workspaceId, review.contentType, review.styleId);
  const [attachment, campaign] = await Promise.all([
    attachmentFor(review.assetId),
    campaignMemory(review.campaignId, review.id),
  ]);

  const { data, model, provider } = await generateJson(AnalysisSchema, {
    provider: workspace.aiProvider,
    model: workspace.aiModel,
    maxTokens: 12000,
    system: systemPrompt({ workspace, style, brain, contentType: review.contentType }),
    prompt: analysisPrompt({
      contentType: review.contentType,
      sourceText: review.sourceText,
      briefNote: review.briefNote,
      attached: attachmentKind(attachment),
      campaign: campaign?.text ?? null,
    }),
    ...attachment,
  });

  // Question ids come from the model; make sure they're unique and stable.
  const questions: Question[] = data.questions.map((question, index) => ({
    ...question,
    id: question.id?.trim() || `q${index + 1}`,
  }));

  await db.review.update({
    where: { id: review.id },
    data: {
      title: data.title.slice(0, 120) || review.title,
      stage: "QUESTIONS",
      imageRead: data.readOfImage ?? undefined,
      issues: data.issues,
      questions,
      briefNote: review.briefNote,
      modelUsed: model,
      provider,
      output: Prisma.DbNull,
      // `understanding` rides along with the questions payload so phase 2 has it.
      answers: { __understanding: data.understanding },
    },
  });

  await markBrainUsed(brain.map((entry) => entry.id));
  return { ...data, questions };
}

/** Phase 2: with the answers in hand, write the thing. */
export async function runGeneration(
  review: Review,
  answers: Record<string, string>,
  revision?: { note: string },
): Promise<Output> {
  const { workspace, brain, style } = await context(review.workspaceId, review.contentType, review.styleId);
  const [attachment, campaign] = await Promise.all([
    attachmentFor(review.assetId),
    campaignMemory(review.campaignId, review.id),
  ]);

  const questions = (review.questions as Question[] | null) ?? [];
  const stored = (review.answers as Record<string, string> | null) ?? {};
  const understanding = stored.__understanding ?? review.briefNote ?? "Marketing copy for this piece.";

  const { data, model, provider } = await generateJson(OutputSchema, {
    provider: workspace.aiProvider,
    model: workspace.aiModel,
    maxTokens: 16000,
    system: systemPrompt({ workspace, style, brain, contentType: review.contentType }),
    prompt: generationPrompt({
      contentType: review.contentType,
      sourceText: review.sourceText,
      briefNote: review.briefNote,
      understanding,
      answers: questions.map((question) => ({
        question: question.question,
        answer: answers[question.id] ?? "",
      })),
      campaign: campaign?.text ?? null,
      previousOutput: revision ? JSON.stringify(review.output) : undefined,
      revisionNote: revision?.note,
    }),
    ...attachment,
  });

  await db.review.update({
    where: { id: review.id },
    data: {
      stage: "READY",
      output: data,
      answers: { ...answers, __understanding: understanding },
      modelUsed: model,
      provider,
    },
  });

  await markBrainUsed(brain.map((entry) => entry.id));
  return data;
}

function attachmentKind({ images, documents }: Attachment): "image" | "pdf" | "none" {
  if (documents.length > 0) return "pdf";
  return images.length > 0 ? "image" : "none";
}
