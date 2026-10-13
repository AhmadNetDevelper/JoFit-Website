import Image from "next/image";

import { Rosette } from "@/components/ui";
import type { MediaImage } from "@/types";

import { initialOf } from "./format";

/**
 * AN EMPLOYER'S MARK.
 *
 * With a logo: the logo on white, CONTAINED inside a clear-space inset and
 * never cropped — the same rule as the shop's brand marks, because cutting the
 * end off somebody's wordmark is the one thing a logo slot must not do.
 *
 * Without one (most employers, until they upload it): a SEAL rather than an
 * empty box — the company's first letter in gold on the deep green, over a
 * faint guilloché, inside a gold hairline. It is the site's own ornament, so a
 * grid of jobs from companies with no logos reads as a register of verified
 * employers, not as a list of grey placeholders. The gold ring keeps it
 * visible on a deep band too.
 */
const SIZES = {
  sm: { box: "size-12 rounded-2xl", letter: "text-[19px]", sizes: "48px" },
  md: { box: "size-16 rounded-2xl", letter: "text-[25px]", sizes: "64px" },
  lg: { box: "size-24 rounded-3xl sm:size-28", letter: "text-[38px] sm:text-[44px]", sizes: "112px" },
} as const;

export function EmployerMark({
  name,
  logo,
  size = "sm",
  className = "",
}: {
  name: string;
  logo?: MediaImage;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const spec = SIZES[size];

  if (logo) {
    return (
      <span className={`relative block shrink-0 overflow-hidden border border-line bg-white ${spec.box} ${className}`}>
        <span className="absolute inset-[14%]">
          <Image src={logo.url} alt={logo.alt} fill sizes={spec.sizes} className="object-contain" />
        </span>
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`relative isolate flex shrink-0 items-center justify-center overflow-hidden bg-deep font-heading leading-none font-bold text-accent ring-1 ring-accent/40 ring-inset ${spec.box} ${spec.letter} ${className}`}
    >
      <Rosette className="absolute inset-[-18%] -z-10 size-[136%] text-accent/20" />
      <span className="-mt-0.5">{initialOf(name)}</span>
    </span>
  );
}
