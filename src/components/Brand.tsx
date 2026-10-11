import Image from "next/image";
import Link from "next/link";

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <Link href="/" aria-label="EarthShip home" className="inline-flex items-center gap-2">
      <Image src="/logo-mark.png" alt="" width={size} height={size} className="logo-tile" />
      <span className="font-serif text-lg font-semibold text-brand">EarthShip</span>
    </Link>
  );
}
