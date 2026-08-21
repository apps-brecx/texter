"use client";

import Link from "next/link";
import { Link2, Plus } from "lucide-react";
import { SubmitButton } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Card, CardHeader, Badge } from "@/components/ui/surface";
import { setReviewCampaign } from "@/lib/actions/workspace";

export type Sibling = {
  id: string;
  title: string;
  typeLabel: string;
  shipped: boolean;
};

/**
 * Shows what else this piece is linked to — and, when it isn't linked to
 * anything, lets you attach it so the next piece can read it.
 */
export function CampaignPanel({
  reviewId,
  campaign,
  siblings,
  options,
}: {
  reviewId: string;
  campaign: { id: string; name: string; brief: string | null } | null;
  siblings: Sibling[];
  options: { id: string; name: string }[];
}) {
  if (!campaign) {
    if (options.length === 0) return null;
    return (
      <Card>
        <CardHeader
          title="Link this to a campaign"
          description="Pieces in the same campaign share their answers and their copy, so the next one asks less and never contradicts this one."
        />
        <form action={setReviewCampaign} className="flex flex-wrap items-center gap-2 p-5">
          <input type="hidden" name="reviewId" value={reviewId} />
          <Select name="campaignId" defaultValue="none" className="h-9 w-auto min-w-52 text-[13px]">
            <option value="none">Not part of one</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
          <SubmitButton variant="secondary" size="sm">
            <Plus className="size-3.5" aria-hidden />
            Link it
          </SubmitButton>
        </form>
      </Card>
    );
  }

  return (
    <Card className="border-accent-line">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Link2 className="size-4 text-accent" aria-hidden />
            {campaign.name}
          </span>
        }
        description={
          campaign.brief ??
          (siblings.length > 0
            ? `Texter read the other ${siblings.length} piece${siblings.length === 1 ? "" : "s"} in this campaign before writing.`
            : "First piece in this campaign. The next one will read this.")
        }
      />

      {siblings.length > 0 ? (
        <ul className="divide-y divide-line">
          {siblings.map((sibling) => (
            <li key={sibling.id}>
              <Link
                href={`/reviews/${sibling.id}`}
                className="u-tap flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">
                    {sibling.title}
                  </span>
                  <span className="block text-[12px] text-muted">{sibling.typeLabel}</span>
                </span>
                <Badge tone={sibling.shipped ? "good" : "neutral"}>
                  {sibling.shipped ? "Shipped" : "Draft"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
