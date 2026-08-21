import Link from "next/link";
import { Logo } from "@/components/brand/mark";
import { ProofPanel } from "@/components/auth/proof-panel";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh bg-surface lg:grid-cols-[1.05fr_1fr]">
      <ProofPanel />

      <main
        className="flex flex-col px-6 py-7 sm:px-10"
        style={{ paddingTop: "max(env(safe-area-inset-top), 28px)" }}
      >
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Texter home" className="u-tap">
            <Logo size="md" animate="grow" />
          </Link>
          <a
            href="mailto:support@texter.app"
            className="text-[13px] font-medium text-muted transition-colors hover:text-ink"
          >
            Need help?
          </a>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[384px]">{children}</div>
        </div>

        <footer
          className="text-[12px] text-faint"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          Texter — the copy desk that learns your house style.
        </footer>
      </main>
    </div>
  );
}
