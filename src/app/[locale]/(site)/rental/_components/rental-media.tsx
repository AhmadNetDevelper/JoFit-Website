import Image from "next/image";

import { Rosette } from "@/components/ui";
import type { RentalItem } from "@/features/rental";

import { ItemGlyph } from "./icons";

/**
 * A RENTAL ITEM'S IMAGE — or what stands in for one.
 *
 * There is no photography of the fleet in this repo and none from the client.
 * The fixtures used to point every item at a grey "rental placeholder"
 * rectangle, and nine of those in a grid reads as a broken page rather than a
 * catalogue with photographs pending.
 *
 * So an item with no photograph gets a drawn plate in the formal language: the
 * canvas ground with the certificate linework at a whisper, the rosette as a
 * watermark in one corner, and the line glyph for its own category set in a
 * white seal. Obviously not a photograph, which is honest, and obviously
 * designed, which a grey box is not.
 *
 * Drawn with TOKENS rather than shipped as an asset on purpose: the operator
 * re-themes the site from the admin, and a plate baked into a file would be the
 * one thing on the page still wearing last season's green. The moment a
 * fixture carries a real image the plate disappears on its own.
 *
 * `item` is narrowed to what the plate reads, so the detail page and the cards
 * share this one component.
 */
export function RentalMedia({
  item,
  priority = false,
  sizes = "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw",
  glyphSize = 52,
}: {
  item: Pick<RentalItem, "media" | "categoryIds">;
  priority?: boolean;
  sizes?: string;
  glyphSize?: number;
}) {
  const image = item.media.find((entry) => entry.kind === "image");

  if (image) {
    return (
      <Image
        src={image.url}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
    );
  }

  return (
    <div aria-hidden="true" className="absolute inset-0 isolate grid place-items-center overflow-hidden bg-canvas">
      <span className="pattern-waves absolute inset-0 -z-10 text-primary/[0.045]" />
      {/* The rosette sits centred behind the seal, like the engraving round a
          medal, rather than cropped into a corner where it reads as a stain. */}
      <span className="absolute start-1/2 top-1/2 -z-10 aspect-square h-[112%] -translate-x-1/2 -translate-y-1/2 text-accent/[0.16] rtl:translate-x-1/2">
        <Rosette className="size-full" />
      </span>
      {/* The seal's padding scales with the glyph, so the card tile and the
          detail page's large plate keep the same proportions. */}
      <span
        className="grid place-items-center rounded-full bg-surface text-primary shadow-soft ring-1 ring-primary/15 ring-offset-[6px] ring-offset-canvas transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        style={{ padding: Math.round(glyphSize * 0.42) }}
      >
        <ItemGlyph categoryIds={item.categoryIds} size={glyphSize} />
      </span>
    </div>
  );
}
