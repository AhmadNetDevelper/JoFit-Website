import Image from "next/image";
import Link from "next/link";

import type { Coach } from "@/features/coaches";
import { getFormatters, localePath, type Locale, type Translate } from "@/i18n";

import { RatingStars } from "./rating";

/**
 * THE COACH CARD — a person first.
 *
 * The roster is a row of faces, so the card is short and centred: a large round
 * portrait in a gold-hairline ring, the rating, the name, one line of what the
 * coach does, and a single way in. The booking, the credentials, the
 * specialisations, the languages and the prices are all on the profile, which
 * the whole card opens (the name's `::after` covers it), so none of it has to
 * be squeezed onto a card.
 *
 * The headline reserves two lines, so the buttons line up across a row; the
 * card root is `w-full` so a flex cell cannot size it to its content.
 */
export function CoachCard({
  coach,
  locale,
  t,
  priority = false,
}: {
  coach: Coach;
  locale: Locale;
  t: Translate;
  /** Set on the first row, which is above the fold on every breakpoint. */
  priority?: boolean;
}) {
  const { number } = getFormatters(locale);
  const href = localePath(locale, `/coaches/${coach.slug}`);

  return (
    <article className="group relative flex h-full w-full flex-col items-center rounded-3xl border border-line bg-surface px-5 pb-6 pt-8 text-center shadow-soft transition-[transform,box-shadow,border-color] duration-300 focus-within:border-primary/40 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift">
      <span className="relative block size-40 shrink-0 rounded-full bg-surface p-1.5 ring-1 ring-accent/60 ring-offset-4 ring-offset-surface">
        <span className="relative block size-full overflow-hidden rounded-full bg-canvas">
          {coach.avatar ? (
            <Image
              src={coach.avatar.url}
              alt=""
              fill
              priority={priority}
              sizes="160px"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          ) : null}
        </span>
      </span>

      <p className="mt-5 flex items-center gap-2 text-[13px] font-semibold text-ink">
        <RatingStars
          value={coach.rating.average}
          size={15}
          label={`${t("coaches.ratingValue", { rating: number(coach.rating.average) })}, ${t("coaches.reviewsCount", { count: number(coach.rating.count) })}`}
        />
        <span aria-hidden="true" dir="ltr" className="text-body/70">
          {`(${number(coach.rating.count)})`}
        </span>
      </p>

      <h3 className="mt-3 text-[1.15rem] leading-snug">
        <Link href={href} className="after:absolute after:inset-0 after:rounded-3xl after:content-['']">
          {coach.name}
        </Link>
      </h3>

      <p className="mt-1.5 line-clamp-2 min-h-[2.9rem] text-[14px] leading-relaxed text-body">{coach.headline}</p>

      <span
        aria-hidden="true"
        className="mt-5 inline-flex items-center rounded-full border border-primary/35 px-5 py-2 text-[13.5px] font-semibold text-primary-dark transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary"
      >
        {t("coaches.learnMore")}
      </span>
    </article>
  );
}
