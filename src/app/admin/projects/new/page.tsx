import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import ProjectForm from "../ProjectForm";
import { createProject } from "../actions";

export default async function Page() {
  await requireAdmin();
  return (
    <div>
      <Link href="/admin/projects" className="text-sm text-muted">← Projects</Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">Add a project</h1>
      <ProjectForm action={createProject} />
    </div>
  );
}
