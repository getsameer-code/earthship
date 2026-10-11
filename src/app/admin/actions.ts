"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { admins, contacts, interactions, pledges } from "@/db/schema";
import { INTERACTION_TYPES, SEGMENTS, STATUSES } from "@/lib/config";
import { getTiers } from "@/lib/tiers";
import { requireAdmin } from "@/lib/auth";

const oneOf = <T extends readonly { id: string }[]>(list: T, v: FormDataEntryValue | null, fallback: string) =>
  list.some((x) => x.id === v) ? String(v) : fallback;

const text = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s || null;
};

const tagList = (v: FormDataEntryValue | null) =>
  [...new Set(String(v ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];

export async function createContact(fd: FormData) {
  await requireAdmin();
  const name = text(fd.get("name"));
  const email = text(fd.get("email"))?.toLowerCase();
  if (!name || !email) throw new Error("Name and email are required");
  const [c] = await db()
    .insert(contacts)
    .values({
      name,
      email,
      phone: text(fd.get("phone")),
      city: text(fd.get("city")),
      segment: oneOf(SEGMENTS, fd.get("segment"), "friend"),
      owner: text(fd.get("owner")),
      tags: tagList(fd.get("tags")),
      source: text(fd.get("source")) ?? "manual",
    })
    .onConflictDoNothing({ target: contacts.email })
    .returning({ id: contacts.id });
  if (!c) redirect("/admin?dup=1");
  redirect(`/admin/contacts/${c.id}`);
}

export async function updateContact(id: string, fd: FormData) {
  await requireAdmin();
  await db()
    .update(contacts)
    .set({
      name: text(fd.get("name")) ?? "Unnamed",
      phone: text(fd.get("phone")),
      city: text(fd.get("city")),
      status: oneOf(STATUSES, fd.get("status"), "new"),
      segment: oneOf(SEGMENTS, fd.get("segment"), "friend"),
      owner: text(fd.get("owner")),
      tags: tagList(fd.get("tags")),
      nextFollowUp: text(fd.get("nextFollowUp")),
      okToContact: fd.get("okToContact") === "on",
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, id));
  revalidatePath(`/admin/contacts/${id}`);
  revalidatePath("/admin");
}

export async function addInteraction(id: string, fd: FormData) {
  await requireAdmin();
  const body = text(fd.get("body"));
  if (!body) return;
  await db().insert(interactions).values({
    contactId: id,
    type: oneOf(INTERACTION_TYPES, fd.get("type"), "note"),
    body,
  });
  // logging an interaction on a brand-new contact moves them forward
  await db().update(contacts).set({ updatedAt: new Date() }).where(eq(contacts.id, id));
  revalidatePath(`/admin/contacts/${id}`);
}

export async function addPledge(id: string, fd: FormData) {
  await requireAdmin();
  const tier = (await getTiers({ all: true })).find((t) => t.id === fd.get("tier"));
  if (!tier) throw new Error("Unknown tier");
  const amount = Math.round(Number(fd.get("amount")));
  if (!Number.isFinite(amount) || amount < 1) throw new Error("Invalid amount");
  await db().insert(pledges).values({ contactId: id, tier: tier.id, tierName: tier.name, amountInr: amount, message: text(fd.get("message")) });
  revalidatePath(`/admin/contacts/${id}`);
  revalidatePath("/admin");
}

export async function toggleWithdrawn(contactId: string, pledgeId: string, withdrawn: boolean) {
  await requireAdmin();
  await db().update(pledges).set({ withdrawn }).where(eq(pledges.id, pledgeId));
  revalidatePath(`/admin/contacts/${contactId}`);
  revalidatePath("/admin");
}

export async function deleteContact(id: string) {
  await requireAdmin();
  await db().delete(contacts).where(eq(contacts.id, id));
  redirect("/admin");
}

export async function addAdmin(fd: FormData) {
  const me = await requireAdmin();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/admin/team?e=bad");
  await db().insert(admins).values({ email, addedBy: me }).onConflictDoNothing();
  revalidatePath("/admin/team");
}

export async function removeAdmin(email: string) {
  const me = await requireAdmin();
  const [{ n }] = await db().select({ n: count() }).from(admins);
  if (email === me || n <= 1) redirect("/admin/team?e=last");
  await db().delete(admins).where(eq(admins.email, email));
  revalidatePath("/admin/team");
}
