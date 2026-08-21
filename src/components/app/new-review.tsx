"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Alert, Card } from "@/components/ui/surface";
import { Mark } from "@/components/brand/mark";
import { CONTENT_TYPES } from "@/lib/ai/content-types";
import { cn } from "@/lib/utils";

type Style = { id: string; name: string; tagline: string; isDefault: boolean };

const STEPS = ["Reading the artwork", "Checking it against your house rules", "Working out what to ask you"];

export function NewReview({ styles }: { styles: Style[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [contentType, setContentType] = useState<string>("EMAIL");
  const [styleId, setStyleId] = useState(styles.find((s) => s.isDefault)?.id ?? styles[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [briefNote, setBriefNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);

  const spec = CONTENT_TYPES.find((type) => type.value === contentType)!;

  function attach(next: File | null) {
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  async function submit() {
    if (!file && !sourceText.trim()) {
      setError("Upload the artwork or paste the draft — Texter needs something to read.");
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
                if (dropped?.type.startsWith("image/")) attach(dropped);
              }}
              className={cn(
                "relative flex min-h-[220px] flex-col items-center justify-center rounded-card border border-dashed p-6 text-center transition-colors",
                dragging ? "border-accent bg-accent-soft" : "border-line-strong bg-surface-2",
              )}
            >
              {preview ? (
                <>
                  <Image
                    src={preview}
                    alt="The artwork you attached"
                    width={640}
                    height={400}
                    unoptimized
                    className="max-h-[240px] w-auto rounded-lg border border-line object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => attach(null)}
                    className="absolute top-3 right-3 grid size-7 place-items-center rounded-full border border-line bg-surface text-muted shadow-card transition-colors hover:text-ink"
                    aria-label="Remove image"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                  <p className="mt-3 truncate text-[12px] text-muted">{file?.name}</p>
                </>
              ) : (
                <>
                  <ImageUp className="size-6 text-faint" aria-hidden />
                  <p className="mt-3 text-[14px] font-medium text-ink">Drop the artwork here</p>
                  <p className="mt-1 text-[12.5px] text-muted">
                    PNG, JPEG, WebP or GIF, up to 8 MB. Texter reads every word in it.
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
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => attach(event.target.files?.[0] ?? null)}
              />
            </div>
          ) : null}

          <Field
            label="The draft text"
            hint={
              spec.accepts === "text"
                ? "Paste whatever exists today. Leave it empty if you're starting from nothing."
                : "Optional if the words are already in the image."
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

      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="u-eyebrow mb-3">3 — Pick the voice</p>
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
