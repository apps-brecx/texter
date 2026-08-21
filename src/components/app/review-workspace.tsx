"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertTriangle,
  BadgeCheck,
  Brain,
  CircleAlert,
  Info,
  ExternalLink,
  PenLine,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Alert, Badge, Card, CardHeader } from "@/components/ui/surface";
import { CopyButton } from "@/components/app/copy-button";
import { Mark } from "@/components/brand/mark";
import { isPdf } from "@/lib/upload";
import { cn } from "@/lib/utils";
import type { Issue, Output, Question } from "@/lib/ai/types";

export type ReviewData = {
  id: string;
  title: string;
  contentType: string;
  stage: "DRAFT" | "QUESTIONS" | "READY" | "APPROVED";
  sourceText: string | null;
  briefNote: string | null;
  assetId: string | null;
  assetMime: string | null;
  assetName: string | null;
  styleName: string | null;
  modelUsed: string | null;
  imageRead: { description: string; textFound: string[]; visualTone: string } | null;
  issues: Issue[];
  questions: Question[];
  answers: Record<string, string>;
  output: Output | null;
  approvedText: string | null;
};

export function ReviewWorkspace({ review }: { review: ReviewData }) {
  const router = useRouter();
  const [stage, setStage] = useState(review.stage);
  const [output, setOutput] = useState(review.output);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "writing" | "revising" | "approving">(null);
  const [learned, setLearned] = useState<number | null>(null);

  async function call(path: string, body: unknown) {
    setError(null);
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "That didn't work. Try again.");
    return data;
  }

  async function write(answers: Record<string, string>) {
    setBusy("writing");
    try {
      const data = await call(`/api/reviews/${review.id}/generate`, { answers });
      setOutput(data.output);
      setStage("READY");
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "That didn't work.");
    } finally {
      setBusy(null);
    }
  }

  async function revise(note: string) {
    setBusy("revising");
    try {
      const data = await call(`/api/reviews/${review.id}/revise`, { note });
      setOutput(data.output);
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "That didn't work.");
    } finally {
      setBusy(null);
    }
  }

  async function approve(finalText: string) {
    setBusy("approving");
    try {
      const data = await call(`/api/reviews/${review.id}/approve`, { finalText });
      setLearned(data.learned ?? 0);
      setStage("APPROVED");
      router.refresh();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "That didn't work.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-5 py-6 sm:gap-5 sm:px-8 sm:py-8 lg:px-10 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="space-y-4 xl:sticky xl:top-8 xl:self-start">
        <SourcePanel review={review} />
        <IssuePanel issues={review.issues} />
      </div>

      <div className="space-y-6">
        {error ? <Alert>{error}</Alert> : null}

        {stage === "QUESTIONS" ? (
          <QuestionPanel
            questions={review.questions}
            initial={review.answers}
            busy={busy === "writing"}
            onSubmit={write}
          />
        ) : null}

        {output ? (
          <OutputPanel
            output={output}
            stage={stage}
            busy={busy}
            learned={learned}
            approvedText={review.approvedText}
            onRevise={revise}
            onApprove={approve}
          />
        ) : null}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ source

function SourcePanel({ review }: { review: ReviewData }) {
  return (
    <Card>
      <CardHeader title="What came in" description={review.briefNote ?? undefined} />
      <div className="space-y-4 p-5">
        {review.assetId ? <AssetPreview review={review} /> : null}

        {review.sourceText ? (
          <div>
            <p className="u-eyebrow mb-2">The draft</p>
            <p className="max-h-56 overflow-y-auto rounded-lg border border-line bg-surface-2 p-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-ink-soft scroll-slim">
              {review.sourceText}
            </p>
          </div>
        ) : null}

        {review.imageRead ? (
          <div>
            <p className="u-eyebrow mb-2">What Texter sees</p>
            <p className="text-[13px] leading-relaxed text-muted">{review.imageRead.description}</p>
            {review.imageRead.textFound.length > 0 ? (
              <ul className="mt-2.5 space-y-1">
                {review.imageRead.textFound.map((text, index) => (
                  <li key={index} className="font-mono text-[12px] text-ink-soft">
                    &ldquo;{text}&rdquo;
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function AssetPreview({ review }: { review: ReviewData }) {
  const href = `/api/assets/${review.assetId}`;

  // A PDF can't go in an <img>. Browsers that refuse to render one inline fall
  // back to the link underneath, which always works.
  if (isPdf(review.assetMime)) {
    return (
      <div>
        <object data={href} type="application/pdf" className="h-[420px] w-full rounded-sm border border-line bg-surface-2">
          <div className="grid h-full place-items-center px-6 text-center">
            <p className="text-[13px] text-muted">
              Your browser won&apos;t preview PDFs here.
            </p>
          </div>
        </object>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="u-tap mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-accent hover:underline"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Open {review.assetName ?? "the PDF"} in a new tab
        </a>
      </div>
    );
  }

  return (
    <Image
      src={href}
      alt={`Artwork for ${review.title}`}
      width={760}
      height={520}
      unoptimized
      className="w-full rounded-sm border border-line bg-surface-2 object-contain"
    />
  );
}

// ------------------------------------------------------------------ issues

const SEVERITY = {
  high: { tone: "danger" as const, icon: CircleAlert, label: "Fix" },
  medium: { tone: "warn" as const, icon: AlertTriangle, label: "Tighten" },
  low: { tone: "neutral" as const, icon: Info, label: "Nit" },
};

function IssuePanel({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) {
    return (
      <Card className="flex items-center gap-3 p-5">
        <BadgeCheck className="size-5 shrink-0 text-good" aria-hidden />
        <p className="text-[13px] leading-relaxed text-muted">
          Nothing wrong with the copy that came in. Everything below is new writing.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={`${issues.length} thing${issues.length === 1 ? "" : "s"} to fix`}
        description="Found in the copy you sent, with the exact replacement."
      />
      <ul className="divide-y divide-line">
        {issues.map((issue, index) => {
          const meta = SEVERITY[issue.severity];
          const Icon = meta.icon;
          return (
            <li key={index} className="p-5">
              <div className="mb-2.5 flex items-center gap-2">
                <Icon
                  className={cn(
                    "size-3.5",
                    issue.severity === "high" ? "text-danger" : issue.severity === "medium" ? "text-warn" : "text-faint",
                  )}
                  aria-hidden
                />
                <Badge tone={meta.tone}>{meta.label}</Badge>
                <span className="text-[11px] text-faint capitalize">{issue.category.replace("-", " ")}</span>
              </div>

              <p className="font-mono text-[12.5px] leading-relaxed text-muted line-through decoration-danger/50">
                {issue.quote}
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed font-medium text-ink">{issue.fix}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{issue.problem}</p>
              <CopyButton value={issue.fix} label="Copy the fix" className="-ml-2 mt-1.5" />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// --------------------------------------------------------------- questions

function QuestionPanel({
  questions,
  initial,
  busy,
  onSubmit,
}: {
  questions: Question[];
  initial: Record<string, string>;
  busy: boolean;
  onSubmit: (answers: Record<string, string>) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const question of questions) seed[question.id] = initial[question.id] ?? "";
    return seed;
  });

  const answered = questions.filter((question) => answers[question.id]?.trim()).length;

  return (
    <Card>
      <CardHeader
        title="Before it writes a word"
        description="Texter asks rather than guesses. Click an answer or type your own — anything you skip becomes an assumption it will flag."
        action={
          <span className="text-[12px] text-muted">
            {answered} of {questions.length}
          </span>
        }
      />

      <div className="divide-y divide-line">
        {questions.map((question, index) => (
          <div key={question.id} className="p-5">
            <p className="text-[14.5px] leading-snug font-medium text-ink">
              <span className="mr-2 text-faint">{index + 1}.</span>
              {question.question}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{question.why}</p>

            {question.options.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {question.options.map((option) => {
                  const picked = answers[question.id] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setAnswers((current) => ({ ...current, [question.id]: picked ? "" : option }))
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-[12.5px] transition-colors",
                        picked
                          ? "border-accent bg-accent-soft font-medium text-accent"
                          : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <Input
              value={answers[question.id] ?? ""}
              onChange={(event) =>
                setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
              }
              placeholder={question.options.length > 0 ? "…or type something else" : "Your answer"}
              className="mt-3"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-4">
        <p className="text-[12.5px] text-muted">
          {answered === questions.length
            ? "All answered — this is going to be close to right first time."
            : "You can leave some blank, but the copy gets vaguer."}
        </p>
        <Button onClick={() => onSubmit(answers)} loading={busy}>
          <Sparkles className="size-4" aria-hidden />
          {busy ? "Writing…" : "Write the copy"}
        </Button>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------ output

function OutputPanel({
  output,
  stage,
  busy,
  learned,
  approvedText,
  onRevise,
  onApprove,
}: {
  output: Output;
  stage: ReviewData["stage"];
  busy: null | "writing" | "revising" | "approving";
  learned: number | null;
  approvedText: string | null;
  onRevise: (note: string) => void;
  onApprove: (finalText: string) => void;
}) {
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [finalText, setFinalText] = useState(() => flatten(output));

  const approved = stage === "APPROVED";
  const everything = flatten(output);

  return (
    <>
      <Card>
        <CardHeader
          title="The copy"
          description={output.summary}
          action={<CopyButton value={everything} label="Copy all" />}
        />

        {busy === "revising" ? (
          <div className="flex items-center gap-2.5 border-b border-line bg-surface-2 px-5 py-3 text-[13px] font-medium text-muted">
            <Mark className="size-4" animate="breathe" />
            Rewriting…
          </div>
        ) : null}

        <div className="divide-y divide-line">
          {output.fields.map((field) => (
            <FieldRow key={field.key} field={field} />
          ))}
        </div>
      </Card>

      {output.artworkFixes.length > 0 ? (
        <Card>
          <CardHeader
            title="Change these on the artwork"
            description="Text that lives in the image itself — send this list to whoever holds the design file."
          />
          <ul className="divide-y divide-line">
            {output.artworkFixes.map((fix, index) => (
              <li key={index} className="p-5">
                <p className="font-mono text-[12.5px] text-muted line-through decoration-danger/50">
                  {fix.current}
                </p>
                <p className="mt-1.5 text-[14px] font-medium text-ink">{fix.suggested}</p>
                <p className="mt-1.5 text-[12.5px] text-muted">{fix.why}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {output.watchOuts.length > 0 ? (
        <Card className="border-warn/25 bg-warn-soft/40">
          <div className="flex gap-3 p-5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
            <div>
              <p className="text-[13.5px] font-medium text-ink">Check these before it goes out</p>
              <ul className="mt-2 space-y-1.5">
                {output.watchOuts.map((item, index) => (
                  <li key={index} className="text-[13px] leading-relaxed text-ink-soft">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ) : null}

      {approved ? (
        <Card className="border-good/30 bg-good-soft/40">
          <div className="flex gap-3 p-5">
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-good" aria-hidden />
            <div className="min-w-0">
              <p className="text-[13.5px] font-medium text-ink">Shipped</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                {learned === null
                  ? "Saved to your history."
                  : learned > 0
                    ? `Texter spotted ${learned} new house rule${learned === 1 ? "" : "s"} in your edit. They're waiting in the brain for you to confirm.`
                    : "Your edit matched what Texter wrote, so the rules behind it just got a little more weight."}
              </p>
              {approvedText ? (
                <p className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-line bg-surface p-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-ink-soft scroll-slim">
                  {approvedText}
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="Not quite right?"
            description="Say what to change in plain English. Texter keeps everything else and rewrites around it."
          />
          <div className="space-y-3 p-5">
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Shorter subject line. Lead with the deadline, not the discount."
              className="min-h-[72px]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  onRevise(note);
                  setNote("");
                }}
                disabled={note.trim().length < 2}
                loading={busy === "revising"}
              >
                <RefreshCw className="size-4" aria-hidden />
                Rewrite
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFinalText(flatten(output));
                    setEditing((value) => !value);
                  }}
                >
                  <PenLine className="size-4" aria-hidden />
                  {editing ? "Cancel edit" : "Edit myself"}
                </Button>
                <Button onClick={() => onApprove(editing ? finalText : everything)} loading={busy === "approving"}>
                  <Brain className="size-4" aria-hidden />
                  Approve &amp; teach
                </Button>
              </div>
            </div>

            {editing ? (
              <Field
                label="Your final version"
                hint="Whatever you change here is what Texter learns from. This is how the brain gets better."
              >
                <Textarea
                  value={finalText}
                  onChange={(event) => setFinalText(event.target.value)}
                  className="min-h-[220px] font-mono text-[12.5px]"
                />
              </Field>
            ) : null}
          </div>
        </Card>
      )}
    </>
  );
}

function FieldRow({ field }: { field: Output["fields"][number] }) {
  const [value, setValue] = useState(field.value);
  const over = field.limit !== null && value.length > field.limit;

  return (
    <div className="p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="u-eyebrow">{field.label}</p>
        <div className="flex items-center gap-1">
          {field.limit !== null ? (
            <span className={cn("font-mono text-[11px]", over ? "text-danger" : "text-faint")}>
              {value.length}/{field.limit}
            </span>
          ) : null}
          <CopyButton value={value} />
        </div>
      </div>

      <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-ink">{value}</p>
      {field.note ? <p className="mt-2 text-[12.5px] text-muted">{field.note}</p> : null}

      {field.alternates.length > 0 ? (
        <div className="mt-3 space-y-1">
          <p className="text-[11.5px] text-faint">Swap in an alternate:</p>
          {field.alternates.map((alternate) => (
            <button
              key={alternate}
              type="button"
              onClick={() => setValue(alternate)}
              className="block w-full rounded-md border border-transparent px-2.5 py-1.5 text-left text-[13px] text-muted transition-colors hover:border-line hover:bg-surface-2 hover:text-ink"
            >
              {alternate}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function flatten(output: Output) {
  return output.fields.map((field) => `${field.label}:\n${field.value}`).join("\n\n");
}
