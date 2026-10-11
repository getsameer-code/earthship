import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { googleConfigured, siteOrigin } from "@/lib/auth";

export async function GET(req: Request) {
  if (!googleConfigured()) return NextResponse.redirect(new URL("/login?e=nosso", req.url));

  const state = randomBytes(16).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${siteOrigin(req)}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const res = NextResponse.redirect(url);
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: 600, path: "/api/auth/google" };
  res.cookies.set("es_oauth_state", state, opts);
  res.cookies.set("es_oauth_verifier", verifier, opts);
  return res;
}
