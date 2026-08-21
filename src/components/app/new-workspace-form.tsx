"use client";

import { useActionState } from "react";
import Link from "next/link";
import { SubmitButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/surface";
import { createWorkspace } from "@/lib/actions/workspace";
import type { FormState } from "@/lib/form-state";

export function NewWorkspaceForm() {
  const [state, action] = useActionState<FormState, FormData>(createWorkspace, {});

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}

      <Field label="Workspace name" hint="Usually the team — Marketing, Growth, Brand.">
        <Input name="name" placeholder="Marketing" required autoFocus />
      </Field>

      <SubmitButton size="lg" className="w-full">
        Create workspace
      </SubmitButton>

      <p className="text-center text-[13px] text-muted">
        <Link href="/dashboard" className="transition-colors hover:text-ink">
          Back to the app
        </Link>
      </p>
    </form>
  );
}
