"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { contacts, pledges } from "@/db/schema";
import { INTERESTS, TIER_IDS, TIERS } from "@/lib/config";
import { sql } from "drizzle-orm";
import { notifyNewPledge } from "@/lib/notify";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.email("Please enter a valid email").max(200).transform((e) => e.toLowerCase()),
  phone: z.string().trim().max(30).optional(),
  city: z.string().trim().max(80).optional(),
  tier: z.enum(TIER_IDS),
  amount: z.coerce.number().int().min(1000, "Amount looks too low").max(1_000_000_000),
  message: z.string().trim().max(2000).optional(),
  interests: z.array(z.string()).default([]),
  consent: z.literal("on", "Please tick the box so we can get in touch"),
});

export type PledgeState = { error?: string; values?: Record<string, string> };

export async function submitPledge(_prev: PledgeState, fd: FormData): Promise<PledgeState> {
  // Honeypot: bots fill the hidden field. Pretend success.
  if (fd.get("website")) redirect("/thanks");

  const values = Object.fromEntries(
    [...fd.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );

  const tierId = String(fd.get("tier") ?? "");
  const tier = TIERS.find((t) => t.id === tierId);
  const parsed = schema.safeParse({
    name: fd.get("name"),
    email: fd.get("email"),
    phone: fd.get("phone") || undefined,
    city: fd.get("city") || undefined,
    tier: tierId,
    amount: "custom" in (tier ?? {}) ? fd.get("amount") : tier?.amountInr,
    message: fd.get("message") || undefined,
    interests: fd.getAll("interests").map(String),
    consent: fd.get("consent"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const d = parsed.data;
  const interests = d.interests.filter((i) => INTERESTS.some((x) => x.id === i));

  try {
    const [c] = await db()
      .insert(contacts)
      .values({ name: d.name, email: d.email, phone: d.phone, city: d.city, interests, source: "website" })
      .onConflictDoUpdate({
        target: contacts.email,
        set: {
          // keep what we already know; fill gaps; merge interests
          phone: sql`coalesce(${contacts.phone}, excluded.phone)`,
          city: sql`coalesce(${contacts.city}, excluded.city)`,
          interests: sql`(select coalesce(array_agg(distinct x), '{}') from unnest(${contacts.interests} || excluded.interests) x)`,
          okToContact: true,
          updatedAt: new Date(),
        },
      })
      .returning({ id: contacts.id });

    await db().insert(pledges).values({
      contactId: c.id,
      tier: d.tier,
      amountInr: d.amount,
      message: d.message,
    });

    after(() =>
      notifyNewPledge({
        contactId: c.id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        city: d.city,
        tier: d.tier,
        amountInr: d.amount,
        interests,
        message: d.message,
      }),
    );
  } catch (e) {
    console.error("pledge failed", e);
    return { error: "Something went wrong on our side. Please try again in a moment.", values };
  }

  redirect("/thanks");
}
