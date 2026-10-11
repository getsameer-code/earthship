"use client";

import { useActionState, useState } from "react";
import { INTERESTS, inr } from "@/lib/config";
import type { Tier } from "@/db/schema";
import { submitPledge, type PledgeState } from "./actions";

export default function PledgeForm({ tiers, defaultTier }: { tiers: Tier[]; defaultTier: string }) {
  const [state, action, pending] = useActionState<PledgeState, FormData>(submitPledge, {});
  const v = state.values ?? {};
  const [tier, setTier] = useState(v.tier ?? defaultTier);
  const custom = tiers.find((t) => t.id === tier && t.custom);

  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="label">I&apos;d like to pledge as</legend>
        {tiers.map((t) => (
          <label
            key={t.id}
            className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${tier === t.id ? "border-accent bg-card" : "border-line"}`}
          >
            <input
              type="radio"
              name="tier"
              value={t.id}
              checked={tier === t.id}
              onChange={() => setTier(t.id)}
              className="mt-1"
            />
            <span>
              <span className="font-semibold">
                {t.name} · {t.custom ? `from ${inr(t.amountInr)}` : inr(t.amountInr)}
              </span>
              <span className="block text-sm text-muted">{t.blurb}</span>
            </span>
          </label>
        ))}
        {custom && (
          <div>
            <label className="label" htmlFor="amount">Amount you have in mind (₹)</label>
            <input id="amount" name="amount" type="number" min={1000} step={1000} required
              defaultValue={v.amount ?? ""} className="input" />
          </div>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" name="name" required defaultValue={v.name} className="input" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required defaultValue={v.email} className="input" autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone / WhatsApp (optional)</label>
          <input id="phone" name="phone" defaultValue={v.phone} className="input" autoComplete="tel" />
        </div>
        <div>
          <label className="label" htmlFor="city">City (optional)</label>
          <input id="city" name="city" defaultValue={v.city} className="input" />
        </div>
      </div>

      <fieldset>
        <legend className="label">What excites you most? (optional)</legend>
        <div className="grid gap-1 sm:grid-cols-2">
          {INTERESTS.map((i) => (
            <label key={i.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="interests" value={i.id} /> {i.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="message">Anything you&apos;d like us to know? (optional)</label>
        <textarea id="message" name="message" rows={3} defaultValue={v.message} className="input" />
      </div>

      {/* honeypot */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>
          I understand this is a <strong>non-binding expression of intent</strong>. No payment is being
          collected now, and I&apos;m happy to be contacted about this project.
        </span>
      </label>

      {state.error && <p role="alert" className="rounded-lg border border-red-400 p-3 text-sm text-red-600">{state.error}</p>}

      <button className="btn" disabled={pending}>{pending ? "Sending…" : "Add my pledge"}</button>
    </form>
  );
}
