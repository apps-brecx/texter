"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";

const CONTENT_VALUES = [
  "EMAIL", "BANNER", "INSTAGRAM", "FACEBOOK", "SMS",
  "WHATSAPP", "PUSH", "PRODUCT", "LANDING", "OTHER",
] as const;

const EntrySchema = z
  .object({
    kind: z.enum(["RULE", "TERM", "EXAMPLE", "FACT"]),
    title: z.string().trim().min(3, "Give the rule a short name."),
    body: z.string().trim().max(2_000).optional().or(z.literal("")),
    wrongForm: z.string().trim().max(200).optional().or(z.literal("")),
    rightForm: z.string().trim().max(200).optional().or(z.literal("")),
    appliesTo: z.array(z.enum(CONTENT_VALUES)).default([]),
  })
  .refine((value) => value.kind !== "TERM" || (value.wrongForm && value.rightForm), {
    message: "A wording rule needs both the phrase to avoid and the one to use.",
    path: ["wrongForm"],
  })
  .refine((value) => value.kind === "TERM" || Boolean(value.body?.trim()), {
    message: "Explain the rule in a sentence.",
    path: ["body"],
  });

function readEntry(formData: FormData) {
  return EntrySchema.safeParse({
    kind: formData.get("kind"),
    title: formData.get("title"),
    body: formData.get("body") ?? "",
    wrongForm: formData.get("wrongForm") ?? "",
    rightForm: formData.get("rightForm") ?? "",
    appliesTo: formData.getAll("appliesTo").map(String),
  });
}

export async function createBrainEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const { workspace, user } = await requireWorkspace();
  const parsed = readEntry(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.brainEntry.create({
    data: {
      workspaceId: workspace.id,
      authorId: user.id,
      kind: parsed.data.kind,
      title: parsed.data.title,
      body: parsed.data.body || `Never write "${parsed.data.wrongForm}".`,
      wrongForm: parsed.data.wrongForm || null,
      rightForm: parsed.data.rightForm || null,
      appliesTo: parsed.data.appliesTo,
      origin: "TAUGHT",
      status: "ACTIVE",
      weight: 5,
    },
  });

  revalidatePath("/brain");
  return { notice: "Added. Texter will use it on the next review." };
}

export async function updateBrainEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const { workspace } = await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  const parsed = readEntry(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { count } = await db.brainEntry.updateMany({
    where: { id, workspaceId: workspace.id },
    data: {
      kind: parsed.data.kind,
      title: parsed.data.title,
      body: parsed.data.body || `Never write "${parsed.data.wrongForm}".`,
      wrongForm: parsed.data.wrongForm || null,
      rightForm: parsed.data.rightForm || null,
      appliesTo: parsed.data.appliesTo,
    },
  });
  if (count === 0) return { error: "That rule is gone." };

  revalidatePath("/brain");
  return { notice: "Saved." };
}

/** Confirms a rule the brain taught itself, or throws it away. */
export async function decideLesson(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  const keep = formData.get("decision") === "keep";

  if (keep) {
    await db.brainEntry.updateMany({
      where: { id, workspaceId: workspace.id, status: "PENDING" },
      data: { status: "ACTIVE", weight: 3 },
    });
  } else {
    await db.brainEntry.deleteMany({ where: { id, workspaceId: workspace.id, status: "PENDING" } });
  }

  revalidatePath("/brain");
}

export async function setBrainStatus(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "ACTIVE" && status !== "ARCHIVED") return;

  await db.brainEntry.updateMany({ where: { id, workspaceId: workspace.id }, data: { status } });
  revalidatePath("/brain");
}

export async function deleteBrainEntry(formData: FormData) {
  const { workspace } = await requireWorkspace();
  await db.brainEntry.deleteMany({
    where: { id: String(formData.get("id") ?? ""), workspaceId: workspace.id },
  });
  revalidatePath("/brain");
}
