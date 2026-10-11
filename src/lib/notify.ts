import { db } from "@/db";
import { admins } from "@/db/schema";
import { inr, label, INTERESTS } from "@/lib/config";

type PledgeInfo = {
  contactId: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  tierName: string;
  amountInr: number;
  interests: string[];
  message?: string;
};

const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

/**
 * Emails every admin about a new pledge, via Resend. Never throws: a failed
 * notification must not break a pledge. No-ops if RESEND_API_KEY isn't set.
 */
export async function notifyNewPledge(p: PledgeInfo) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const recipients = [
      ...new Set([
        ...(await db().select({ email: admins.email }).from(admins)).map((a) => a.email),
        ...(process.env.NOTIFY_EMAILS?.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean) ?? []),
      ]),
    ];
    const site = process.env.SITE_URL ?? "https://earthship.vercel.app";
    const lines: (string | false | undefined)[] = [
      `${oneLine(p.name)} just pledged ${inr(p.amountInr)} (${oneLine(p.tierName)}).`,
      "",
      `Email: ${p.email}`,
      p.phone && `Phone: ${p.phone}`,
      p.city && `City: ${p.city}`,
      p.interests.length ? `Interested in: ${p.interests.map((i) => label(INTERESTS, i)).join(", ")}` : false,
      p.message && `\nMessage:\n${p.message}`,
      "",
      `Open in CRM: ${site}/admin/contacts/${p.contactId}`,
      "",
      "This is a non-binding pledge; no money has been collected.",
    ];
    const text = lines.filter((l): l is string => typeof l === "string").join("\n");

    // One email per recipient so one rejected address can't block the rest.
    const results = await Promise.allSettled(
      recipients.map(async (to) => {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM ?? "EarthShip <onboarding@resend.dev>",
            to: [to],
            reply_to: p.email,
            subject: `New pledge: ${oneLine(p.name)} · ${inr(p.amountInr)}`,
            text,
          }),
        });
        if (!r.ok) throw new Error(`${to}: ${r.status} ${await r.text()}`);
      }),
    );
    for (const r of results) if (r.status === "rejected") console.error("pledge email failed", r.reason);
  } catch (e) {
    console.error("pledge notification failed", e);
  }
}
