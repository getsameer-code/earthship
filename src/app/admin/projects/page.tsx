import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { inrShort } from "@/lib/config";

export default async function Page() {
  await requireAdmin();
  const rows = await db().select().from(projects).orderBy(asc(projects.sortOrder), desc(projects.createdAt));
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Potential reserves</h1>
        <Link href="/admin/projects/new" className="btn">+ Add project</Link>
      </div>
      <p className="mb-4 text-sm text-muted">Published projects appear on the public home page, lowest order first.</p>
      <ul className="space-y-2">
        {rows.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/projects/${p.id}`} className="flex items-center gap-4 rounded-xl border border-line bg-card p-3 hover:border-accent">
              {p.hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/projects/${p.id}/image?v=${p.imageVersion}`} alt="" className="h-16 w-24 rounded-md object-cover" />
              ) : (
                <div className="h-16 w-24 rounded-md border border-dashed border-line" />
              )}
              <div className="flex-1">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-muted">
                  {[p.location, p.size, p.fundsNeededInr ? inrShort(p.fundsNeededInr) : null].filter(Boolean).join(" · ")}
                </div>
              </div>
              <span className={`text-xs ${p.published ? "text-accent" : "text-muted"}`}>{p.published ? "Published" : "Draft"}</span>
            </Link>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-muted">No projects yet.</li>}
      </ul>
    </div>
  );
}
