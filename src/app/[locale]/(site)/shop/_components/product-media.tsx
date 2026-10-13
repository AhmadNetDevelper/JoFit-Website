import Image from "next/image";

import { Rosette } from "@/components/ui";
import type { Product } from "@/features/shop";

import { CategoryGlyph } from "./icons";

/**
 * A PRODUCT'S IMAGE — or the catalogue plate that stands in for one.
 *
 * There is no product photography in this repo, and none from the client yet.
 * The fixtures once pointed every product at a grey "placeholder" rectangle,
 * and twelve of those in a grid read as a broken page, not a shop with
 * photographs pending.
 *
 * So a product without a photograph is drawn the way the rest of the formal
 * site draws things it has no picture of — as a PLATE, the product page of a
 * printed catalogue: the canvas ground with the dotted grid at a whisper, a
 * hairline frame inset from the edge, the guilloché rosette as a gold
 * watermark in the corner, and the product's own category glyph centred in a
 * white medallion. It is obviously not a photograph, which is honest, and it
 * is obviously designed, which a grey box is not. The course covers are the
 * same idea in deep green; products are on the light ground so a shelf and a
 * syllabus never look like the same thing.
 *
 * Tokens only, no image file: the operator re-themes from the admin, and a
 * plate baked into an asset would keep the old brand colour.
 *
 * The moment a fixture carries a real image the plate disappears on its own.
 * The caller owns the box (`relative`, an aspect ratio, `overflow-hidden` and
 * the corner radius); this fills it.
 */
export function ProductMedia({
  product,
  priority = false,
  sizes = "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw",
  glyphSize = 44,
  frameClassName = "inset-2.5 rounded-xl",
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
  /** The glyph's size in px; the medallion around it is drawn from it. */
  glyphSize?: number;
  /** Where the hairline frame sits — it follows the caller's corner radius. */
  frameClassName?: string;
}) {
  const image = product.media.find((entry) => entry.kind === "image");

  if (image) {
    return (
      <Image
        src={image.url}
        /* The alt staff wrote when they uploaded it; an empty one is theirs to
           mark decorative. */
        alt={image.alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    );
  }

  const medallion = Math.round(glyphSize * 2.1);

  return (
    <div aria-hidden="true" className="absolute inset-0 isolate flex items-center justify-center overflow-hidden bg-canvas">
      <span className="pattern-grid absolute inset-0 -z-10 text-primary/[0.13]" />
      <span className={`absolute border border-primary/10 ${frameClassName}`} />
      {/* The rosette is the medallion's halo — a seal's engraving, centred on
          it and turning a little when the card is pointed at. */}
      <span
        className="absolute start-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 text-accent/35 rtl:translate-x-1/2"
        style={{ inlineSize: medallion * 2.4, blockSize: medallion * 2.4 }}
      >
        <Rosette className="size-full transition-transform duration-[1.4s] ease-out group-hover:rotate-45" />
      </span>

      <span
        className="relative grid place-items-center rounded-full bg-surface text-primary shadow-soft ring-1 ring-primary/10 transition-transform duration-500 ease-out group-hover:scale-[1.05]"
        style={{ inlineSize: medallion, blockSize: medallion }}
      >
        {/* The gold hairline inside the medallion: the seal's inner ring. */}
        <span className="absolute inset-[7%] rounded-full border border-accent/45" />
        <CategoryGlyph categoryIds={product.categoryIds} size={glyphSize} />
      </span>
    </div>
  );
}
