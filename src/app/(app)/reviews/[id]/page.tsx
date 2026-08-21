import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/auth";
import { Badge } from "@/components/ui/surface";
import { ReviewWorkspace, type ReviewData } from "@/components/app/review-workspace";
import { specFor } from "@/lib/ai/content-types";
import type { Issue, Output, Question } from "@/lib/ai/types";
import { timeAgo } from "@/lib/utils";

const STAGE_LABEL = {
  DRAFT: { text: "Reading", tone: "neutral" as const },
  QUESTIONS: { text: "Needs your answers", tone: "accent" as const },
  READY: { text: "Ready to review", tone: "warn" as const },
  APPROVED: { text: "Shipped", tone: "good" as const },
};

export default async function ReviewPage({ params }: PageProps<"/reviews/[id]">) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;

  const review = await db.review.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      style: { select: { name: true } },
      author: { select: { name: true } },
      asset: { select: { mimeType: true, filename: true } },
    },
  });
  if (!review) notFound();

  const stage = STAGE_LABEL[review.stage];

  const data: ReviewData = {
    id: review.id,
    title: review.title,
    contentType: review.contentType,
    stage: review.stage,
    sourceText: review.sourceText,
    briefNote: review.briefNote,
    assetId: review.assetId,
    assetMime: review.asset?.mimeType ?? null,
    assetName: review.asset?.filename ?? null,
    styleName: review.style?.name ?? null,
    modelUsed: review.modelUsed,
    imageRead: (review.imageRead as ReviewData["imageRead"]) ?? null,
    issues: (review.issues as Issue[] | null) ?? [],
    questions: (review.questions as Question[] | null) ?? [],
    answers: (review.answers as Record<string, string> | null) ?? {},
    output: (review.output as Output | null) ?? null,
    approvedText: review.approvedText,
  };

  return (
    <>
      <header className="border-b border-line bg-surface px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/history"
            className="u-tap inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            All reviews
          </Link>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="u-display text-[26px] text-ink sm:text-[32px]">{review.title}</h1>
              <p className="mt-2 text-[13px] text-muted">
                {specFor(review.contentType).label}
                {data.styleName ? ` · ${data.styleName} voice` : ""} · {review.author.name} ·{" "}
                {timeAgo(review.createdAt)}
                {review.modelUsed ? ` · ${review.modelUsed}` : ""}
              </p>
            </div>
            <Badge tone={stage.tone}>{stage.text}</Badge>
          </div>
        </div>
      </header>

      <ReviewWorkspace review={data} />
    </>
  );
}
