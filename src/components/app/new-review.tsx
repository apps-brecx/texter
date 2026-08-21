"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FileText, Link2, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert, Card } from "@/components/ui/surface";
import { Mark } from "@/components/brand/mark";
import { CONTENT_TYPES } from "@/lib/ai/content-types";
import {
  ACCEPT_ATTRIBUTE,
  formatBytes,
  isAcceptedType,
  isPdf,
  limitFor,
} from "@/lib/upload";
import { shrinkImage } from "@/lib/shrink-image";
import { cn } from "@/lib/utils";

type Style = { id: string; name: string; tagline: string; isDefault: boolean };
export type CampaignOption = {
  id: string;
  name: string;
  pieceCount: number;
  lastPiece: string | null;
};

const NEW_CAMPAIGN = "__new__";

const STEPS = ["Reading what you sent", "Checking it against your house rules", "Working out what to ask you"];

export function NewReview({ styles, campaigns }: { styles: Style[]; campaigns: CampaignOption[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [contentType, setContentType] = useState<string>("EMAIL");
  const [styleId, setStyleId] = useState(styles.find((s) => s.isDefault)?.id ?? styles[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [shrunkFrom, setShrunkFrom] = useState<number | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [briefNote, setBriefNote] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [newCampaignName, setNewCampaignName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);

  const spec = CONTENT_TYPES.find((type) => type.value === contentType)!;
  const selectedCampaign = campaigns.find((campaign) => campaign.id === campaignId) ?? null;

  async function attach(next: File | null) {
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setShrunkFrom(null);

    if (!next) {
      setFile(null);
      return;
    }

    if (!isAcceptedType(next.type)) {
      setFile(null);
      setError("Texter reads PDFs and images — PNG, JPEG, WebP, GIF or AVIF.");
      return;
    }

    const limit = limitFor(next.type);
    if (next.size > limit) {
      setFile(null);
      setError(
        isPdf(next.type)
          ? `That PDF is ${formatBytes(next.size)}. The limit is ${formatBytes(limit)} — split it or export it smaller.`
          : `That image is ${formatBytes(next.size)}. The limit is ${formatBytes(limit)}.`,
      );
      return;
    }

    // Shrinking a big photo here saves a slow upload; the server normalises
    // again either way, so this is purely about speed.
    setPreparing(true);
    const original = next.size;
    const ready = isPdf(next.type) ? next : await shrinkImage(next);
    setPreparing(false);

    setFile(ready);
    if (ready.size < original) setShrunkFrom(original);
    if (!isPdf(ready.type)) setPreview(URL.createObjectURL(ready));
  }

  async function submit() {
    if (!file && !sourceText.trim()) {
      setError("Attach a file or paste the draft — Texter needs something to read.");
      return;
    }

    setBusy(true);
    setError(null);
    setStep(0);
    const ticker = setInterval(() => setStep((value) => Math.min(value + 1, STEPS.length - 1)), 4500);

    const body = new FormData();
    body.set("contentType", contentType);
    if (styleId) body.set("styleId", styleId);
    if (sourceText.trim()) body.set("sourceText", sourceText.trim());
    if (briefNote.trim()) body.set("briefNote", briefNote.trim());
    if (campaignId === NEW_CAMPAIGN) {
      if (newCampaignName.trim()) body.set("newCampaignName", newCampaignName.trim());
    } else if (campaignId) {
      body.set("campaignId", campaignId);
    }
    if (file) body.set("file", file);

    try {
      const response = await fetch("/api/reviews", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "That didn't work. Try again.");
      router.push(`/reviews/${data.id}`);
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "That didn't work. Try again.");
      setBusy(false);
    } finally {
      clearInterval(ticker);
    }
  }

  if (busy) {
    return (
      <Card className="px-6 py-14 text-center">
        <Mark className="mx-auto size-12" animate="breathe" />
        <p className="mt-6 text-[16px] font-semibold text-ink">{STEPS[step]}…</p>
        <p className="mt-2 text-[13.5px] text-muted">
          About twenty seconds. You can leave this tab open.
        </p>
        <div className="mx-auto mt-7 flex max-w-[260px] gap-1.5">
          {STEPS.map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-500",
                index <= step ? "bg-accent" : "bg-surface-3",
              )}
            />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="u-eyebrow mb-3">1 — What are you making?</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {CONTENT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setContentType(type.value)}
              aria-pressed={contentType === type.value}
              className={cn(
                "u-tap rounded-md border p-3 text-left transition-all duration-150",
                contentType === type.value
                  ? "border-accent-line bg-accent-soft shadow-card"
                  : "border-line bg-surface hover:border-line-strong hover:bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "block text-[13.5px] font-medium",
                  contentType === type.value ? "text-accent" : "text-ink",
                )}
              >
                {type.label}
              </span>
              <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">{type.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="u-eyebrow mb-3">2 — Show it the work</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {spec.accepts !== "text" ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const dropped = event.dataTransfer.files?.[0];
                if (dropped) void attach(dropped);
              }}
              className={cn(
                "relative flex min-h-[220px] flex-col items-center justify-center rounded-card border border-dashed p-6 text-center transition-colors",
                dragging ? "border-accent bg-accent-soft" : "border-line-strong bg-surface-2",
              )}
            >
              {preparing ? (
                <>
                  <Loader2 className="size-5 animate-spin text-accent" aria-hidden />
                  <p className="mt-3 text-[13.5px] font-medium text-ink">Getting it ready…</p>
                </>
              ) : file ? (
                <>
                  {preview ? (
                    <Image
                      src={preview}
                      alt="The artwork you attached"
                      width={640}
                      height={400}
                      unoptimized
                      className="max-h-[240px] w-auto rounded-sm border border-line object-contain"
                    />
                  ) : (
                    <span className="flex size-16 items-center justify-center rounded-md border border-line bg-surface text-danger">
                      <FileText className="size-7" aria-hidden />
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => void attach(null)}
                    className="u-tap absolute top-3 right-3 grid size-7 place-items-center rounded-full border border-line bg-surface text-muted shadow-card transition-colors hover:text-ink"
                    aria-label="Remove file"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>

                  <p className="mt-3 max-w-full truncate text-[12.5px] font-medium text-ink">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    {isPdf(file.type) ? "PDF · every page gets read" : "Image"} ·{" "}
                    {formatBytes(file.size)}
                    {shrunkFrom ? ` · shrunk from ${formatBytes(shrunkFrom)}` : ""}
                  </p>
                </>
              ) : (
                <>
                  <Upload className="size-6 text-faint" aria-hidden />
                  <p className="mt-3 text-[14px] font-semibold text-ink">Drop the artwork here</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                    PDF or image. Texter reads every word in it — all pages of a PDF.
                    <br />
                    Big photos are shrunk automatically.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => inputRef.current?.click()}
                  >
                    Choose a file
                  </Button>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                className="hidden"
                onChange={(event) => void attach(event.target.files?.[0] ?? null)}
              />
            </div>
          ) : null}

          <Field
            label="The draft text"
            hint={
              spec.accepts === "text"
                ? "Paste whatever exists today. Leave it empty if you're starting from nothing."
                : "Optional if the words are already in the file you attached."
            }
            className={spec.accepts === "text" ? "lg:col-span-2" : undefined}
          >
            <Textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Paste the email, caption or headline as it stands…"
              className="min-h-[180px] font-mono text-[13px]"
            />
          </Field>
        </div>
      </section>

      <section>
        <p className="u-eyebrow mb-3">3 — Is this part of something bigger?</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field
            label="Campaign"
            hint={
              selectedCampaign
                ? `Texter will read the ${selectedCampaign.pieceCount} piece${selectedCampaign.pieceCount === 1 ? "" : "s"} already in this campaign — the offer, the dates, the answers you gave — and stop asking about them.`
                : "Link this to the email, banner or post it belongs with and Texter carries everything across."
            }
          >
            <Select value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>
              <option value="">On its own — nothing to link</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} ({campaign.pieceCount} piece{campaign.pieceCount === 1 ? "" : "s"})
                </option>
              ))}
              <option value={NEW_CAMPAIGN}>Start a new campaign…</option>
            </Select>
          </Field>

          {campaignId === NEW_CAMPAIGN ? (
            <Field label="Name the campaign" hint="Whatever the team calls it. Spring Sale, Black Friday, Q3 launch.">
              <Input
                value={newCampaignName}
                onChange={(event) => setNewCampaignName(event.target.value)}
                placeholder="Spring Sale"
                autoFocus
              />
            </Field>
          ) : selectedCampaign ? (
            <div className="rounded-md border border-accent-line bg-accent-soft/50 p-4">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <Link2 className="size-3.5 text-accent" aria-hidden />
                Carrying over from {selectedCampaign.name}
              </p>
              {selectedCampaign.lastPiece ? (
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                  Most recent: {selectedCampaign.lastPiece}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="u-eyebrow mb-3">4 — Pick the voice</p>
          <Select value={styleId} onChange={(event) => setStyleId(event.target.value)}>
            {styles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.name} — {style.tagline}
              </option>
            ))}
          </Select>
        </div>

        <Field label="Anything Texter should know?" hint="Deadline, offer, who it's going to, what not to say.">
          <Textarea
            value={briefNote}
            onChange={(event) => setBriefNote(event.target.value)}
            placeholder="Goes out Thursday to customers who bought last season. Don't mention the price."
            className="min-h-[76px]"
          />
        </Field>
      </section>

      {error ? <Alert>{error}</Alert> : null}

      <div className="flex items-center justify-between border-t border-line pt-6">
        <p className="text-[13px] text-muted">
          Texter will ask you a few questions before it writes anything.
        </p>
        <Button size="lg" onClick={submit}>
          Start the review
        </Button>
      </div>
    </div>
  );
}
