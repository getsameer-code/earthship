import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { admins } from "@/db/schema";

const COOKIE = "es_admin";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days
const PASSWORD_USER = "(password)";

export const googleConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const siteOrigin = (req: Request) => process.env.SITE_URL ?? new URL(req.url).origin;

function sign(payload: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SECRET must be set (16+ chars)");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Fallback only: works until Google SSO is configured, then switches itself off. */
export function checkPassword(input: string) {
  if (googleConfigured()) return false;
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 8) return false;
  return safeEqual(sign("pw:" + input), sign("pw:" + pw));
}

export async function startSession(email: string) {
  const exp = Date.now() + MAX_AGE * 1000;
  const who = Buffer.from(email).toString("base64url");
  const payload = `${exp}.${who}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** Returns the signed-in admin's email, or null. Re-checks the allowlist on every call. */
export async function currentAdmin(): Promise<string | null> {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return null;
  const [exp, who, sig] = v.split(".");
  if (!exp || !who || !sig || Number(exp) < Date.now()) return null;
  if (!safeEqual(sig, sign(`${exp}.${who}`))) return null;
  const email = Buffer.from(who, "base64url").toString();
  if (email === PASSWORD_USER) return googleConfigured() ? null : email;
  const [row] = await db().select({ email: admins.email }).from(admins).where(eq(admins.email, email));
  return row?.email ?? null;
}

export const isAdmin = async () => (await currentAdmin()) !== null;

export const passwordUser = PASSWORD_USER;

/** Call at the top of every admin page, route handler and server action. */
export async function requireAdmin() {
  const email = await currentAdmin();
  if (!email) redirect("/login");
  return email;
}
