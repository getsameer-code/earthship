import { redirect } from "next/navigation";
import { BrandMark } from "@/components/Brand";
import { checkPassword, googleConfigured, isAdmin, passwordUser, startSession } from "@/lib/auth";

export const metadata = { title: "Team login — EarthShip", robots: { index: false } };

const ERRORS: Record<string, string> = {
  denied: "That Google account isn't on the team list. Ask an existing admin to add you.",
  unverified: "Google says that email address isn't verified.",
  state: "Sign-in expired or was interrupted. Please try again.",
  google: "Google sign-in failed. Please try again.",
  nosso: "Google sign-in isn't set up yet.",
  "1": "Wrong password.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { e } = await searchParams;
  const sso = googleConfigured();

  async function login(fd: FormData) {
    "use server";
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    if (!checkPassword(String(fd.get("password") ?? ""))) redirect("/login?e=1");
    await startSession(passwordUser);
    redirect("/admin");
  }

  return (
    <main className="mx-auto w-full max-w-sm px-5 py-24">
      <BrandMark />
      <h1 className="mt-8 text-2xl font-semibold">Team login</h1>
      {e && <p className="mt-4 text-sm text-red-600">{ERRORS[e] ?? "Sign-in failed."}</p>}
      {sso ? (
        <a href="/api/auth/google" className="btn mt-6">Sign in with Google</a>
      ) : (
        <form action={login} className="mt-6 space-y-4">
          <p className="text-xs text-muted">Temporary password login, until Google sign-in is configured.</p>
          <input name="password" type="password" required autoFocus className="input" placeholder="Password" />
          <button className="btn">Sign in</button>
        </form>
      )}
    </main>
  );
}
