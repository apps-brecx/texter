import { db } from "@/lib/db";
import { apiContext, HttpError, route } from "@/lib/guard";

export const GET = route(async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { workspace } = await apiContext();
  const { id } = await ctx.params;

  const asset = await db.asset.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!asset) throw new HttpError(404, "Not found.");

  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.bytes),
      // `inline` so a PDF renders in the preview frame instead of downloading.
      "Content-Disposition": `inline; filename="${asset.filename.replace(/["\\]/g, "")}"`,
      // Workspace-scoped, so never let a shared cache hold on to it.
      "Cache-Control": "private, max-age=3600",
    },
  });
});
