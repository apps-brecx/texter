import type { ContentType } from "@prisma/client";

export type ContentSpec = {
  value: ContentType;
  label: string;
  blurb: string;
  /** What the model must return for this format, and the hard limits that apply. */
  deliverable: string;
  accepts: "image" | "text" | "both";
};

export const CONTENT_TYPES: ContentSpec[] = [
  {
    value: "EMAIL",
    label: "Email",
    blurb: "Campaign or announcement email",
    accepts: "both",
    deliverable: [
      "subject — 5 subject lines as alternates, primary first, each under 50 characters",
      "preheader — under 90 characters, must not repeat the subject",
      "headline — the in-email H1",
      "body — the full email body in short paragraphs, plain text with line breaks",
      "cta — button label, 2-4 words, action verb first",
    ].join("\n"),
  },
  {
    value: "BANNER",
    label: "Banner / Ad",
    blurb: "Web banner, display ad, print",
    accepts: "both",
    deliverable: [
      "headline — under 40 characters, 4 alternates",
      "subhead — under 70 characters",
      "cta — 2-3 words",
      "altText — accessible description of the banner",
    ].join("\n"),
  },
  {
    value: "INSTAGRAM",
    label: "Instagram",
    blurb: "Feed post, carousel or reel",
    accepts: "both",
    deliverable: [
      "hook — the first line, must earn the tap on 'more', under 100 characters",
      "caption — full caption under 2,200 characters, line breaks between thoughts",
      "hashtags — 8-12 tags, mixed reach, as one space-separated string",
      "firstComment — optional extra context or link line",
      "altText — accessible description",
    ].join("\n"),
  },
  {
    value: "FACEBOOK",
    label: "Facebook",
    blurb: "Page post or paid social",
    accepts: "both",
    deliverable: [
      "primaryText — under 500 characters, front-load the value",
      "headline — under 40 characters",
      "description — under 30 characters",
      "cta — 2-3 words",
    ].join("\n"),
  },
  {
    value: "SMS",
    label: "SMS",
    blurb: "Text message blast",
    accepts: "text",
    deliverable: [
      "message — under 160 characters including the opt-out, 3 alternates",
      "note — flag anything that could trip carrier filtering",
    ].join("\n"),
  },
  {
    value: "WHATSAPP",
    label: "WhatsApp",
    blurb: "Broadcast or template message",
    accepts: "both",
    deliverable: [
      "message — under 700 characters, WhatsApp-natural, no hard sell",
      "cta — the closing line that asks for the reply or click",
    ].join("\n"),
  },
  {
    value: "PUSH",
    label: "Push notification",
    blurb: "App or browser push",
    accepts: "text",
    deliverable: [
      "title — under 40 characters, 3 alternates",
      "body — under 110 characters",
    ].join("\n"),
  },
  {
    value: "PRODUCT",
    label: "Product page",
    blurb: "Listing title, bullets, description",
    accepts: "both",
    deliverable: [
      "title — under 80 characters",
      "bullets — 5 benefit-led bullets, one per line",
      "description — 120-200 words",
    ].join("\n"),
  },
  {
    value: "LANDING",
    label: "Landing page",
    blurb: "Hero and section copy",
    accepts: "both",
    deliverable: [
      "heroHeadline — under 60 characters",
      "heroSubhead — under 140 characters",
      "sections — 3 sections as 'Heading — supporting sentence', one per line",
      "cta — 2-4 words",
    ].join("\n"),
  },
  {
    value: "OTHER",
    label: "Something else",
    blurb: "Signage, packaging, internal notes",
    accepts: "both",
    deliverable: [
      "copy — the rewritten text, ready to use",
      "note — anything the writer should know",
    ].join("\n"),
  },
];

export function specFor(type: ContentType): ContentSpec {
  return CONTENT_TYPES.find((spec) => spec.value === type) ?? CONTENT_TYPES[CONTENT_TYPES.length - 1];
}
