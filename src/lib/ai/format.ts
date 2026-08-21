import type { Output } from "@/lib/ai/types";

/** Flattens a generated output into the plain text a person would paste. */
export function outputToText(output: Output | null): string {
  if (!output) return "";
  return output.fields.map((field) => `${field.label}: ${field.value}`).join("\n\n");
}
