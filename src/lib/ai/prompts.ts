import type { BrainEntry, StyleProfile, Workspace } from "@prisma/client";
import { specFor } from "@/lib/ai/content-types";
import type { ContentType } from "@prisma/client";

/**
 * The one paragraph that makes this app different from pasting into a chatbot:
 * it names the actual failure mode — copy written by fluent-but-non-native
 * speakers that is grammatically defensible and still reads wrong to a US buyer.
 */
const HOUSE_BRIEF = `You are the copy desk for a US-facing marketing team. Much of the
draft copy you receive is written by colleagues who speak English as a second language.
Their English is usually correct on paper and still lands wrong: the register is off, the
idiom is South-Asian business English, the politeness is too formal, the enthusiasm is
either flat or overcooked, and the rhythm is not how an American reads.

Your job is not to translate. It is to make the copy sound like it was written by a
native US marketer who knows the product. That means:
- American spelling, punctuation, date and number formats (September 4, 2026; $1,200; 5 p.m. ET).
- Contractions where a person would use them. "You'll", not "You will".
- No borrowed formality: never "kindly", "do the needful", "revert back", "please find
  attached", "same shall be", "as per", "prepone", "intimate you", "esteemed customer".
- No stacked modifiers or noun chains. Short sentences. Active voice. Verbs over nouns.
- Specific over vague. "Ships in 2 days" beats "fast delivery".
- Enthusiasm through concrete claims, not exclamation marks.

You are strict but useful. When you flag something, you always give the exact replacement.`;

export function systemPrompt({
  workspace,
  style,
  brain,
  contentType,
}: {
  workspace: Workspace;
  style: StyleProfile | null;
  brain: BrainEntry[];
  contentType: ContentType;
}) {
  const spec = specFor(contentType);
  const parts = [HOUSE_BRIEF, "", `## The workspace`, `Name: ${workspace.name}`];

  if (workspace.industry) parts.push(`Industry: ${workspace.industry}`);
  if (workspace.audience) parts.push(`Audience: ${workspace.audience}`);
  if (workspace.region) parts.push(`Market: ${workspace.region}`);
  if (workspace.brandNotes) parts.push(`Brand notes: ${workspace.brandNotes}`);

  if (style) {
    parts.push(
      "",
      "## The voice to write in",
      `${style.name} — ${style.tagline}`,
      style.guidance,
      `Formality ${style.formality}/100 (0 = street, 100 = boardroom).`,
      `Energy ${style.energy}/100 (0 = calm and factual, 100 = high-hype).`,
      `Emoji: ${style.emojiPolicy}.`,
    );
  }

  if (brain.length > 0) {
    parts.push("", "## House rules — these override your defaults", renderBrain(brain));
  }

  parts.push("", `## The format you are working on: ${spec.label}`, spec.deliverable);

  return parts.join("\n");
}

export function renderBrain(entries: BrainEntry[]) {
  const lines: string[] = [];
  const terms = entries.filter((e) => e.kind === "TERM");
  const rest = entries.filter((e) => e.kind !== "TERM");

  for (const entry of rest) {
    const tag = entry.kind === "FACT" ? "FACT" : entry.kind === "EXAMPLE" ? "EXAMPLE" : "RULE";
    lines.push(`- [${tag}] ${entry.title}: ${entry.body}`);
  }
  if (terms.length > 0) {
    lines.push("- [WORDING] never write these, always write the replacement:");
    for (const term of terms) {
      lines.push(`    "${term.wrongForm}" -> "${term.rightForm}"${term.body ? ` (${term.body})` : ""}`);
    }
  }
  return lines.join("\n");
}

// ------------------------------------------------------------------ phase 1

export function analysisPrompt({
  contentType,
  sourceText,
  briefNote,
  attached,
  campaign,
}: {
  contentType: ContentType;
  sourceText: string | null;
  briefNote: string | null;
  attached: "image" | "pdf" | "none";
  campaign: string | null;
}) {
  const spec = specFor(contentType);
  const ATTACHMENT = {
    image:
      "An image is attached. Read every word visible in it, including small print, and describe what it shows.",
    pdf:
      "A PDF is attached. Read every page. Transcribe every word it contains — headings, body, captions, footnotes, small print — and describe what each page shows. If pages differ, say which page each piece of text is on.",
    none: "Nothing was attached.",
  } as const;

  return [
    `Read what has been handed to you for a ${spec.label.toLowerCase()} and prepare to rewrite it.`,
    ATTACHMENT[attached],
    sourceText ? `\nDraft text supplied:\n"""\n${sourceText}\n"""` : "\nNo draft text was supplied.",
    briefNote ? `\nNote from the person asking:\n"""\n${briefNote}\n"""` : "",
    campaign ? `\n${campaign}` : "",
    "",
    "Do two things.",
    "",
    "1. Audit the copy that exists. Every issue must quote the exact wording and give the",
    "   exact replacement. Do not invent issues to look thorough — if a line is fine, leave it.",
    "   If no copy exists yet, return an empty issues list.",
    "",
    "2. Ask what you genuinely do not know. This is the important half. You cannot write",
    "   copy that is 100% right without knowing the offer, the deadline, the audience and",
    "   what happens when someone clicks. Ask 3 to 6 questions, sharpest first. Each one",
    "   must change what you write. Offer likely answers as options where you can guess",
    "   sensibly — the person should usually be able to just click. Never ask something the",
    "   draft, the image or the workspace notes already answer.",
    campaign
      ? [
          "   This piece belongs to a campaign, and earlier pieces are quoted above. Anything",
          "   they already settled — the offer, the dates, the audience, the CTA, the product",
          "   names — is known. Do not ask about it. Ask only what is genuinely new for this",
          "   format: what this piece has to do that the others didn't. If the campaign answers",
          "   everything, ask one or two questions at most.",
        ].join("\n")
      : "",
    "",
    "Reply with JSON only, in this shape:",
    JSON.stringify(
      {
        title: "short name for this piece",
        readOfImage:
          attached === "none"
            ? null
            : {
                description: "what the file shows",
                textFound: ["every string of text in the file"],
                visualTone: "",
              },
        understanding: "what this piece is trying to achieve",
        issues: [
          {
            severity: "high|medium|low",
            quote: "exact wording from the draft",
            problem: "what is wrong with it",
            fix: "the exact replacement wording",
            category: "grammar|tone|clarity|us-english|brand|legal|formatting",
          },
        ],
        questions: [
          { id: "q1", question: "", why: "", options: ["", ""], allowFree: true },
        ],
      },
      null,
      2,
    ),
  ].join("\n");
}

