import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { BrainBoard, type Entry } from "@/components/app/brain-ui";

export const metadata = { title: "The brain" };

export default async function BrainPage() {
  const { workspace } = await requireWorkspace();

  const entries = await db.brainEntry.findMany({
    where: { workspaceId: workspace.id },
    include: { author: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { weight: "desc" }, { createdAt: "desc" }],
  });

  const data: Entry[] = entries.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    origin: entry.origin,
    status: entry.status,
    title: entry.title,
    body: entry.body,
    wrongForm: entry.wrongForm,
    rightForm: entry.rightForm,
    appliesTo: entry.appliesTo,
    timesUsed: entry.timesUsed,
    createdAt: entry.createdAt.toISOString(),
    authorName: entry.author?.name ?? null,
  }));

  return (
    <>
      <PageHeader
        eyebrow="The brain"
        title="What Texter knows about your house style"
        description="Two ways in: teach it directly, or approve copy and let it work out the pattern from what you changed. Everything active here is in the prompt on every single review."
      />
      <div className="px-6 py-8 sm:px-10">
        <BrainBoard entries={data} />
      </div>
    </>
  );
}
