import { requireUser } from "@/lib/auth";
import { Logo } from "@/components/brand/mark";
import { NewWorkspaceForm } from "@/components/app/new-workspace-form";

export const metadata = { title: "New workspace" };

export default async function OnboardingPage() {
  await requireUser();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-page px-6 py-12">
      <Logo size="lg" animate="grow" className="mb-8" />
      <div className="w-full max-w-[400px] rounded-card border border-line bg-surface p-6 shadow-raised sm:p-7">
        <h1 className="u-display text-[26px] text-ink">Name your workspace</h1>
        <p className="mt-2 mb-6 text-[14px] leading-relaxed text-muted">
          One workspace per team. Its house rules, voices and history stay separate from
          everyone else&apos;s.
        </p>
        <NewWorkspaceForm />
      </div>
    </div>
  );
}
