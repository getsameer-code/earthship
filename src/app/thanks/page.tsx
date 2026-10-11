import Link from "next/link";
import { BrandMark } from "@/components/Brand";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-xl px-5 py-24 text-center">
      <div className="mb-8 flex justify-center"><BrandMark size={56} /></div>
      <h1 className="font-display font-bold text-3xl">Thank you 🌱</h1>
      <p className="mt-4 text-muted">
        Your pledge is in. Nothing has been charged. Someone from the team will write to you
        personally, and you&apos;ll hear as the first reserve takes shape.
      </p>
      <Link href="/" className="btn-ghost mt-8">Back to home</Link>
    </main>
  );
}
