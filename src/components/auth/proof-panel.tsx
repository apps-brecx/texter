"use client";

import { motion } from "motion/react";
import { Mark, Wordmark } from "@/components/brand/mark";

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
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.35 + i * 0.11, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/**
 * The brand panel stays navy in both themes — it *is* the brand colour, the
 * same way the logo's T is.
 */
export function ProofPanel() {
  return (
    <aside className="relative hidden flex-col justify-center gap-12 overflow-hidden bg-[#17293d] px-12 py-14 lg:flex">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:56px_56px]"
      />
      <div
        aria-hidden
        className="absolute -top-24 -right-24 size-[380px] rounded-full bg-[#5bbe4c]/15 blur-3xl"
      />

      <div className="relative">
        <span className="inline-flex items-center gap-2.5">
          <Mark className="size-9 text-white" animate="grow" />
          <Wordmark className="text-[26px] !text-white" />
        </span>

        <h1 className="u-display mt-9 max-w-md text-[2.75rem] text-white">
          Correct English isn&apos;t the same as{" "}
          <span className="text-[#7ad46a]">American English</span>.
        </h1>
        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/65">
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
            className="rounded-card border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm"
          >
            <p className="mb-2.5 text-[11px] font-bold tracking-[0.1em] text-white/45 uppercase">
              {fix.label}
            </p>
            <p className="font-mono text-[12.5px] leading-relaxed text-white/40 line-through decoration-[#ef7c6c]/70">
              {fix.before}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed font-semibold text-white">{fix.after}</p>
          </motion.div>
        ))}
      </div>
    </aside>
  );
}
