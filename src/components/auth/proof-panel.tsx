"use client";

import { motion } from "motion/react";
import { Logo } from "@/components/ui/logo";

const FIXES = [
  {
    label: "Email subject",
    before: "Kindly find our Mega Sale offer for esteemed customers!!",
    after: "30% off everything — three days only",
  },
  {
    label: "Instagram caption",
    before: "We are having a new arrival of products which are very much trending.",
    after: "New drop. The one everyone kept asking about.",
  },
  {
    label: "Banner CTA",
    before: "Click here to know more",
    after: "See the lineup",
  },
];

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function ProofPanel() {
  return (
    <aside className="u-grain relative hidden flex-col justify-center gap-14 overflow-hidden border-r border-line bg-surface-2 px-12 py-12 lg:flex">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.5] [background-image:linear-gradient(var(--line)_1px,transparent_1px)] [background-size:100%_28px] [mask-image:linear-gradient(to_bottom,transparent,black_55%)]"
      />

      <div className="relative">
        <Logo className="lg:hidden" />
        <p className="u-eyebrow">The copy desk</p>
        <h1 className="u-display mt-4 max-w-md text-[2.75rem] text-ink">
          Correct English isn&apos;t the same as{" "}
          <span className="text-accent">American English</span>.
        </h1>
        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted">
          Upload the artwork or paste the draft. Texter reads it, asks the handful of
          questions it actually needs, then writes copy that sounds like it came from
          down the hall — not from a translation.
        </p>
      </div>

      <div className="relative space-y-3">
        {FIXES.map((fix, index) => (
          <motion.div
            key={fix.label}
            custom={index}
            initial="hidden"
            animate="show"
            variants={rise}
            className="rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <p className="u-eyebrow mb-2.5">{fix.label}</p>
            <p className="font-mono text-[12.5px] leading-relaxed text-muted line-through decoration-danger/60">
              {fix.before}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed font-medium text-ink">{fix.after}</p>
          </motion.div>
        ))}
      </div>
    </aside>
  );
}
