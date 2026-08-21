import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiContext, HttpError, route } from "@/lib/guard";
import { runAnalysis } from "@/lib/ai/review";
import { AiConfigError } from "@/lib/ai/provider";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const Body = z.object({
  contentType: z.enum([
    "EMAIL", "BANNER", "INSTAGRAM", "FACEBOOK", "SMS",
    "WHATSAPP", "PUSH", "PRODUCT", "LANDING", "OTHER",
  ]),
  styleId: z.string().optional(),
  sourceText: z.string().max(20_000).optional(),
  briefNote: z.string().max(4_000).optional(),
});

export const POST = route(async (request: Request) => {
  const { workspace, user } = await apiContext();
  const form = await request.formData();

  const parsed = Body.safeParse({
    contentType: form.get("contentType"),
    styleId: form.get("styleId") || undefined,
    sourceText: form.get("sourceText") || undefined,
    briefNote: form.get("briefNote") || undefined,
  });
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (!hasFile && !parsed.data.sourceText?.trim()) {
    throw new HttpError(400, "Upload an image or paste the draft text — Texter needs something to read.");
  }

  let assetId: string | null = null;
  if (hasFile) {
    if (file.size > MAX_BYTES) throw new HttpError(413, "That image is over 8 MB. Export it smaller and try again.");
    if (!ALLOWED.includes(file.type)) throw new HttpError(415, "Upload a PNG, JPEG, WebP or GIF.");

    const asset = await db.asset.create({
      data: {
        workspaceId: workspace.id,
        filename: file.name.slice(0, 200),
        mimeType: file.type,
        bytes: file.size,
        data: Buffer.from(await file.arrayBuffer()),
      },
      select: { id: true },
    });
    assetId = asset.id;
  }

  // A style must belong to this workspace — never trust the id from the client.
  const style = parsed.data.styleId
    ? await db.styleProfile.findFirst({
        where: { id: parsed.data.styleId, workspaceId: workspace.id },
        select: { id: true },
      })
    : await db.styleProfile.findFirst({
        where: { workspaceId: workspace.id, isDefault: true },
        select: { id: true },
      });

  const review = await db.review.create({
    data: {
      workspaceId: workspace.id,
      authorId: user.id,
      assetId,
      styleId: style?.id ?? null,
      title: hasFile ? file.name.replace(/\.[^.]+$/, "").slice(0, 120) : "Untitled review",
      contentType: parsed.data.contentType,
      sourceText: parsed.data.sourceText?.trim() || null,
      briefNote: parsed.data.briefNote?.trim() || null,
    },
  });

  try {
    await runAnalysis(review);
  } catch (error) {
    // Keep the upload so the person can retry without re-attaching the file.
    if (error instanceof AiConfigError) throw new HttpError(503, error.message);
    throw error;
  }

  await db.activityLog.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      action: "review.created",
      detail: parsed.data.contentType,
    },
  });

  return NextResponse.json({ id: review.id });
});
