import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projectImages, projects } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const [row] = await db()
    .select({ published: projects.published, type: projectImages.contentType, data: projectImages.dataBase64 })
    .from(projectImages)
    .innerJoin(projects, eq(projects.id, projectImages.projectId))
    .where(eq(projectImages.projectId, id));
  // Drafts' photos are only visible to admins.
  if (!row || (!row.published && !(await isAdmin()))) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(row.data, "base64"), {
    headers: {
      "content-type": row.type,
      // URL carries ?v=<imageVersion>, so a changed photo is a new URL
      "cache-control": row.published ? "public, max-age=31536000, immutable" : "private, no-store",
    },
  });
}
