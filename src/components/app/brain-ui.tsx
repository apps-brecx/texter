"use client";

import { useActionState, useState } from "react";
import { Check, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button, SubmitButton } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert, Badge, Card, CardHeader, Empty } from "@/components/ui/surface";
import { CONTENT_TYPES } from "@/lib/ai/content-types";
import {
  createBrainEntry,
  decideLesson,
  deleteBrainEntry,
  setBrainStatus,
  updateBrainEntry,
} from "@/lib/actions/brain";
import type { FormState } from "@/lib/form-state";
import { cn, timeAgo } from "@/lib/utils";

export type Entry = {
  id: string;
  kind: "RULE" | "TERM" | "EXAMPLE" | "FACT";
  origin: "TAUGHT" | "LEARNED";
  status: "ACTIVE" | "PENDING" | "ARCHIVED";
  title: string;
  body: string;
  wrongForm: string | null;
  rightForm: string | null;
  appliesTo: string[];
  timesUsed: number;
  createdAt: string;
  authorName: string | null;
};

const KIND_LABEL = {
  RULE: "Rule",
  TERM: "Wording",
  EXAMPLE: "Example",
  FACT: "Fact",
} as const;

export function BrainBoard({ entries }: { entries: Entry[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [filter, setFilter] = useState<"all" | Entry["kind"]>("all");

  const pending = entries.filter((entry) => entry.status === "PENDING");
  const active = entries.filter(
    (entry) => entry.status === "ACTIVE" && (filter === "all" || entry.kind === filter),
  );
  const archived = entries.filter((entry) => entry.status === "ARCHIVED");

  return (
    <div className="space-y-6">
      {pending.length > 0 ? (
        <Card className="border-accent-line">
          <CardHeader
            title={`${pending.length} thing${pending.length === 1 ? "" : "s"} Texter thinks it learned`}
            description="Pulled out of edits your team made to its copy. Keep the ones that are actually house style."
          />
          <ul className="divide-y divide-line">
            {pending.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-start gap-4 p-5">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-ink">{entry.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{entry.body}</p>
                  {entry.wrongForm ? (
                    <p className="mt-2 font-mono text-[12px] text-muted">
                      <span className="line-through decoration-danger/50">{entry.wrongForm}</span>
                      <span className="mx-2 text-faint">→</span>
                      <span className="text-ink">{entry.rightForm}</span>
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11.5px] text-faint">Learned {timeAgo(entry.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <form action={decideLesson}>
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="decision" value="drop" />
                    <SubmitButton variant="ghost" size="sm">
                      <X className="size-3.5" aria-hidden />
                      Discard
                    </SubmitButton>
                  </form>
                  <form action={decideLesson}>
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="decision" value="keep" />
                    <SubmitButton size="sm">
                      <Check className="size-3.5" aria-hidden />
                      Keep it
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="House rules"
          description="Everything here goes into the prompt on every review, heaviest-used first."
          action={
            <Button size="sm" variant={adding ? "ghost" : "secondary"} onClick={() => { setAdding((v) => !v); setEditing(null); }}>
              {adding ? <X className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
              {adding ? "Cancel" : "Teach it something"}
            </Button>
          }
        />

        {adding ? (
          <div className="border-b border-line bg-surface-2 p-5">
            <EntryForm onDone={() => setAdding(false)} />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1.5 border-b border-line px-5 py-3">
          {(["all", "RULE", "TERM", "EXAMPLE", "FACT"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                filter === value
                  ? "border-accent bg-accent-soft font-medium text-accent"
                  : "border-line text-muted hover:text-ink",
              )}
            >
              {value === "all" ? "Everything" : KIND_LABEL[value]}
            </button>
          ))}
        </div>

        {active.length === 0 ? (
          <Empty
            title="Nothing here yet"
            description="Add the phrases your team keeps getting wrong, or approve copy and let Texter work them out on its own."
          />
        ) : (
          <ul className="divide-y divide-line">
            {active.map((entry) =>
              editing?.id === entry.id ? (
                <li key={entry.id} className="bg-surface-2 p-5">
                  <EntryForm entry={entry} onDone={() => setEditing(null)} />
                </li>
              ) : (
                <li key={entry.id} className="group flex items-start gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <Badge tone={entry.kind === "TERM" ? "danger" : "neutral"}>{KIND_LABEL[entry.kind]}</Badge>
                      {entry.origin === "LEARNED" ? <Badge tone="accent">Self-taught</Badge> : null}
                      {entry.appliesTo.length > 0 ? (
                        <span className="text-[11px] text-faint">
                          {entry.appliesTo
                            .map((value) => CONTENT_TYPES.find((type) => type.value === value)?.label ?? value)
                            .join(", ")}{" "}
                          only
                        </span>
                      ) : null}
                    </div>

                    <p className="text-[14px] font-medium text-ink">{entry.title}</p>
                    {entry.wrongForm ? (
                      <p className="mt-1.5 font-mono text-[12.5px]">
                        <span className="text-muted line-through decoration-danger/50">{entry.wrongForm}</span>
                        <span className="mx-2 text-faint">→</span>
                        <span className="text-ink">{entry.rightForm}</span>
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{entry.body}</p>
                    <p className="mt-2 text-[11.5px] text-faint">
                      {entry.timesUsed > 0 ? `Used on ${entry.timesUsed} reviews` : "Not used yet"}
                      {entry.authorName ? ` · added by ${entry.authorName}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(entry); setAdding(false); }}>
                      <Pencil className="size-3.5" aria-hidden />
                    </Button>
                    <form action={setBrainStatus}>
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="status" value="ARCHIVED" />
                      <SubmitButton variant="ghost" size="sm" title="Archive">
                        <Trash2 className="size-3.5" aria-hidden />
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </Card>

      {archived.length > 0 ? (
        <Card>
          <CardHeader title={`Archived (${archived.length})`} description="Not in the prompt. Restore any time." />
          <ul className="divide-y divide-line">
            {archived.map((entry) => (
              <li key={entry.id} className="flex items-center gap-4 px-5 py-3">
                <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{entry.title}</span>
                <form action={setBrainStatus}>
                  <input type="hidden" name="id" value={entry.id} />
                  <input type="hidden" name="status" value="ACTIVE" />
                  <SubmitButton variant="ghost" size="sm">Restore</SubmitButton>
                </form>
                <form action={deleteBrainEntry}>
                  <input type="hidden" name="id" value={entry.id} />
                  <SubmitButton variant="ghost" size="sm" title="Delete for good">
                    <Trash2 className="size-3.5" aria-hidden />
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function EntryForm({ entry, onDone }: { entry?: Entry; onDone: () => void }) {
  const [kind, setKind] = useState<Entry["kind"]>(entry?.kind ?? "RULE");
  const [state, action] = useActionState<FormState, FormData>(
    entry ? updateBrainEntry : createBrainEntry,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      {state.error ? <Alert>{state.error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <Field label="Type">
          <Select name="kind" value={kind} onChange={(event) => setKind(event.target.value as Entry["kind"])}>
            <option value="RULE">Rule</option>
            <option value="TERM">Wording swap</option>
            <option value="EXAMPLE">Example</option>
            <option value="FACT">Fact</option>
          </Select>
        </Field>

        <Field label="Name it">
          <Input
            name="title"
            defaultValue={entry?.title}
            placeholder={kind === "TERM" ? "kindly" : "Lead with the deadline"}
            required
          />
        </Field>
      </div>

      {kind === "TERM" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Never write">
            <Input name="wrongForm" defaultValue={entry?.wrongForm ?? ""} placeholder="kindly confirm" required />
          </Field>
          <Field label="Write this instead">
            <Input name="rightForm" defaultValue={entry?.rightForm ?? ""} placeholder="please confirm" required />
          </Field>
        </div>
      ) : null}

      <Field
        label={kind === "TERM" ? "Why (optional)" : "The rule"}
        hint="Written the way you'd explain it to a new hire. This text goes straight into the prompt."
      >
        <Textarea
          name="body"
          defaultValue={entry?.body}
          placeholder={
            kind === "FACT"
              ? "Free shipping starts at $75, not $50. Nobody ever gets this right."
              : "Put the date in the first line of every promo email. Our customers buy on deadlines."
          }
          required={kind !== "TERM"}
        />
      </Field>

      <Field label="Only for certain formats" hint="Leave everything unticked and the rule applies everywhere.">
        <div className="flex flex-wrap gap-1.5">
          {CONTENT_TYPES.map((type) => (
            <label
              key={type.value}
              className="cursor-pointer rounded-full border border-line px-2.5 py-1 text-[12px] text-muted transition-colors has-checked:border-accent has-checked:bg-accent-soft has-checked:font-medium has-checked:text-accent"
            >
              <input
                type="checkbox"
                name="appliesTo"
                value={type.value}
                defaultChecked={entry?.appliesTo.includes(type.value)}
                className="sr-only"
              />
              {type.label}
            </label>
          ))}
        </div>
      </Field>

      <div className="flex items-center gap-2">
        <SubmitButton size="sm">{entry ? "Save" : "Add to the brain"}</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          {state.notice ? "Done" : "Cancel"}
        </Button>
        {state.notice ? <span className="text-[12.5px] text-good">{state.notice}</span> : null}
      </div>
    </form>
  );
}
