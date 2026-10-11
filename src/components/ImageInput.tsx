"use client";

import { useRef, useState } from "react";

const MAX = 1600;

/** File picker that shrinks big phone photos in the browser before upload. */
export default function ImageInput({ name, currentSrc }: { name: string; currentSrc?: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentSrc ?? null);
  const [note, setNote] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNote("");
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * scale);
      c.height = Math.round(bmp.height * scale);
      c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
      if (blob) {
        const dt = new DataTransfer();
        dt.items.add(new File([blob], "photo.jpg", { type: "image/jpeg" }));
        if (input.current) input.current.files = dt.files;
        setPreview(URL.createObjectURL(blob));
        return;
      }
    } catch {
      /* fall through: upload the original and let the server handle it */
    }
    setPreview(URL.createObjectURL(file));
    setNote("Couldn't shrink this photo in the browser; uploading as is.");
  }

  return (
    <div>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="mb-2 h-40 w-full max-w-sm rounded-lg border border-line object-cover" />
      )}
      <input ref={input} name={name} type="file" accept="image/*" onChange={onChange} className="text-sm" />
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}
