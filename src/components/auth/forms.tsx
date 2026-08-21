"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/surface";
import type { FormState } from "@/lib/form-state";
import {
  acceptInvite,
  login,
  register,
  requestReset,
  resetPassword,
} from "@/lib/actions/auth";

const EMPTY: FormState = {};

function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-7">
      <h1 className="u-display text-[30px] text-ink">{title}</h1>
      <p className="mt-2.5 text-[14px] leading-relaxed text-muted">{sub}</p>
    </div>
  );
}

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <Alert>{state.error}</Alert>;
  if (state.notice) return <Alert tone="good">{state.notice}</Alert>;
  return null;
}

export function LoginForm({ justReset }: { justReset: boolean }) {
  const [state, action] = useActionState(login, EMPTY);

  return (
    <form action={action} className="u-rise space-y-4">
      <Head title="Welcome back" sub="Sign in to your workspace." />
      {justReset && !state.error ? (
        <Alert tone="good">Password updated. Sign in with your new one.</Alert>
      ) : null}
      <Feedback state={state} />

      <Field label="Work email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Field>

      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>

      <SubmitButton size="lg" className="w-full">
        Sign in
      </SubmitButton>

      <div className="flex items-center justify-between pt-1 text-[13px]">
        <Link href="/forgot-password" className="text-muted transition-colors hover:text-ink">
          Forgot password?
        </Link>
        <Link href="/signup" className="font-semibold text-accent hover:underline">
          Create a workspace
        </Link>
      </div>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(register, EMPTY);

  return (
    <form action={action} className="u-rise space-y-4">
      <Head title="Start a workspace" sub="You'll be the owner. Invite the rest of the team next." />
      <Feedback state={state} />

      <Field label="Your name" htmlFor="name">
        <Input id="name" name="name" autoComplete="name" required autoFocus />
      </Field>

      <Field label="Work email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field label="Password" htmlFor="password" hint="At least 10 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} />
      </Field>

      <Field
        label="Workspace name"
        htmlFor="workspaceName"
        hint="Usually the team or department — Marketing, Growth, Brand."
      >
        <Input id="workspaceName" name="workspaceName" placeholder="Marketing" required />
      </Field>

      <SubmitButton size="lg" className="w-full">
        Create workspace
      </SubmitButton>

      <p className="pt-1 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(requestReset, EMPTY);

  return (
    <form action={action} className="u-rise space-y-4">
      <Head title="Reset your password" sub="We'll email you a link that works once." />
      <Feedback state={state} />

      <Field label="Work email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Field>

      <SubmitButton size="lg" className="w-full">
        Send reset link
      </SubmitButton>

      <p className="pt-1 text-center text-[13px] text-muted">
        <Link href="/login" className="transition-colors hover:text-ink">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, EMPTY);

  return (
    <form action={action} className="u-rise space-y-4">
      <Head title="Choose a new password" sub="Everyone signed in as you will be signed out." />
      <Feedback state={state} />
      <input type="hidden" name="token" value={token} />

      <Field label="New password" htmlFor="password" hint="At least 10 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} autoFocus />
      </Field>

      <Field label="Confirm password" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>

      <SubmitButton size="lg" className="w-full">
        Save password
      </SubmitButton>
    </form>
  );
}

export function AcceptInviteForm({
  token,
  workspaceName,
  email,
  isExistingUser,
}: {
  token: string;
  workspaceName: string;
  email: string;
  isExistingUser: boolean;
}) {
  const [state, action] = useActionState(acceptInvite, EMPTY);

  return (
    <form action={action} className="u-rise space-y-4">
      <Head
        title={`Join ${workspaceName}`}
        sub={
          isExistingUser
            ? `You already have a Texter account for ${email}. Confirm to join this workspace.`
            : `Set up your account for ${email}.`
        }
      />
      <Feedback state={state} />
      <input type="hidden" name="token" value={token} />

      <Field label="Your name" htmlFor="name">
        <Input id="name" name="name" autoComplete="name" required autoFocus />
      </Field>

      <Field
        label={isExistingUser ? "Password" : "Choose a password"}
        htmlFor="password"
        hint={isExistingUser ? "Your existing password stays as it is." : "At least 10 characters."}
      >
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} />
      </Field>

      <SubmitButton size="lg" className="w-full">
        Join workspace
      </SubmitButton>
    </form>
  );
}
