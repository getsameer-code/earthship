import { SEGMENTS } from "@/lib/config";
import { requireAdmin } from "@/lib/auth";
import { createContact } from "../actions";

export default async function Page() {
  await requireAdmin();
  return (
    <form action={createContact} className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Add a contact</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Name</label><input name="name" required className="input" /></div>
        <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
        <div><label className="label">Phone</label><input name="phone" className="input" /></div>
        <div><label className="label">City</label><input name="city" className="input" /></div>
        <div>
          <label className="label">Segment</label>
          <select name="segment" className="input">{SEGMENTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
        </div>
        <div><label className="label">Owner (who follows up)</label><input name="owner" className="input" /></div>
        <div><label className="label">Source</label><input name="source" placeholder="e.g. referral from Anu" className="input" /></div>
        <div><label className="label">Tags (comma separated)</label><input name="tags" className="input" /></div>
      </div>
      <button className="btn">Create</button>
    </form>
  );
}
