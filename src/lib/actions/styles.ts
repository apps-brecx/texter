"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";

const StyleSchema = z.object({
  name: z.string().trim().min(2, "Give the voice a name."),
  tagline: z.string().trim().min(4, "One line on when to reach for it."),
  guidance: z.string().trim().min(20, "Describe the voice properly — this is what the model reads."),
  formality: z.coerce.number().int().min(0).max(100),
  energy: z.coerce.number().int().min(0).max(100),
  emojiPolicy: z.enum(["none", "sparing", "generous"]),
});

export async function saveStyle(_prev: FormState, formData: FormData): Promise<FormState> {
  const { workspace } = await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  const parsed = StyleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const clash = await db.styleProfile.findFirst({
    where: { workspaceId: workspace.id, name: parsed.data.name, ...(id ? { NOT: { id } } : {}) },
  });
  if (clash) return { error: `You already have a voice called ${parsed.data.name}.` };

  if (id) {
    const { count } = await db.styleProfile.updateMany({
      where: { id, workspaceId: workspace.id },
      data: parsed.data,
    });
    if (count === 0) return { error: "That voice is gone." };
  } else {
    await db.styleProfile.create({ data: { ...parsed.data, workspaceId: workspace.id } });
  }

  revalidatePath("/settings");
  return { notice: id ? "Voice updated." : `${parsed.data.name} added.` };
}

export async function makeStyleDefault(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const id = String(formData.get("id") ?? "");

  const style = await db.styleProfile.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!style) return;

  await db.$transaction([
    db.styleProfile.updateMany({ where: { workspaceId: workspace.id }, data: { isDefault: false } }),
    db.styleProfile.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/settings");
}

export async function deleteStyle(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const id = String(formData.get("id") ?? "");

  const style = await db.styleProfile.findFirst({ where: { id, workspaceId: workspace.id } });
  // Deleting the default would leave new reviews with no voice at all.
  if (!style || style.isDefault) return;

  await db.styleProfile.delete({ where: { id } });
  revalidatePath("/settings");
}