// ------------------------------------------------------------------ phase 2

export function generationPrompt({
  contentType,
  sourceText,
  briefNote,
  understanding,
  answers,
  campaign,
  previousOutput,
  revisionNote,
}: {
  contentType: ContentType;
  sourceText: string | null;
  briefNote: string | null;
  understanding: string;
  answers: { question: string; answer: string }[];
  campaign: string | null;
  previousOutput?: string;
  revisionNote?: string;
}) {
  const spec = specFor(contentType);
  const lines = [
    `Write the ${spec.label.toLowerCase()} now.`,
    "",
    `What this piece is for: ${understanding}`,
    sourceText ? `\nThe draft you are replacing:\n"""\n${sourceText}\n"""` : "",
    briefNote ? `\nNote from the person asking:\n"""\n${briefNote}\n"""` : "",
    campaign ? `\n${campaign}` : "",
    "",
    "Answers you asked for:",
    ...answers.map(({ question, answer }) => `- ${question}\n  -> ${answer || "(left blank — use your judgement and say so in watchOuts)"}`),
  ];

  if (previousOutput) {
    lines.push(
      "",
      "You already produced this. Revise it, do not start over:",
      previousOutput,
      "",
      `What to change: ${revisionNote ?? "tighten it"}`,
    );
  }

  lines.push(
    "",
    "Rules for the output:",
    "- Respect every character limit. Count them.",
    ...(campaign
      ? [
          "- This is one piece of a campaign. The offer, dates, prices, product names and",
          "  claims must match the pieces quoted above exactly. A different discount or a",
          "  different date is a bug, not a variation.",
          "- Match their voice, but write fresh sentences. Someone who sees the email and",
          "  then the banner should recognise the campaign, not notice the copy-paste.",
          "- If this piece has to contradict something already shipped, don't silently do it —",
          "  write the copy the brief demands and flag the conflict in watchOuts.",
        ]
      : []),
    "- Give alternates for the fields where a person would want a choice.",
    "- If text appears in the attached artwork or PDF and should change, put it in artworkFixes.",
    "- watchOuts is for anything you had to assume, or a claim someone should verify.",
    "- Never use a word from the banned list in the house rules.",
    "",
    `Fields to return for this format:\n${spec.deliverable}`,
    "",
    "Reply with JSON only, in this shape:",
    JSON.stringify(
      {
        summary: "one line on the angle you took",
        fields: [
          { key: "subject", label: "Subject line", value: "", note: "", limit: 50, alternates: ["", ""] },
        ],
        artworkFixes: [{ current: "", suggested: "", why: "" }],
        watchOuts: [""],
      },
      null,
      2,
    ),
  );

  return lines.filter(Boolean).join("\n");
}

// ------------------------------------------------------------------ phase 3

export function lessonPrompt({
  aiVersion,
  humanVersion,
  contentType,
  existing,
}: {
  aiVersion: string;
  humanVersion: string;
  contentType: ContentType;
  existing: string[];
}) {
  return [
    "A person edited your copy before shipping it. Work out what they were teaching you.",
    "",
    "What you wrote:",
    '"""',
    aiVersion,
    '"""',
    "",
    "What they shipped:",
    '"""',
    humanVersion,
    '"""',
    "",
    "Extract only durable lessons — preferences that will apply again next time. Ignore",
    "one-off facts about this specific campaign (a date, a discount code, a product name",
    "used once). Ignore changes that are pure taste with no pattern behind them.",
    "If they made no meaningful change, return an empty list. Returning nothing is a",
    "perfectly good answer and is better than inventing a rule.",
    "",
    existing.length > 0
      ? `Rules already in the house style — do not repeat these:\n${existing.map((t) => `- ${t}`).join("\n")}`
      : "",
    "",
    `This was a ${contentType.toLowerCase()} piece. Set appliesTo to ["${contentType}"] only if the`,
    "lesson is specific to that format; leave it empty if it applies everywhere.",
    "",
    "Reply with JSON only:",
    JSON.stringify(
      {
        lessons: [
          {
            kind: "RULE|TERM|EXAMPLE|FACT",
            title: "short imperative, e.g. 'Lead with the deadline'",
            body: "the lesson in one or two sentences",
            wrongForm: "only for TERM: the wording to avoid",
            rightForm: "only for TERM: the wording to use",
            appliesTo: [],
          },
        ],
      },
      null,
      2,
    ),
  ]
    .filter(Boolean)
    .join("\n");
}
