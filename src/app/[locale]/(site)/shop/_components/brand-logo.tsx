import Image from "next/image";

import type { MediaImage } from "@/types";

/**
 * A BRAND'S MARK, ON A PLAIN SURFACE.
 *
 * Logos arrive in every shape — a wide wordmark, a square badge, a transparent
 * PNG drawn for a white page — so each one sits on the surface token inside a
 * fixed box and is CONTAINED, never cropped: cutting the end off somebody's
 * wordmark is the one thing a logo slot must not do. The inset keeps the mark
 * off the box's edge the way a printed logo keeps its clear space.
 *
 * Only ever rendered when `Brand.logo` is set. Without one the brand's name,
 * set large, is still the mark, exactly as it was — there is no empty box.
 *
 * The size is the caller's (`className`), because the same mark is a 40px chip
 * beside a product title and a hero-sized tile on the brand's own page. The
 * tile itself — hairline, rounded corners — is the kit's small-panel shape.
 */
export function BrandLogo({
  logo,
  sizes,
  className,
  priority = false,
  bare = false,
  onDark = false,
}: {
  /** Recolours the mark to solid white, for sitting straight on a dark surface. Needs a truly transparent logo. */
  onDark?: boolean;
  logo: MediaImage;
  /** The box's rendered width, for `next/image` to pick a file. */
  sizes: string;
  className: string;
  priority?: boolean;
  /** No border/background of its own and less clear space — for when the caller already supplies the frame. */
  bare?: boolean;
}) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden ${
        bare ? "" : "rounded-2xl border border-line bg-surface"
      } ${className}`}
    >
      <span className={`absolute ${bare ? "inset-[6%]" : "inset-[12%]"}`}>
        <Image
          src={logo.url}
          alt={logo.alt}
          fill
          priority={priority}
          sizes={sizes}
          className={onDark ? "object-contain brightness-0 invert" : "object-contain mix-blend-multiply"}
        />
      </span>
    </span>
  );
}
