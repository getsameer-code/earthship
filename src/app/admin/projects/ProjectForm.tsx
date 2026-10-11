"use client";

import { useActionState } from "react";
import ImageInput from "@/components/ImageInput";
import type { FormState } from "./actions";

type P = {
  name?: string; location?: string | null; size?: string | null; condition?: string | null;
  fundsNeededInr?: number | null; poc?: string | null; showPoc?: boolean; published?: boolean;
  sortOrder?: number; imageSrc?: string | null;
};

export default function ProjectForm({
  action,
  initial = {},
}: {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  initial?: P;
}) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <F l="Name"><input name="name" required defaultValue={initial.name} className="input" /></F>
        <F l="Location"><input name="location" defaultValue={initial.location ?? ""} placeholder="e.g. near Coorg, Karnataka" className="input" /></F>
        <F l="Size"><input name="size" defaultValue={initial.size ?? ""} placeholder="e.g. 12 acres" className="input" /></F>
        <F l="Funds needed (₹)"><input name="fundsNeeded" inputMode="numeric" defaultValue={initial.fundsNeededInr ?? ""} placeholder="e.g. 15000000" className="input" /></F>
      </div>
      <F l="Current condition / description">
        <textarea name="condition" rows={5} defaultValue={initial.condition ?? ""} className="input" />
      </F>
      <F l="Point of contact (name, phone, email)">
        <input name="poc" defaultValue={initial.poc ?? ""} className="input" />
      </F>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="showPoc" defaultChecked={initial.showPoc} /> Show point of contact on the public page
      </label>
      <F l="Photo"><ImageInput name="image" currentSrc={initial.imageSrc} /></F>
      {initial.imageSrc && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="removeImage" /> Remove current photo
        </label>
      )}
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={initial.published} /> Published (visible on the home page)
        </label>
        <label className="flex items-center gap-2 text-sm">
          Order <input name="sortOrder" type="number" defaultValue={initial.sortOrder ?? 0} className="input !w-20" />
        </label>
      </div>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <div><label className="label">{l}</label>{children}</div>;
}
