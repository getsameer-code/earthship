import Link from "next/link";
import { and, desc, eq, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { contacts, pledges } from "@/db/schema";
import { SEGMENTS, STATUSES, inr, label } from "@/lib/config";

type SP = { status?: string; segment?: string; q?: string; due?: string; dup?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin(); // layouts render in parallel with pages; gate here too
  const sp = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  const where: SQL[] = [];
  if (STATUSES.some((s) => s.id === sp.status)) where.push(eq(contacts.status, sp.status!));
  if (SEGMENTS.some((s) => s.id === sp.segment)) where.push(eq(contacts.segment, sp.segment!));
  if (sp.due) where.push(lte(contacts.nextFollowUp, today));
  if (sp.q) {
    const q = `%${sp.q.replace(/[%_\\]/g, "\\$&")}%`;
    where.push(or(ilike(contacts.name, q), ilike(contacts.email, q), ilike(contacts.city, q), ilike(contacts.phone, q))!);
  }

  const pledged = sql<number>`coalesce(sum(${pledges.amountInr}) filter (where ${pledges.withdrawn} = false), 0)::int`;
  const rows = await db()
    .select({ c: contacts, pledged, pledgeCount: sql<number>`count(${pledges.id}) filter (where ${pledges.withdrawn} = false)::int` })
    .from(contacts)
    .leftJoin(pledges, eq(pledges.contactId, contacts.id))
    .where(and(...where))
    .groupBy(contacts.id)
    .orderBy(sql`${contacts.nextFollowUp} asc nulls last`, desc(contacts.createdAt))
    .limit(500);

  const [totals] = await db()
    .select({
      people: sql<number>`count(distinct ${pledges.contactId})::int`,
      amount: sql<number>`coalesce(sum(${pledges.amountInr}),0)::bigint`,
    })
    .from(pledges)
    .where(eq(pledges.withdrawn, false));
  const byStatus = await db()
    .select({ status: contacts.status, n: sql<number>`count(*)::int` })
    .from(contacts)
    .groupBy(contacts.status);
  const [due] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(contacts)
    .where(lte(contacts.nextFollowUp, today));

  const statusCount = Object.fromEntries(byStatus.map((s) => [s.status, s.n]));

  return (
    <div>
      {sp.dup && <p className="mb-4 rounded-lg border border-line p-3 text-sm">A contact with that email already exists.</p>}
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat k="People pledged" v={String(totals.people)} />
        <Stat k="Indicated (non-binding)" v={inr(Number(totals.amount))} />
        <Stat k="Total contacts" v={String(byStatus.reduce((a, s) => a + s.n, 0))} />
        <Link href="/admin?due=1"><Stat k="Follow-ups due" v={String(due.n)} /></Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin" className="btn-ghost">All</Link>
        {STATUSES.map((s) => (
          <Link key={s.id} href={`/admin?status=${s.id}`} className={`btn-ghost ${sp.status === s.id ? "border-accent" : ""}`}>
            {s.label} · {statusCount[s.id] ?? 0}
          </Link>
        ))}
      </div>

      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search name, email, city, phone" className="input max-w-xs" />
        <select name="segment" defaultValue={sp.segment ?? ""} className="input max-w-[12rem]">
          <option value="">All segments</option>
          {SEGMENTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <button className="btn-ghost">Filter</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr><th className="p-3">Name</th><th>City</th><th>Segment</th><th>Status</th><th>Pledged</th><th>Owner</th><th>Follow up</th></tr>
          </thead>
          <tbody>
            {rows.map(({ c, pledged: p, pledgeCount }) => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-background">
                <td className="p-3">
                  <Link href={`/admin/contacts/${c.id}`} className="font-medium underline-offset-2 hover:underline">{c.name}</Link>
                  <div className="text-xs text-muted">{c.email}</div>
                </td>
                <td>{c.city}</td>
                <td>{label(SEGMENTS, c.segment)}</td>
                <td>{label(STATUSES, c.status)}</td>
                <td>{pledgeCount ? `${inr(p)}${pledgeCount > 1 ? ` (${pledgeCount})` : ""}` : "—"}</td>
                <td>{c.owner}</td>
                <td className={c.nextFollowUp && c.nextFollowUp <= today ? "font-semibold text-red-600" : ""}>{c.nextFollowUp ?? ""}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted">Nothing here yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="text-xs text-muted">{k}</div>
      <div className="mt-1 text-2xl font-semibold">{v}</div>
    </div>
  );
}
