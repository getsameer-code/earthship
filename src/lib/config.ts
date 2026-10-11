// Edit these freely. Amounts are PLACEHOLDERS - decide real numbers with your trustees.
export const SITE = {
  name: "EarthShip",
  tagline: "A crowdsourced set of private nature reserves, held in trust for the long term.",
};

export const TIERS = [
  {
    id: "annual",
    name: "Annual member",
    amountInr: 5000,
    blurb: "Renews each year. The easiest way to be part of it from day one.",
  },
  {
    id: "five_year",
    name: "5-year member",
    amountInr: 20000,
    blurb: "A five-year commitment at a lower yearly cost.",
  },
  {
    id: "lifetime",
    name: "Lifetime member",
    amountInr: 100000,
    blurb: "One contribution, membership for life.",
  },
  {
    id: "patron",
    name: "Patron",
    amountInr: 500000,
    blurb: "For those who want to seed land acquisition. Amount is yours to name.",
    custom: true,
  },
] as const;

export type TierId = (typeof TIERS)[number]["id"];
export const TIER_IDS = TIERS.map((t) => t.id) as [TierId, ...TierId[]];

export const INTERESTS = [
  { id: "conservation", label: "Conservation & restoration" },
  { id: "trails", label: "Nature trails" },
  { id: "camping", label: "Campsite" },
  { id: "experience", label: "Interpretation centre / education" },
  { id: "volunteer", label: "Volunteering" },
  { id: "land", label: "I know of land that could work" },
] as const;

export const STATUSES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "in_conversation", label: "In conversation" },
  { id: "committed", label: "Committed" },
  { id: "not_now", label: "Not now" },
  { id: "declined", label: "Declined" },
] as const;

export const SEGMENTS = [
  { id: "friend", label: "Friend / network" },
  { id: "philanthropist", label: "Philanthropist" },
  { id: "other", label: "Other" },
] as const;

export const INTERACTION_TYPES = [
  { id: "note", label: "Note" },
  { id: "call", label: "Call" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
  { id: "meeting", label: "Meeting" },
] as const;

export const label = (list: readonly { id: string; label?: string; name?: string }[], id: string) => {
  const hit = list.find((x) => x.id === id);
  return hit?.label ?? hit?.name ?? id;
};

export const inr = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(n);

/** Compact rupee amounts for cards: ₹1.5 crore, ₹40 lakh. */
export const inrShort = (n: number) => {
  const trim = (x: number) => String(Math.round(x * 100) / 100);
  if (n >= 1e7) return `₹${trim(n / 1e7)} crore`;
  if (n >= 1e5) return `₹${trim(n / 1e5)} lakh`;
  return inr(n);
};
