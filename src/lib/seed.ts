import "server-only";
import { db } from "@/lib/db";

/** The four voices a marketing team actually reaches for. */
const STYLES = [
  {
    name: "Clean",
    tagline: "Say it straight, get out of the way",
    guidance:
      "Plain, confident, unfussy. Lead with what the reader gets. No metaphors, no wordplay, no hype words. Short sentences. If a sentence can lose three words, lose them.",
    formality: 55,
    energy: 35,
    emojiPolicy: "none",
    isDefault: true,
  },
  {
    name: "Warm",
    tagline: "Like a good shop owner who knows you",
    guidance:
      "Friendly and human without being cute. Contractions everywhere. Speak to one person, not a list. Allowed to be a little conversational — a fragment here and there is fine.",
    formality: 40,
    energy: 50,
    emojiPolicy: "sparing",
  },
  {
    name: "Sharp",
    tagline: "Punchy, modern, built for the scroll",
    guidance:
      "Short. Rhythmic. Front-loaded. Fragments are fine. One idea per line. Cut every adverb. The first five words have to earn the next five. Never sound like a press release.",
    formality: 25,
    energy: 75,
    emojiPolicy: "sparing",
  },
  {
    name: "Boardroom",
    tagline: "For partners, press and anything with a legal review",
    guidance:
      "Measured and precise. Full sentences, no fragments, no contractions in headlines. Claims must be specific and defensible. Zero hype adjectives. Reads well printed on letterhead.",
    formality: 90,
    energy: 25,
    emojiPolicy: "none",
  },
];

/** Starter house rules: the mistakes that actually show up, ready to edit. */
const BRAIN = [
  {
    kind: "RULE" as const,
    title: "Write American, not International",
    body: "US spelling (color, organize, center), US dates (September 4, 2026), US money ($1,200.00), US time (5 p.m. ET). Never DD/MM, never lakh or crore, never 'Rs.'.",
  },
  {
    kind: "RULE" as const,
    title: "Contractions are the default",
    body: "You'll, we're, don't, it's. 'You will not be charged' reads like a contract. 'You won't be charged' reads like a person.",
  },
  {
    kind: "RULE" as const,
    title: "One idea per sentence",
    body: "If a sentence has two commas and an 'and which', split it. Long sentences are where second-language English shows most.",
  },
  {
    kind: "RULE" as const,
    title: "Never open with a greeting block",
    body: "Skip 'Dear Valued Customer,' and 'Greetings from the team at...'. Open on the thing that matters to the reader.",
  },
  {
    kind: "RULE" as const,
    title: "One exclamation mark per piece, maximum",
    body: "Excitement comes from the offer, not the punctuation. Zero is usually right.",
  },
  { kind: "TERM" as const, title: "kindly", body: "Reads as formal South-Asian business English to a US reader.", wrongForm: "kindly", rightForm: "please" },
  { kind: "TERM" as const, title: "do the needful", body: "Not used in US English at all.", wrongForm: "do the needful", rightForm: "take care of it" },
  { kind: "TERM" as const, title: "revert back", body: "Doubly wrong — 'revert' does not mean 'reply'.", wrongForm: "revert back", rightForm: "get back to you" },
  { kind: "TERM" as const, title: "as per", body: "Legalese. Only survives in contracts.", wrongForm: "as per", rightForm: "according to" },
  { kind: "TERM" as const, title: "prepone", body: "Not a word outside South Asia.", wrongForm: "prepone", rightForm: "move up" },
  { kind: "TERM" as const, title: "esteemed customer", body: "Nobody in the US has ever been called this.", wrongForm: "esteemed customer", rightForm: "the reader's name, or nothing" },
  { kind: "TERM" as const, title: "please find attached", body: "Dead office phrasing.", wrongForm: "please find attached", rightForm: "here's" },
  { kind: "TERM" as const, title: "we are having", body: "Present continuous where US English uses simple present.", wrongForm: "we are having a sale", rightForm: "our sale starts" },
  {
    kind: "RULE" as const,
    title: "Say the number",
    body: "'Save 30%' beats 'save big'. 'Ships Tuesday' beats 'fast shipping'. Specifics are the cheapest credibility there is.",
  },
];

export async function seedWorkspace(workspaceId: string, authorId: string) {
  await db.styleProfile.createMany({
    data: STYLES.map((style) => ({ ...style, workspaceId, isBuiltIn: true })),
    skipDuplicates: true,
  });

  await db.brainEntry.createMany({
    data: BRAIN.map((entry) => ({
      ...entry,
      workspaceId,
      authorId,
      origin: "TAUGHT" as const,
      status: "ACTIVE" as const,
      weight: 5,
    })),
    skipDuplicates: true,
  });
}
