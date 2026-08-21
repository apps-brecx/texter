import Link from "next/link";
import { ScanSearch } from "lucide-react";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/auth";
import { Badge, Card, Empty } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { CONTENT_TYPES, specFor } from "@/lib/ai/content-types";
import type { Issue } from "@/lib/ai/types";
import { cn, timeAgo } from "@/lib/utils";
import type { ContentType } from "@prisma/client";

export const metadata = { title: "History" };

const STAGE = {
  DRAFT: { text: "Reading", tone: "neutral" as const },
  QUESTIONS: { text: "Needs answers", tone: "accent" as const },
  READY: { text: "Ready", tone: "warn" as const },
  APPROVED: { text: "Shipped", tone: "good" as const },
};

export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  const { workspace } = await requireWorkspace();
  const { type } = await searchParams;

  const filter = CONTENT_TYPES.find((spec) => spec.value === type)?.value as ContentType | undefined;

  const reviews = await db.review.findMany({
    where: { workspaceId: workspace.id, ...(filter ? { contentType: filter } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { author: { select: { name: true } }, style: { select: { name: true } } },
  });

  return (
    <>
      <PageHeader
        eyebrow="History"
        title="Everything the desk has seen"
        description="Every review stays here with its questions, answers and the version that actually shipped."
      />

      <PageBody className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          <FilterChip href="/history" active={!filter} label="Everything" />
          {CONTENT_TYPES.map((spec) => (
            <FilterChip
              key={spec.value}
              href={`/history?type=${spec.value}`}
              active={filter === spec.value}
              label={spec.label}
            />
          ))}
        </div>

        <Card>
          {reviews.length === 0 ? (
            <Empty
              icon={<ScanSearch className="size-4" />}
              title={filter ? "Nothing of that kind yet" : "No reviews yet"}
              description="Reviews land here the moment you start one."
              action={
                <Link href="/new">
                  <Button>New review</Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {reviews.map((review) => {
                const issues = ((review.issues as Issue[] | null) ?? []).length;
                return (
                  <li key={review.id}>
                    <Link
                      href={`/reviews/${review.id}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-4 transition-colors hover:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-ink">{review.title}</span>
                        <span className="block text-[12px] text-muted">
                          {specFor(review.contentType).label}
                          {review.style ? ` · ${review.style.name}` : ""} · {review.author.name} ·{" "}
                          {timeAgo(review.createdAt)}
                        </span>
                      </span>
                      {issues > 0 ? (
                        <span className="text-[12px] text-muted">
                          {issues} fix{issues === 1 ? "" : "es"}
                        </span>
                      ) : null}
                      <Badge tone={STAGE[review.stage].tone}>{STAGE[review.stage].text}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </PageBody>
    </>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-[12.5px] transition-colors",
        active
          ? "border-accent bg-accent-soft font-medium text-accent"
          : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
      )}
    >
      {label}
    </Link>
  );
}
