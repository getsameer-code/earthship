import Image from "next/image";
import Link from "next/link";
import { asc, count, desc, sum, eq } from "drizzle-orm";
import { db } from "@/db";
import { pledges, projects } from "@/db/schema";
import { TIERS, inr, inrShort } from "@/lib/config";

export const revalidate = 300;

async function stats() {
  try {
    const [r] = await db()
      .select({ n: count(), total: sum(pledges.amountInr) })
      .from(pledges)
      .where(eq(pledges.withdrawn, false));
    return { n: r.n, total: Number(r.total ?? 0) };
  } catch {
    return null;
  }
}

async function listProjects() {
  try {
    return await db()
      .select()
      .from(projects)
      .where(eq(projects.published, true))
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt));
  } catch {
    return [];
  }
}

const PILLARS = [
  ["Conservation", "Land set aside and restored, protected for the long term rather than developed."],
  ["Nature trails", "Walkable, low-impact trails so members can actually be in the places they protect."],
  ["Experience centres", "Small centres for learning, workshops and school visits."],
  ["Campsites", "A small campsite in each reserve: simple, quiet, and for members."],
];

export default async function Home() {
  const [s, reserves] = await Promise.all([stats(), listProjects()]);
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-16">
      <div className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">EarthShip</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
            Private nature reserves, owned together and held in trust.
          </h1>
          <p className="mt-5 text-lg text-muted">
            Many people contributing a little makes land possible that none of us could protect alone.
            Each reserve will combine conservation, trails, an experience centre and a small campsite.
            All land will be held in a charitable trust, not by any individual.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/pledge" className="btn">Add your pledge</Link>
            {s && s.n >= 10 && (
              <span className="text-sm text-muted">{s.n} pledges so far · {inr(s.total)} indicated</span>
            )}
          </div>
        </div>
        <Image src="/logo.jpg" alt="EarthShip logo: palms and acacia trees by the water" width={720} height={720}
          priority className="logo-tile mx-auto w-full max-w-sm" />
      </div>

      <section className="mt-20 grid gap-5 sm:grid-cols-2">
        {PILLARS.map(([t, d]) => (
          <div key={t} className="rounded-xl border border-line bg-card p-5">
            <h2 className="font-semibold">{t}</h2>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>

      {reserves.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-semibold">Potential reserves</h2>
          <p className="mt-2 text-muted">Places we&apos;re looking at. Nothing is bought until enough support is in place.</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {reserves.map((r) => (
              <article key={r.id} className="overflow-hidden rounded-xl border border-line bg-card">
                {r.hasImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/projects/${r.id}/image?v=${r.imageVersion}`}
                    alt={r.name}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{r.name}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {[r.location, r.size].filter(Boolean).join(" · ")}
                  </p>
                  {r.condition && <p className="mt-3 whitespace-pre-line text-sm">{r.condition}</p>}
                  <dl className="mt-4 space-y-1 text-sm">
                    {r.fundsNeededInr != null && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Funds needed</dt>
                        <dd className="font-semibold">{inrShort(r.fundsNeededInr)}</dd>
                      </div>
                    )}
                    {r.showPoc && r.poc && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Contact</dt>
                        <dd className="text-right">{r.poc}</dd>
                      </div>
                    )}
                  </dl>
                  <Link href="/pledge" className="btn-ghost mt-4">Pledge your support</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-20">
        <h2 className="text-2xl font-semibold">Membership</h2>
        <p className="mt-2 text-muted">Indicative tiers. Final terms will be set once the trust is formed.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => (
            <Link key={t.id} href={`/pledge?tier=${t.id}`} className="rounded-xl border border-line bg-card p-5 hover:border-accent">
              <div className="font-semibold">{t.name}</div>
              <div className="mt-1 text-xl">{"custom" in t ? "from " : ""}{inr(t.amountInr)}</div>
              <p className="mt-2 text-sm text-muted">{t.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-20 rounded-xl border border-line p-6 text-sm text-muted">
        <h2 className="mb-2 font-semibold text-foreground">How this works right now</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>You pledge. It&apos;s a non-binding statement of intent and no money is collected.</li>
          <li>We form the trust and identify the first reserve.</li>
          <li>Pledgers are invited, with full details and legal terms, to convert to membership.</li>
        </ol>
      </section>

      <footer className="mt-16 flex justify-between text-xs text-muted">
        <span>© EarthShip</span>
        <Link href="/admin">Team</Link>
      </footer>
    </main>
  );
}
