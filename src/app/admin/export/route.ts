import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contacts, pledges } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

const esc = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralise spreadsheet formulas
  return `"${s.replaceAll('"', '""')}"`;
};

export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const rows = await db()
    .select({ c: contacts, p: pledges })
    .from(contacts)
    .leftJoin(pledges, eq(pledges.contactId, contacts.id))
    .orderBy(desc(contacts.createdAt));

  const head = ["name","email","phone","city","status","segment","owner","tags","interests","next_follow_up","source","created_at","pledge_tier","pledge_amount_inr","pledge_withdrawn"];
  const lines = rows.map(({ c, p }) =>
    [c.name,c.email,c.phone,c.city,c.status,c.segment,c.owner,c.tags.join("; "),c.interests.join("; "),c.nextFollowUp,c.source,c.createdAt.toISOString(),p?.tier,p?.amountInr,p?.withdrawn].map(esc).join(","),
  );
  return new Response([head.join(","), ...lines].join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="earthship-contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
