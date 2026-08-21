import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ProofPanel } from "@/components/auth/proof-panel";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <ProofPanel />

      <main className="flex flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Texter home">
            <Logo />
          </Link>
          <a
            href="mailto:support@texter.app"
            className="text-[13px] text-muted transition-colors hover:text-ink"
          >
            Need help?
          </a>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[380px]">{children}</div>
        </div>

        <footer className="text-[12px] text-faint">
          Texter — the copy desk that learns your house style.
        </footer>
      </main>
    </div>
  );
}
