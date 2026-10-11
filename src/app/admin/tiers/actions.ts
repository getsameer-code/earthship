"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { pledges, tiers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

function parse(fd: FormData) {
  const name = String(fd.get("name") ?? "").trim().slice(0, 80);
  if (!name) throw new Error("Name is required");
  const amountInr = Number(String(fd.get("amount") ?? "").replace(/[^\d]/g, ""));
  if (!Number.isInteger(amountInr) || amountInr < 1 || amountInr > 2_000_000_000) throw new Error("Enter a valid amount in rupees");
  const sort = Number.parseInt(String(fd.get("sortOrder") ?? "0"), 10);
  return {
    name,
    amountInr,
    blurb: String(fd.get("blurb") ?? "").trim().slice(0, 400),
    custom: fd.get("custom") === "on",
    published: fd.get("published") === "on",
    sortOrder: Number.isFinite(sort) ? sort : 0,
  };
}

const slug = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30) || "tier";

const refresh = () => {
  revalidatePath("/");
  revalidatePath("/pledge");
  revalidatePath("/admin/tiers");
};

export async function createTier(fd: FormData) {
  await requireAdmin();
  const v = parse(fd);
  await db().insert(tiers).values({ id: `${slug(v.name)}_${randomBytes(2).toString("hex")}`, ...v });
  refresh();
}

export async function updateTier(id: string, fd: FormData) {
  await requireAdmin();
  const v = parse(fd);
  await db().update(tiers).set(v).where(eq(tiers.id, id));
  // a rename applies to that tier's existing pledges too; amounts are never touched
  await db().update(pledges).set({ tierName: v.name }).where(eq(pledges.tier, id));
  refresh();
}

/** Safe: pledges keep their own copy of the tier name and amount. */
export async function deleteTier(id: string) {
  await requireAdmin();
  await db().delete(tiers).where(eq(tiers.id, id));
  refresh();
}
