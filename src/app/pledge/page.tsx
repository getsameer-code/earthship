import type { Metadata } from "next";
import { BrandMark } from "@/components/Brand";
import { getTiers } from "@/lib/tiers";
import PledgeForm from "./PledgeForm";

export const metadata: Metadata = { title: "Pledge — EarthShip" };

export default async function Page({ searchParams }: { searchParams: Promise<{ tier?: string }> }) {
  const { tier } = await searchParams;
  const tiers = await getTiers();
  const start = tiers.find((t) => t.id === tier)?.id ?? tiers[0]?.id ?? "";
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12">
      <BrandMark />
      <h1 className="font-display font-bold mt-8 text-3xl">Add your pledge</h1>
      <p className="mb-8 mt-2 text-muted">
        We&apos;re gathering early commitments before anything is bought. Pledging tells us how much
        support exists; nobody is charged now. We&apos;ll be in touch personally.
      </p>
      {tiers.length ? (
        <PledgeForm tiers={tiers} defaultTier={start} />
      ) : (
        <p className="rounded-lg border border-line p-4 text-sm text-muted">Pledging isn&apos;t open just yet. Please check back soon.</p>
      )}
    </main>
  );
}
