import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { contacts, interactions, pledges } from "@/db/schema";
import { INTERACTION_TYPES, INTERESTS, SEGMENTS, STATUSES, inr, label } from "@/lib/config";
import { getTiers, pledgeTierName } from "@/lib/tiers";
import { addInteraction, addPledge, deleteContact, toggleWithdrawn, updateContact } from "../../actions";

const UUID = /^[0-9a-f-]{36}$/i;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [c] = await db().select().from(contacts).where(eq(contacts.id, id));
  if (!c) notFound();
  const ps = await db().select().from(pledges).where(eq(pledges.contactId, id)).orderBy(desc(pledges.createdAt));
  const allTiers = await getTiers({ all: true });
  const log = await db().select().from(interactions).where(eq(interactions.contactId, id)).orderBy(desc(interactions.createdAt));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <Link href="/admin" className="text-sm text-muted">← All contacts</Link>
        <h1 className="mt-2 text-2xl font-semibold">{c.name}</h1>
        <p className="text-sm text-muted">
          <a href={`mailto:${c.email}`} className="underline">{c.email}</a>
          {c.phone && <> · <a href={`tel:${c.phone}`} className="underline">{c.phone}</a></>}
          {" · "}added {c.createdAt.toLocaleDateString("en-IN")} via {c.source}
        </p>
        {c.interests.length > 0 && (
          <p className="mt-2 text-sm">Interested in: {c.interests.map((i) => label(INTERESTS, i)).join(", ")}</p>
        )}

        <form action={updateContact.bind(null, id)} className="mt-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <F l="Name"><input name="name" defaultValue={c.name} className="input" required /></F>
            <F l="Phone"><input name="phone" defaultValue={c.phone ?? ""} className="input" /></F>
            <F l="City"><input name="city" defaultValue={c.city ?? ""} className="input" /></F>
            <F l="Owner"><input name="owner" defaultValue={c.owner ?? ""} className="input" /></F>
            <F l="Status">
              <select name="status" defaultValue={c.status} className="input">{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
            </F>
            <F l="Segment">
              <select name="segment" defaultValue={c.segment} className="input">{SEGMENTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
            </F>
            <F l="Next follow-up"><input name="nextFollowUp" type="date" defaultValue={c.nextFollowUp ?? ""} className="input" /></F>
            <F l="Tags (comma separated)"><input name="tags" defaultValue={c.tags.join(", ")} className="input" /></F>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="okToContact" defaultChecked={c.okToContact} /> OK to contact
          </label>
          <button className="btn">Save</button>
        </form>

        <h2 className="mb-2 mt-10 font-semibold">Pledges</h2>
        <ul className="space-y-2 text-sm">
          {ps.map((p) => (
            <li key={p.id} className="rounded-lg border border-line bg-card p-3">
              <div className={`flex justify-between ${p.withdrawn ? "text-muted line-through" : ""}`}>
                <span>{pledgeTierName(p)} · {inr(p.amountInr)}</span>
                <span className="text-muted">{p.createdAt.toLocaleDateString("en-IN")}</span>
              </div>
              {p.message && <p className="mt-1 text-muted">“{p.message}”</p>}
              <form action={toggleWithdrawn.bind(null, id, p.id, !p.withdrawn)} className="mt-1">
                <button className="text-xs text-muted underline">{p.withdrawn ? "Reinstate" : "Mark withdrawn"}</button>
              </form>
            </li>
          ))}
          {ps.length === 0 && <li className="text-muted">No pledges yet.</li>}
        </ul>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-muted">Record a pledge (e.g. from a conversation)</summary>
          <form action={addPledge.bind(null, id)} className="mt-2 space-y-2">
            <select name="tier" className="input">{allTiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <input name="amount" type="number" min={1} placeholder="Amount ₹" required className="input" />
            <input name="message" placeholder="Note (optional)" className="input" />
            <button className="btn-ghost">Add pledge</button>
          </form>
        </details>

        <form action={deleteContact.bind(null, id)} className="mt-10">
          <button className="text-xs text-red-600 underline">Delete contact permanently</button>
        </form>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Conversation log</h2>
        <form action={addInteraction.bind(null, id)} className="mb-5 space-y-2">
          <div className="flex gap-2">
            <select name="type" className="input max-w-[9rem]">{INTERACTION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
            <button className="btn ml-auto">Log</button>
          </div>
          <textarea name="body" rows={3} required placeholder="What was discussed? Next step?" className="input" />
        </form>
        <ul className="space-y-3">
          {log.map((i) => (
            <li key={i.id} className="rounded-lg border border-line bg-card p-3 text-sm">
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span className="font-semibold uppercase">{label(INTERACTION_TYPES, i.type)}</span>
                <span>{i.createdAt.toLocaleString("en-IN")}</span>
              </div>
              <p className="whitespace-pre-wrap">{i.body}</p>
            </li>
          ))}
          {log.length === 0 && <li className="text-sm text-muted">Nothing logged yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <div><label className="label">{l}</label>{children}</div>;
}
