import Link from "next/link";
import { BrandMark } from "@/components/Brand";
import { endSession, requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "CRM — EarthShip", robots: { index: false } };

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  async function logout() {
    "use server";
    await endSession();
    redirect("/login");
  }
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6">
      <header className="mb-6 flex items-center justify-between border-b border-line pb-4">
        <nav className="flex items-center gap-5 text-sm">
          <BrandMark size={32} /><Link href="/admin" className="font-semibold">CRM</Link>
          <Link href="/admin/new" className="text-muted">+ Add contact</Link>
          <Link href="/admin/projects" className="text-muted">Projects</Link>
          <Link href="/admin/team" className="text-muted">Team</Link>
          <Link href="/admin/export" className="text-muted" prefetch={false}>Export CSV</Link>
          <Link href="/" className="text-muted">Public site</Link>
        </nav>
        <form action={logout}><button className="text-sm text-muted">Sign out</button></form>
      </header>
      {children}
    </div>
  );
}
