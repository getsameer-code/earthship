import { asc } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { addAdmin, removeAdmin } from "../actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const me = await requireAdmin();
  const { e } = await searchParams;
  const rows = await db().select().from(admins).orderBy(asc(admins.createdAt));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Team</h1>
      <p className="mt-1 text-sm text-muted">Anyone listed here can sign in with that Google account and see all contacts.</p>
      {e === "last" && <p className="mt-4 text-sm text-red-600">You can&apos;t remove the last admin or yourself.</p>}
      {e === "bad" && <p className="mt-4 text-sm text-red-600">Enter a valid email address.</p>}

      <ul className="mt-6 space-y-2">
        {rows.map((a) => (
          <li key={a.email} className="flex items-center justify-between rounded-lg border border-line bg-card p-3 text-sm">
            <span>
              <span className="font-medium">{a.email}</span>
              {a.name && <span className="text-muted"> · {a.name}</span>}
              <span className="block text-xs text-muted">
                {a.lastLoginAt ? `last signed in ${a.lastLoginAt.toLocaleDateString("en-IN")}` : "hasn't signed in yet"}
                {a.addedBy ? ` · added by ${a.addedBy}` : ""}
              </span>
            </span>
            {a.email !== me && (
              <form action={removeAdmin.bind(null, a.email)}><button className="text-xs text-red-600 underline">Remove</button></form>
            )}
          </li>
        ))}
      </ul>

      <form action={addAdmin} className="mt-6 flex gap-2">
        <input name="email" type="email" required placeholder="teammate@gmail.com" className="input" />
        <button className="btn">Add</button>
      </form>
    </div>
  );
}
