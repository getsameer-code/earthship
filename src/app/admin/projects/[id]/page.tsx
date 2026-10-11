import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import ProjectForm from "../ProjectForm";
import { deleteProject, updateProject } from "../actions";

const UUID = /^[0-9a-f-]{36}$/i;

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ e?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { e } = await searchParams;
  if (!UUID.test(id)) notFound();
  const [p] = await db().select().from(projects).where(eq(projects.id, id));
  if (!p) notFound();
  return (
    <div>
      <Link href="/admin/projects" className="text-sm text-muted">← Projects</Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">{p.name}</h1>
      {e && <p className="mb-4 text-sm text-red-600">Project saved, but the image wasn&apos;t: {e}</p>}
      <ProjectForm
        action={updateProject.bind(null, id)}
        initial={{ ...p, imageSrc: p.hasImage ? `/projects/${p.id}/image?v=${p.imageVersion}` : null }}
      />
      <form action={deleteProject.bind(null, id)} className="mt-10">
        <button className="text-xs text-red-600 underline">Delete project permanently</button>
      </form>
    </div>
  );
}
