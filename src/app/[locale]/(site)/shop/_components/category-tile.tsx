import Image from "next/image";
import Link from "next/link";

import { ArrowIcon } from "@/components/ui";
import type { ProductCategory } from "@/features/shop";

import { CategoryGlyph } from "./icons";

/**
 * ONE SHELF, AS A CARD.
 *
 * The way into a category from the shop index and from the foot of another
 * category. The old tile put a photograph under the hand-mixed gym wash; the
 * formal site has no photographs of shelves and does not want them, so a shelf
 * is shown the way the site shows a credential's facts: a white card, the
 * category's own line glyph in a ringed well (the same glyph its products'
 * plates carry), the name in the heading face, and HOW MUCH IS ON IT — a figure
 * beside a bare noun, because "{n} products" is only grammatical Arabic for
 * some values of n.
 *
 * When staff have given the category a picture (`ProductCategory.image`) it
 * takes the well's place, cropped to the same circle, so a row with one picture
 * in it is still a row.
 *
 * `note` is the one line above the name — "In Apparel" for a child category —
 * and when a row passes it at all, every card in the row reserves its height,
 * so the names line up whether or not a card has a parent.
 */
export function CategoryTile({
  category,
  href,
  count,
  countLabel,
  description,
  note,
}: {
  category: ProductCategory;
  href: string;
  /** Already formatted. */
  count: string;
  countLabel: string;
  /** Shown line-clamped under the name when given. */
  description?: string;
  /** `undefined` leaves the line out; `null` reserves it empty. */
  note?: string | null;
}) {
  const image = category.image;

  return (
    <Link
      href={href}
      className="group relative flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift sm:p-7"
    >
      <span className="flex items-start justify-between gap-4">
        {image ? (
          <span className="relative size-16 shrink-0 overflow-hidden rounded-full ring-1 ring-primary/15 ring-offset-4 ring-offset-surface">
            <Image src={image.url} alt={image.alt} fill sizes="64px" className="object-cover" />
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="grid size-16 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15 ring-offset-4 ring-offset-surface transition-colors duration-300 group-hover:bg-primary group-hover:text-on-primary"
          >
            <CategoryGlyph categoryIds={[category.id]} size={30} />
          </span>
        )}

        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary"
        >
          <ArrowIcon />
        </span>
      </span>

      {note !== undefined ? (
        <span className="mt-6 block min-h-5 text-[12.5px] leading-5 text-body/70">{note}</span>
      ) : null}

      <h3 className={`${note !== undefined ? "mt-1" : "mt-6"} text-[1.15rem] leading-snug`}>{category.name}</h3>

      {description ? (
        <p className="mt-2 line-clamp-2 min-h-[2.9rem] text-[14px] leading-relaxed text-body">{description}</p>
      ) : null}

      <span className="mt-auto block pt-6">
        <span className="flex items-baseline gap-2 border-t border-line pt-4">
          <span className="font-heading text-[1.35rem] leading-none font-bold text-ink" dir="ltr">
            {count}
          </span>
          <span className="text-[13px] text-body/75">{countLabel}</span>
        </span>
      </span>
    </Link>
  );
}
