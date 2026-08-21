import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/auth";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { NewReview, type CampaignOption } from "@/components/app/new-review";
import { specFor } from "@/lib/ai/content-types";

export const metadata = { title: "New review" };

export default async function NewReviewPage() {
  const { workspace } = await requireWorkspace();

  const [styles, campaignRows] = await Promise.all([
    db.styleProfile.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: { id: true, name: true, tagline: true, isDefault: true },
    }),
    db.campaign.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { title: true, contentType: true },
        },
        _count: { select: { reviews: true } },
      },
    }),
  ]);

  const campaigns: CampaignOption[] = campaignRows.map((campaign) => {
    const latest = campaign.reviews[0];
    return {
      id: campaign.id,
      name: campaign.name,
      pieceCount: campaign._count.reviews,
      lastPiece: latest ? `${specFor(latest.contentType).label} — ${latest.title}` : null,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="New review"
        title="What are we shipping?"
        description="Give Texter the artwork or the draft. It reads the words, checks them against your house rules, and asks what it needs before writing a line."
      />
      <PageBody>
        <NewReview styles={styles} campaigns={campaigns} />
      </PageBody>
    </>
  );
}
