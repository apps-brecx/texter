import "server-only";
import { Prisma, type ContentType, type Review } from "@prisma/client";
import { db } from "@/lib/db";
import { generateJson, type ImageInput } from "@/lib/ai/provider";
import { analysisPrompt, generationPrompt, systemPrompt } from "@/lib/ai/prompts";
import { AnalysisSchema, OutputSchema, type Analysis, type Output, type Question } from "@/lib/ai/types";
import { loadBrain, markBrainUsed } from "@/lib/ai/brain";

async function context(workspaceId: string, contentType: ContentType, styleId: string | null) {
  const [workspace, brain, style] = await Promise.all([
    db.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
    loadBrain(workspaceId, contentType),
    styleId ? db.styleProfile.findUnique({ where: { id: styleId } }) : Promise.resolve(null),
  ]);
  return { workspace, brain, style };
}

async function imagesFor(assetId: string | null): Promise<ImageInput[]> {
  if (!assetId) return [];
  const asset = await db.asset.findUnique({ where: { id: assetId } });
  if (!asset) return [];
  return [{ mediaType: asset.mimeType, base64: Buffer.from(asset.data).toString("base64") }];
}

/** Phase 1: read what came in, flag what's wrong, work out what's missing. */
export async function runAnalysis(review: Review): Promise<Analysis> {
  const { workspace, brain, style } = await context(review.workspaceId, review.contentType, review.styleId);
  const images = await imagesFor(review.assetId);

  const { data, model, provider } = await generateJson(AnalysisSchema, {
    provider: workspace.aiProvider,
    model: workspace.aiModel,
    maxTokens: 12000,
    system: systemPrompt({ workspace, style, brain, contentType: review.contentType }),
    prompt: analysisPrompt({
      contentType: review.contentType,
      sourceText: review.sourceText,
      briefNote: review.briefNote,
      hasImage: images.length > 0,
    }),
    images,
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
  const images = await imagesFor(review.assetId);

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
      previousOutput: revision ? JSON.stringify(review.output) : undefined,
      revisionNote: revision?.note,
    }),
    images,
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

/** Flattens the output into the plain text a person would paste somewhere. */
export function outputToText(output: Output | null): string {
  if (!output) return "";
  return output.fields.map((field) => `${field.label}: ${field.value}`).join("\n\n");
}
