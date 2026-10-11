import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tiers, type Tier } from "@/db/schema";
import { DEFAULT_TIERS } from "@/lib/config";

/** Live tiers for the public site (published only), or all of them for admin. Falls back to the defaults if the table doesn't exist yet. */
export async function getTiers({ all = false } = {}): Promise<Tier[]> {
  try {
    const q = db().select().from(tiers);
    return await (all ? q : q.where(eq(tiers.published, true))).orderBy(asc(tiers.sortOrder), asc(tiers.createdAt));
  } catch {
    return DEFAULT_TIERS.map((t) => ({ ...t, published: true, createdAt: new Date(0) }));
  }
}

/** Name to show for a stored pledge: its snapshot, else a default's name, else the raw id. */
export const pledgeTierName = (p: { tier: string; tierName: string | null }) =>
  p.tierName ?? DEFAULT_TIERS.find((t) => t.id === p.tier)?.name ?? p.tier;
