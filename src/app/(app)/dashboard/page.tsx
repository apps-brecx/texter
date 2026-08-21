import Link from "next/link";
import { ArrowRight, Brain, FileText, ScanSearch, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/auth";
import { Badge, Card, CardHeader, Empty } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { specFor } from "@/lib/ai/content-types";
import type { Issue } from "@/lib/ai/types";
import { daysAgo, greeting, timeAgo } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const STAGE = {
  DRAFT: { text: "Reading", tone: "neutral" as const },
  QUESTIONS: { text: "Needs answers", tone: "accent" as const },
  READY: { text: "Ready", tone: "warn" as const },
  APPROVED: { text: "Shipped", tone: "good" as const },
};

export default async function DashboardPage() {
  const { workspace, user } = await requireWorkspace();
  const weekAgo = daysAgo(7);

  const [recent, thisWeek, shipped, activeRules, pendingRules, issueRows] = await Promise.all([
    db.review.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { author: { select: { name: true } } },
    }),
    db.review.count({ where: { workspaceId: workspace.id, createdAt: { gte: weekAgo } } }),
    db.review.count({ where: { workspaceId: workspace.id, stage: "APPROVED" } }),
    db.brainEntry.count({ where: { workspaceId: workspace.id, status: "ACTIVE" } }),
    db.brainEntry.count({ where: { workspaceId: workspace.id, status: "PENDING" } }),
    db.review.findMany({
      where: { workspaceId: workspace.id, issues: { not: undefined } },
      select: { issues: true },
      take: 500,
    }),
  ]);

  const issuesCaught = issueRows.reduce(
    (total, row) => total + ((row.issues as Issue[] | null)?.length ?? 0),
    0,
  );

  const stats = [
    { label: "Reviews this week", value: thisWeek, icon: ScanSearch },
    { label: "Fixes caught", value: issuesCaught, icon: FileText },
    { label: "Copy shipped", value: shipped, icon: Sparkles },
    { label: "Rules in the brain", value: activeRules, icon: Brain },
  ];

  return (
    <>
      <PageHeader
        eyebrow={workspace.name}
        title={`${greeting()}, ${user.name.split(" ")[0]}`}
        description="Everything the team has run through the desk, and what the brain has picked up along the way."
        action={
          <Link href="/new">
            <Button size="lg">
              <Sparkles className="size-4" aria-hidden />
              New review
            </Button>
          </Link>
        }
      />

      <div className="space-y-6 px-6 py-8 sm:px-10">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-5">
              <Icon className="size-4 text-faint" aria-hidden />
              <p className="u-display mt-3 text-[2.25rem] text-ink">{value}</p>
              <p className="mt-0.5 text-[12.5px] text-muted">{label}</p>
            </Card>
          ))}
        </div>

        {pendingRules > 0 ? (
          <Link href="/brain" className="block">
            <Card className="flex items-center gap-4 border-accent-line bg-accent-soft/40 p-5 transition-colors hover:bg-accent-soft/70">
              <Brain className="size-5 shrink-0 text-accent" aria-hidden />
              <p className="flex-1 text-[13.5px] leading-relaxed text-ink">
                Texter worked out{" "}
                <strong className="font-semibold">
                  {pendingRules} new rule{pendingRules === 1 ? "" : "s"}
                </strong>{" "}
                from edits your team made. Confirm or discard them so it stops guessing.
              </p>
              <ArrowRight className="size-4 shrink-0 text-accent" aria-hidden />
            </Card>
          </Link>
        ) : null}

        <Card>
          <CardHeader
            title="Recent reviews"
            action={
              <Link href="/history" className="text-[13px] font-medium text-accent hover:underline">
                See all
              </Link>
            }
          />
          {recent.length === 0 ? (
            <Empty
              icon={<ScanSearch className="size-4" />}
              title="Nothing has come through the desk yet"
              description="Upload a banner, an email screenshot or paste a caption. Texter reads it, questions you, then writes."
              action={
                <Link href="/new">
                  <Button>Run the first review</Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((review) => (
                <li key={review.id}>
                  <Link
                    href={`/reviews/${review.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-ink">{review.title}</span>
                      <span className="block text-[12px] text-muted">
                        {specFor(review.contentType).label} · {review.author.name} · {timeAgo(review.createdAt)}
                      </span>
                    </span>
                    <Badge tone={STAGE[review.stage].tone}>{STAGE[review.stage].text}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
