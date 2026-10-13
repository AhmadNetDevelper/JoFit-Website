import Image from "next/image";

import type { MediaImage } from "@/types";

/**
 * The company's mark in a square: the uploaded logo, CONTAINED (never cropped
 * — cutting the end off a wordmark is the one thing a logo slot must not do),
 * or, until there is one, the name's first letter on the brand tint so the
 * slot never reads as a broken image.
 */
export function CompanyLogo({
  name,
  logo,
  className = "size-16",
  sizes = "64px",
}: {
  name: string;
  logo?: MediaImage;
  className?: string;
  sizes?: string;
}) {
  if (logo) {
    return (
      <span className={`relative block shrink-0 overflow-hidden rounded-2xl border border-line bg-surface ${className}`}>
        <span className="absolute inset-[10%]">
          <Image src={logo.url} alt={logo.alt || name} fill sizes={sizes} className="object-contain" />
        </span>
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-primary-05 font-heading text-[26px] font-bold text-primary-dark ring-1 ring-primary/15 ${className}`}
    >
      {Array.from(name.trim())[0] ?? ""}
    </span>
  );
}
