import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { googleConfigured, siteOrigin, startSession } from "@/lib/auth";

const fail = (req: Request, code: string) => {
  const res = NextResponse.redirect(new URL(`/login?e=${code}`, siteOrigin(req)));
  res.cookies.delete("es_oauth_state");
  res.cookies.delete("es_oauth_verifier");
  return res;
};

export async function GET(req: Request) {
  if (!googleConfigured()) return fail(req, "nosso");
  const url = new URL(req.url);
  const cookie = (n: string) => req.headers.get("cookie")?.split(/;\s*/).find((c) => c.startsWith(n + "="))?.slice(n.length + 1);
  const state = cookie("es_oauth_state");
  const verifier = cookie("es_oauth_verifier");
  const code = url.searchParams.get("code");
  if (!code || !state || !verifier || state !== url.searchParams.get("state")) return fail(req, "state");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${siteOrigin(req)}/api/auth/google/callback`,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) return fail(req, "google");
  const { id_token } = (await tokenRes.json()) as { id_token?: string };
  if (!id_token) return fail(req, "google");

  // The ID token came straight from Google's token endpoint over TLS, so we check its claims
  // rather than re-verifying the signature (permitted by OIDC Core §3.1.3.7).
  const claims = JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString()) as {
    iss: string; aud: string; exp: number; email?: string; email_verified?: boolean; name?: string;
  };
  const okIssuer = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  if (!okIssuer || claims.aud !== process.env.GOOGLE_CLIENT_ID || claims.exp * 1000 < Date.now()) return fail(req, "google");
  if (!claims.email || claims.email_verified !== true) return fail(req, "unverified");

  const email = claims.email.toLowerCase();
  const [admin] = await db().select().from(admins).where(eq(admins.email, email));
  if (!admin) return fail(req, "denied");

  await db().update(admins).set({ lastLoginAt: new Date(), name: claims.name ?? admin.name }).where(eq(admins.email, email));
  await startSession(email);
  const res = NextResponse.redirect(new URL("/admin", siteOrigin(req)));
  res.cookies.delete("es_oauth_state");
  res.cookies.delete("es_oauth_verifier");
  return res;
}
