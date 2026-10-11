"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { projectImages, projects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { processImage } from "@/lib/projects";

const text = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s || null;
};

function fields(fd: FormData) {
  const name = text(fd.get("name"));
  if (!name) return { error: "Name is required" } as const;
  // accept "1,50,00,000", "15000000", "₹ 1.5" etc.
  const raw = String(fd.get("fundsNeeded") ?? "").replace(/[^\d]/g, "");
  const funds = raw ? Number(raw) : null;
  if (funds !== null && funds > 1e12) return { error: "Funds amount looks too large" } as const;
  const sort = Number.parseInt(String(fd.get("sortOrder") ?? "0"), 10);
  return {
    values: {
      name,
      location: text(fd.get("location")),
      size: text(fd.get("size")),
      condition: text(fd.get("condition")),
      fundsNeededInr: funds,
      poc: text(fd.get("poc")),
      showPoc: fd.get("showPoc") === "on",
      published: fd.get("published") === "on",
      sortOrder: Number.isFinite(sort) ? sort : 0,
    },
  } as const;
}

async function saveImage(id: string, fd: FormData): Promise<string | null> {
  const file = fd.get("image");
  if (fd.get("removeImage") === "on") {
    await db().delete(projectImages).where(eq(projectImages.projectId, id));
    await db().update(projects).set({ hasImage: false, imageVersion: sql`${projects.imageVersion} + 1` }).where(eq(projects.id, id));
    return null;
  }
  if (!(file instanceof File) || file.size === 0) return null;
  const img = await processImage(file);
  if ("error" in img) return img.error;
  await db()
    .insert(projectImages)
    .values({ projectId: id, contentType: "image/jpeg", dataBase64: img.b64 })
    .onConflictDoUpdate({ target: projectImages.projectId, set: { contentType: "image/jpeg", dataBase64: img.b64 } });
  await db().update(projects).set({ hasImage: true, imageVersion: sql`${projects.imageVersion} + 1` }).where(eq(projects.id, id));
  return null;
}

const refresh = () => {
  revalidatePath("/");
  revalidatePath("/admin/projects");
};

export type FormState = { error?: string };

export async function createProject(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const f = fields(fd);
  if ("error" in f) return { error: f.error };
  const [p] = await db().insert(projects).values(f.values).returning({ id: projects.id });
  const imgErr = await saveImage(p.id, fd);
  refresh();
  redirect(imgErr ? `/admin/projects/${p.id}?e=${encodeURIComponent(imgErr)}` : "/admin/projects");
}

export async function updateProject(id: string, _: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const f = fields(fd);
  if ("error" in f) return { error: f.error };
  await db().update(projects).set({ ...f.values, updatedAt: new Date() }).where(eq(projects.id, id));
  const imgErr = await saveImage(id, fd);
  refresh();
  if (imgErr) return { error: `Saved, but the image wasn't updated: ${imgErr}` };
  redirect("/admin/projects");
}

export async function deleteProject(id: string) {
  await requireAdmin();
  await db().delete(projects).where(eq(projects.id, id));
  refresh();
  redirect("/admin/projects");
}
