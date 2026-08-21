"use client";

import { useActionState, useState } from "react";
import { Check, Copy, KeyRound, Plus, Star, Trash2, X } from "lucide-react";
import { Button, SubmitButton } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert, Badge, Card, CardHeader } from "@/components/ui/surface";
import { saveStyle, makeStyleDefault, deleteStyle } from "@/lib/actions/styles";
import {
  adminResetLink,
  changeRole,
  inviteMember,
  removeMember,
  updateAiSettings,
  updateProfile,
  updateWorkspace,
} from "@/lib/actions/workspace";
import type { FormState } from "@/lib/form-state";
import { initials, timeAgo } from "@/lib/utils";

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <Alert>{state.error}</Alert>;
  if (state.notice) return <Alert tone="good">{state.notice}</Alert>;
  return null;
}

// ------------------------------------------------------------------ profile

export function ProfileCard({ name, email }: { name: string; email: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, {});

  return (
    <Card>
      <CardHeader title="You" description="How your name shows up on reviews." />
      <form action={action} className="space-y-4 p-5">
        <Feedback state={state} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input name="name" defaultValue={name} required />
          </Field>
          <Field label="Email" hint="Ask an owner if this needs to change.">
            <Input value={email} disabled />
          </Field>
        </div>
        <SubmitButton size="sm">Save</SubmitButton>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------- workspace

export type WorkspaceValues = {
  name: string;
  industry: string | null;
  audience: string | null;
  brandNotes: string | null;
  region: string;
};

export function WorkspaceCard({ values }: { values: WorkspaceValues }) {
  const [state, action] = useActionState<FormState, FormData>(updateWorkspace, {});

  return (
    <Card>
      <CardHeader
        title="Workspace"
        description="Context every review gets for free. The better this is, the fewer questions Texter has to ask."
      />
      <form action={action} className="space-y-4 p-5">
        <Feedback state={state} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Workspace name">
            <Input name="name" defaultValue={values.name} required />
          </Field>
          <Field label="Market" hint="Which English the copy is written for.">
            <Select name="region" defaultValue={values.region}>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="Global">Global English</option>
            </Select>
          </Field>
        </div>

        <Field label="What the business sells" hint="One line. Specific beats broad.">
          <Input
            name="industry"
            defaultValue={values.industry ?? ""}
            placeholder="Wholesale home textiles, sold direct to US retailers"
          />
        </Field>

        <Field label="Who reads the copy">
          <Textarea
            name="audience"
            defaultValue={values.audience ?? ""}
            placeholder="Store buyers, 30–55, price-sensitive, skim on their phone between meetings."
            className="min-h-[72px]"
          />
        </Field>

        <Field
          label="Brand notes"
          hint="Claims you can't make, names to spell a certain way, anything legal insists on."
        >
          <Textarea
            name="brandNotes"
            defaultValue={values.brandNotes ?? ""}
            placeholder="Never say 'cheapest'. The brand is written BRECX, all caps. Free shipping starts at $75."
            className="min-h-[100px]"
          />
        </Field>

        <SubmitButton size="sm">Save workspace</SubmitButton>
      </form>
    </Card>
  );
}

// ------------------------------------------------------------------- voices

export type Style = {
  id: string;
  name: string;
  tagline: string;
  guidance: string;
  formality: number;
  energy: number;
  emojiPolicy: string;
  isDefault: boolean;
  isBuiltIn: boolean;
};

export function VoicesCard({ styles, canManage }: { styles: Style[]; canManage: boolean }) {
  const [editing, setEditing] = useState<Style | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <Card>
      <CardHeader
        title="Voices"
        description="Pick one per review. The default is used when nobody chooses."
        action={
          canManage ? (
            <Button size="sm" variant={adding ? "ghost" : "secondary"} onClick={() => { setAdding((v) => !v); setEditing(null); }}>
              {adding ? <X className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
              {adding ? "Cancel" : "New voice"}
            </Button>
          ) : null
        }
      />

      {adding ? (
        <div className="border-b border-line bg-surface-2 p-5">
          <StyleForm onDone={() => setAdding(false)} />
        </div>
      ) : null}

      <ul className="divide-y divide-line">
        {styles.map((style) =>
          editing?.id === style.id ? (
            <li key={style.id} className="bg-surface-2 p-5">
              <StyleForm style={style} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={style.id} className="group p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-medium text-ink">{style.name}</span>
                {style.isDefault ? <Badge tone="accent">Default</Badge> : null}
                {style.isBuiltIn ? <Badge>Built in</Badge> : null}
                <span className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  {canManage ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(style); setAdding(false); }}>
                        Edit
                      </Button>
                      {!style.isDefault ? (
                        <>
                          <form action={makeStyleDefault}>
                            <input type="hidden" name="id" value={style.id} />
                            <SubmitButton variant="ghost" size="sm" title="Make default">
                              <Star className="size-3.5" aria-hidden />
                            </SubmitButton>
                          </form>
                          <form action={deleteStyle}>
                            <input type="hidden" name="id" value={style.id} />
                            <SubmitButton variant="ghost" size="sm" title="Delete">
                              <Trash2 className="size-3.5" aria-hidden />
                            </SubmitButton>
                          </form>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </span>
              </div>
              <p className="mt-0.5 text-[13px] text-muted">{style.tagline}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{style.guidance}</p>
              <p className="mt-2 text-[11.5px] text-faint">
                Formality {style.formality} · Energy {style.energy} · Emoji {style.emojiPolicy}
              </p>
            </li>
          ),
        )}
      </ul>
    </Card>
  );
}

function StyleForm({ style, onDone }: { style?: Style; onDone: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(saveStyle, {});

  return (
    <form action={action} className="space-y-4">
      {style ? <input type="hidden" name="id" value={style.id} /> : null}
      <Feedback state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input name="name" defaultValue={style?.name} placeholder="Sharp" required />
        </Field>
        <Field label="When to use it">
          <Input name="tagline" defaultValue={style?.tagline} placeholder="Punchy, built for the scroll" required />
        </Field>
      </div>

      <Field label="How it should sound" hint="Write it as instructions. This text is handed to the model verbatim.">
        <Textarea
          name="guidance"
          defaultValue={style?.guidance}
          placeholder="Short. Rhythmic. Front-loaded. One idea per line. Cut every adverb."
          className="min-h-[100px]"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Formality" hint="0 street · 100 boardroom">
          <Input name="formality" type="number" min={0} max={100} defaultValue={style?.formality ?? 50} required />
        </Field>
        <Field label="Energy" hint="0 calm · 100 hype">
          <Input name="energy" type="number" min={0} max={100} defaultValue={style?.energy ?? 50} required />
        </Field>
        <Field label="Emoji">
          <Select name="emojiPolicy" defaultValue={style?.emojiPolicy ?? "sparing"}>
            <option value="none">Never</option>
            <option value="sparing">Sparing</option>
            <option value="generous">Generous</option>
          </Select>
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <SubmitButton size="sm">{style ? "Save voice" : "Add voice"}</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          {state.notice ? "Done" : "Cancel"}
        </Button>
      </div>
    </form>
  );
}

// --------------------------------------------------------------------- team

export type Member = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  isYou: boolean;
};

export type Invite = { id: string; email: string; role: string; createdAt: string };

export function TeamCard({
  members,
  invites,
  actorRole,
}: {
  members: Member[];
  invites: Invite[];
  actorRole: "OWNER" | "ADMIN" | "MEMBER";
}) {
  const [inviteState, inviteAction] = useActionState<FormState, FormData>(inviteMember, {});
  const [resetState, resetAction] = useActionState<FormState, FormData>(adminResetLink, {});
  const canManage = actorRole !== "MEMBER";

  return (
    <Card>
      <CardHeader
        title="Team"
        description="Members run reviews and teach the brain. Admins also manage voices, settings and people."
      />

      {canManage ? (
        <form action={inviteAction} className="space-y-3 border-b border-line bg-surface-2 p-5">
          <Feedback state={inviteState} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Invite by email" className="flex-1">
              <Input name="email" type="email" placeholder="name@company.com" required />
            </Field>
            <Field label="Role" className="sm:w-40">
              <Select name="role" defaultValue="MEMBER">
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </Field>
            <SubmitButton>Send invite</SubmitButton>
          </div>
        </form>
      ) : null}

      {resetState.error || resetState.notice ? (
        <div className="border-b border-line p-5">
          <Feedback state={resetState} />
        </div>
      ) : null}

      <ul className="divide-y divide-line">
        {members.map((member) => (
          <li key={member.membershipId} className="flex flex-wrap items-center gap-3 p-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
              {initials(member.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-ink">
                {member.name}
                {member.isYou ? <span className="ml-1.5 text-[12px] font-normal text-faint">you</span> : null}
              </span>
              <span className="block truncate text-[12px] text-muted">{member.email}</span>
            </span>

            {canManage && !member.isYou ? (
              <>
                <form action={changeRole}>
                  <input type="hidden" name="membershipId" value={member.membershipId} />
                  <Select
                    name="role"
                    defaultValue={member.role}
                    className="h-8 w-32 text-[13px]"
                    onChange={(event) => event.currentTarget.form?.requestSubmit()}
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                    {actorRole === "OWNER" ? <option value="OWNER">Owner</option> : null}
                  </Select>
                </form>

                <form action={resetAction}>
                  <input type="hidden" name="membershipId" value={member.membershipId} />
                  <SubmitButton variant="ghost" size="sm" title="Send a password reset link">
                    <KeyRound className="size-3.5" aria-hidden />
                  </SubmitButton>
                </form>

                <form action={removeMember}>
                  <input type="hidden" name="membershipId" value={member.membershipId} />
                  <SubmitButton variant="ghost" size="sm" title="Remove from workspace">
                    <Trash2 className="size-3.5" aria-hidden />
                  </SubmitButton>
                </form>
              </>
            ) : (
              <Badge tone={member.role === "OWNER" ? "accent" : "neutral"}>
                {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
              </Badge>
            )}
          </li>
        ))}
      </ul>

      {invites.length > 0 ? (
        <div className="border-t border-line">
          <p className="u-eyebrow px-5 pt-4">Waiting to accept</p>
          <ul className="divide-y divide-line">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center gap-3 px-5 py-3">
                <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{invite.email}</span>
                <span className="text-[11.5px] text-faint">sent {timeAgo(invite.createdAt)}</span>
                <Badge>{invite.role.toLowerCase()}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

// ----------------------------------------------------------------------- ai

const MODELS = {
  anthropic: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"],
  openai: ["gpt-4o", "gpt-4.1", "gpt-5"],
};

export function AiCard({
  provider,
  model,
  anthropicReady,
  openaiReady,
}: {
  provider: string;
  model: string;
  anthropicReady: boolean;
  openaiReady: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(updateAiSettings, {});
  const [selected, setSelected] = useState(provider);

  return (
    <Card>
      <CardHeader
        title="The engine"
        description="Which model does the reading and the writing. Keys live in your environment, never in the database."
      />
      <form action={action} className="space-y-4 p-5">
        <Feedback state={state} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Provider">
            <Select name="aiProvider" value={selected} onChange={(event) => setSelected(event.target.value)}>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI</option>
            </Select>
          </Field>

          <Field label="Model" hint="Type any model name your key can reach.">
            <Input
              name="aiModel"
              defaultValue={model}
              list="texter-models"
              key={selected}
              required
            />
            <datalist id="texter-models">
              {MODELS[selected as keyof typeof MODELS]?.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className="flex flex-wrap gap-2 text-[12.5px]">
          <KeyState label="ANTHROPIC_API_KEY" ready={anthropicReady} />
          <KeyState label="OPENAI_API_KEY" ready={openaiReady} />
        </div>

        <SubmitButton size="sm">Save engine</SubmitButton>
      </form>
    </Card>
  );
}

function KeyState({ label, ready }: { label: string; ready: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11.5px] ${
        ready ? "border-good/25 bg-good-soft text-good" : "border-line bg-surface-2 text-faint"
      }`}
    >
      {ready ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
      {label} {ready ? "set" : "missing"}
    </span>
  );
}
