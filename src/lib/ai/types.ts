import { z } from "zod";

export const Severity = z.enum(["high", "medium", "low"]);

/** One thing wrong with the copy that came in. */
export const IssueSchema = z.object({
  severity: Severity,
  quote: z.string().describe("the exact wording that is wrong, copied verbatim"),
  problem: z.string(),
  fix: z.string().describe("the corrected wording, ready to paste"),
  category: z.enum(["grammar", "tone", "clarity", "us-english", "brand", "legal", "formatting"]),
});
export type Issue = z.infer<typeof IssueSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  why: z.string().describe("one line on why the answer changes the copy"),
  options: z.array(z.string()).default([]),
  allowFree: z.boolean().default(true),
});
export type Question = z.infer<typeof QuestionSchema>;

export const AnalysisSchema = z.object({
  title: z.string().describe("a short name for this piece of work"),
  readOfImage: z
    .object({
      description: z.string(),
      textFound: z.array(z.string()).default([]),
      visualTone: z.string().default(""),
    })
    .nullable()
    .default(null),
  understanding: z.string().describe("what this piece is trying to achieve, in one or two lines"),
  issues: z.array(IssueSchema).default([]),
  questions: z.array(QuestionSchema).min(1),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

/** A named piece of the deliverable — "Subject line", "Caption", "CTA". */
export const FieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  note: z.string().default(""),
  limit: z.number().int().positive().nullable().default(null),
  alternates: z.array(z.string()).default([]),
});
export type Field = z.infer<typeof FieldSchema>;

export const OutputSchema = z.object({
  summary: z.string(),
  fields: z.array(FieldSchema).min(1),
  /** Edits to text that lives on the uploaded artwork itself. */
  artworkFixes: z
    .array(z.object({ current: z.string(), suggested: z.string(), why: z.string() }))
    .default([]),
  watchOuts: z.array(z.string()).default([]),
});
export type Output = z.infer<typeof OutputSchema>;

export const LessonSchema = z.object({
  lessons: z
    .array(
      z.object({
        kind: z.enum(["RULE", "TERM", "EXAMPLE", "FACT"]),
        title: z.string(),
        body: z.string(),
        wrongForm: z.string().nullable().default(null),
        rightForm: z.string().nullable().default(null),
        appliesTo: z.array(z.string()).default([]),
      }),
    )
    .default([]),
});
export type Lessons = z.infer<typeof LessonSchema>;
