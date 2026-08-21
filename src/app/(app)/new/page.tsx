import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/auth";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { NewReview } from "@/components/app/new-review";

export const metadata = { title: "New review" };

export default async function NewReviewPage() {
  const { workspace } = await requireWorkspace();

  const styles = await db.styleProfile.findMany({
    where: { workspaceId: workspace.id },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: { id: true, name: true, tagline: true, isDefault: true },
  });

  return (
    <>
      <PageHeader
        eyebrow="New review"
        title="What are we shipping?"
        description="Give Texter the artwork or the draft. It reads the words, checks them against your house rules, and asks what it needs before writing a line."
      />
      <PageBody>
        <NewReview styles={styles} />
      </PageBody>
    </>
  );
}
