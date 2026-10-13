import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowIcon } from "@/components/ui";
import type { SearchHit } from "@/features/search";
import { getFormatters, localePath, type Locale, type Translate } from "@/i18n";

import { ArticleIcon, BagIcon, CalendarIcon, CapIcon, StarIcon, WhistleIcon } from "./icons";

/**
 * ONE ROW SHAPE FOR FIVE DIFFERENT THINGS.
 *
 * A search result page is SCANNED, not browsed. Rendering each hit with its own
 * domain's card — the shop's product card, the coaches' coach card — makes the
 * eye re-learn the layout at every group boundary, when what the reader is
 * doing is comparing titles against the words they typed.
 *
 * So every hit gets the same row: the kind as a glyph in an icon well, the
 * title, one line of context, and the single fact that kind is judged on, in a
 * chip at the far end. The variation is in the DATA, not the layout. The kind's
 * name is the group heading above, so it is not repeated on every row.
 *
 * THE FACT IS BUILT, NOT INTERPOLATED. A figure and its unit are two elements:
 * `dir="ltr"` isolates the bare Latin figure (a price, a rating, an hour count)
 * and the unit stays in the page's own direction — an isolate round the whole
 * phrase would put an Arabic unit on the wrong side of its number. Course fees
 * are never shown (the fixtures' are placeholders); a course is judged on its
 * hours. Shop and rental prices are real fixture data.
 *
 * ---------------------------------------------------------------------------
 * THE UNION IS NARROWED, NOT CAST.
 *
 * `SearchHit` is a discriminated union of real domain entities, so this switch
 * reads each kind's own fields. The compiler checks the arms are exhaustive;
 * adding a sixth searchable domain will fail here until it is handled.
 */
const RATE_UNIT = {
  hour: "rental.perHour",
  day: "rental.perDay",
  week: "rental.perWeek",
} as const;

function describe(hit: SearchHit, locale: Locale, t: Translate): {
  icon: ReactNode;
  title: string;
  context?: string;
  meta?: ReactNode;
} {
  const { money, number } = getFormatters(locale);

  switch (hit.kind) {
    case "product":
      return {
        icon: <BagIcon size={18} />,
        title: hit.item.title,
        context: hit.item.summary,
        meta: <span dir="ltr">{money(hit.item.priceRange.min)}</span>,
      };
    case "rental": {
      /* A rental's headline number is a RATE, and a rate without its unit is
         not a price. The cheapest rate is the one a listing quotes. */
      const cheapest = hit.item.rates.length
        ? hit.item.rates.reduce((low, rate) => (rate.price.amount < low.price.amount ? rate : low))
        : undefined;
      return {
        icon: <CalendarIcon size={18} />,
        title: hit.item.title,
        context: hit.item.summary,
        meta: cheapest ? (
          <>
            <span dir="ltr">{money(cheapest.price)}</span>
            <span className="font-medium text-body/75">{t(RATE_UNIT[cheapest.unit])}</span>
          </>
        ) : undefined,
      };
    }
    case "coach":
      return {
        icon: <WhistleIcon size={18} />,
        /* The only kind whose display field is `name` rather than `title`. */
        title: hit.item.name,
        context: hit.item.headline,
        meta:
          hit.item.rating.count > 0 ? (
            <>
              <span className="text-accent">
                <StarIcon size={13} />
              </span>
              <span dir="ltr">{hit.item.rating.average.toFixed(1)}</span>
            </>
          ) : undefined,
      };
    case "course":
      return {
        icon: <CapIcon size={18} />,
        title: hit.item.title,
        context: hit.item.summary,
        meta: (
          <>
            <span dir="ltr">{number(hit.item.durationHours)}</span>
            {/* Arabic takes the plural noun for 3–10 ("8 ساعات"), the singular
                otherwise — the same choice the course card makes. */}
            <span className="font-medium text-body/75">
              {t(
                new Intl.PluralRules(locale).select(hit.item.durationHours) === "few"
                  ? "education.hoursUnitFew"
                  : "education.hoursUnit",
              )}
            </span>
          </>
        ),
      };
    case "article":
      return {
        icon: <ArticleIcon size={18} />,
        title: hit.item.title,
        context: hit.item.excerpt,
        meta: (
          <>
            <span dir="ltr">{number(hit.item.readingMinutes)}</span>
            <span className="font-medium text-body/75">{t("landing.readingMinutes")}</span>
          </>
        ),
      };
  }
}

export function ResultRow({
  hit,
  locale,
  t,
}: {
  hit: SearchHit;
  locale: Locale;
  t: Translate;
}) {
  const row = describe(hit, locale, t);

  return (
    /* On a phone the fact drops under the title rather than squeezing it; from
       `sm` it takes the far end of the row. */
    <article className="group relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2.5 rounded-2xl border border-line bg-surface p-4 shadow-soft transition-[transform,box-shadow,border-color] duration-300 focus-within:border-primary/40 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lift sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-5">
      <span
        aria-hidden="true"
        className="row-span-2 grid size-11 shrink-0 place-items-center self-start rounded-full bg-primary-05 text-primary ring-1 ring-primary/15 sm:row-span-1 sm:self-center"
      >
        {row.icon}
      </span>

      <div className="min-w-0">
        <h3 className="text-[1.02rem] leading-snug">
          <Link
            href={localePath(locale, hit.href)}
            className="after:absolute after:inset-0 after:rounded-2xl after:content-['']"
          >
            {row.title}
          </Link>
        </h3>
        {row.context ? (
          <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-body sm:line-clamp-1">{row.context}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 justify-self-start sm:justify-self-end">
        {row.meta ? (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap text-ink">
            {row.meta}
          </p>
        ) : null}
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary max-sm:hidden"
        >
          <ArrowIcon size={14} />
        </span>
      </div>
    </article>
  );
}
