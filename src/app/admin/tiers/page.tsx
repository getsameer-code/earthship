import { count } from "drizzle-orm";
import { db } from "@/db";
import { pledges } from "@/db/schema";
import ConfirmButton from "@/components/ConfirmButton";
import { requireAdmin } from "@/lib/auth";
import { getTiers } from "@/lib/tiers";
import { createTier, deleteTier, updateTier } from "./actions";

export default async function Page() {
  await requireAdmin();
  const [list, counts] = await Promise.all([
    getTiers({ all: true }),
    db().select({ tier: pledges.tier, n: count() }).from(pledges).groupBy(pledges.tier).catch(() => []),
  ]);
  const used = Object.fromEntries(counts.map((c) => [c.tier, c.n]));

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Membership tiers</h1>
      <p className="mt-1 text-sm text-muted">
        These appear on the home page and the pledge form. Changing a price never alters existing pledges. Deleting a tier
        keeps its past pledges, with the name and amount they were made under.
      </p>

      <div className="mt-6 space-y-4">
        {list.map((t) => (
          <form key={t.id} action={updateTier.bind(null, t.id)} className="rounded-xl border border-line bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_5rem]">
              <F l="Name"><input name="name" required defaultValue={t.name} className="input" /></F>
              <F l={t.custom ? "From amount (₹)" : "Amount (₹)"}><input name="amount" inputMode="numeric" required defaultValue={t.amountInr} className="input" /></F>
              <F l="Order"><input name="sortOrder" type="number" defaultValue={t.sortOrder} className="input" /></F>
            </div>
            <div className="mt-3"><F l="Description"><textarea name="blurb" rows={2} defaultValue={t.blurb} className="input" /></F></div>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="custom" defaultChecked={t.custom} /> Pledger names their own amount</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={t.published} /> Visible on the site</label>
              <span className="text-xs text-muted">{used[t.id] ?? 0} pledge{(used[t.id] ?? 0) === 1 ? "" : "s"}</span>
              <span className="ml-auto flex items-center gap-4">
                <ConfirmButton
                  formAction={deleteTier.bind(null, t.id)}
                  message={`Delete “${t.name}”? Existing pledges keep their name and amount.`}
                  className="text-xs text-red-600 underline"
                >
                  Delete
                </ConfirmButton>
                <button className="btn">Save</button>
              </span>
            </div>
          </form>
        ))}
        {list.length === 0 && <p className="text-sm text-muted">No tiers yet. Add one below. Until you do, the pledge form is closed.</p>}
      </div>

      <h2 className="mb-2 mt-10 font-semibold">Add a tier</h2>
      <form action={createTier} className="rounded-xl border border-dashed border-line p-4">
        <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_5rem]">
          <F l="Name"><input name="name" required className="input" /></F>
          <F l="Amount (₹)"><input name="amount" inputMode="numeric" required className="input" /></F>
          <F l="Order"><input name="sortOrder" type="number" defaultValue={list.length} className="input" /></F>
        </div>
        <div className="mt-3"><F l="Description"><textarea name="blurb" rows={2} className="input" /></F></div>
        <div className="mt-3 flex flex-wrap items-center gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="custom" /> Pledger names their own amount</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked /> Visible on the site</label>
          <button className="btn ml-auto">Add tier</button>
        </div>
      </form>
    </div>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <div><label className="label">{l}</label>{children}</div>;
}
