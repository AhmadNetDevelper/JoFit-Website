import { Reveal, Rosette } from "@/components/ui";
import { coachPortalService } from "@/features/coach-portal";
import { getTranslator, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { EmptyNote, PortalShell } from "../../_components/portal/portal-shell";
import { coachFrame } from "../_components/coach-frame";
import { StarIcon } from "../_components/icons";

export async function generateMetadata({ params }: PageProps<"/[locale]/coach/reviews">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/coach/reviews", title: getTranslator(locale)("coach.tabReviews"), noIndex: true });
}

/** Five stars, the first `rating` lit. The number is said once, by `label`. */
function Stars({ rating, label, dim, size = 15 }: { rating: number; label: string; dim: string; size?: number }) {
  return (
    <span role="img" aria-label={label} className="inline-flex gap-0.5 text-accent" dir="ltr">
      {[0, 1, 2, 3, 4].map((index) => (
        <span key={index} className={index < rating ? "" : dim}>
          <StarIcon size={size} />
        </span>
      ))}
    </span>
  );
}

/**
 * What the public reads about this coach — published reviews only, exactly as
 * the profile shows them. Reviews still in moderation are not shown: a coach
 * lobbying over a review staff have not judged yet is the thing moderation
 * exists to prevent.
 *
 * The score band on top is COUNTED from the same list — the average, the
 * number of reviews and how many gave each star — never typed in.
 */
export default async function CoachReviewsPage({ params }: PageProps<"/[locale]/coach/reviews">) {
  const locale = resolveLocale((await params).locale);
  const { coachId, t, f, shell } = await coachFrame(locale, "/coach/reviews");
  const reviews = await coachPortalService.listReviews(coachId);
  const average = reviews.length ? reviews.reduce((sum, row) => sum + row.rating, 0) / reviews.length : 0;
  const spread = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((row) => row.rating === stars).length }));

  return (
    <PortalShell
      {...shell}
      active="/coach/reviews"
      title={t("coach.tabReviews")}
      lead={reviews.length ? t("coach.reviewsLead", { average: average.toFixed(1), count: f.number(reviews.length) }) : undefined}
    >
      {reviews.length === 0 ? (
        <EmptyNote text={t("coach.noReviews")} icon="reviews" />
      ) : (
        <>
          <section
            aria-label={t("coach.averageLabel")}
            className="relative isolate grid items-center gap-6 overflow-hidden rounded-3xl bg-deep p-6 text-white shadow-lift sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10 sm:p-8"
          >
            <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/4" />
            <span aria-hidden="true" className="absolute -end-24 top-1/2 -z-10 size-72 -translate-y-1/2 text-accent/16">
              <Rosette className="spin-slow size-full" />
            </span>

            <div className="flex items-center gap-6 sm:border-e sm:border-white/10 sm:pe-10">
              <div>
                <p className="text-[12.5px] text-white/60">{t("coach.averageLabel")}</p>
                <p className="mt-2 font-heading text-[3.25rem] leading-none font-bold text-white" dir="ltr">
                  {average.toFixed(1)}
                </p>
                <p className="mt-3">
                  <Stars rating={Math.round(average)} label={t("account.ratingOf", { rating: average.toFixed(1) })} dim="text-white/20" />
                </p>
              </div>
              <div className="border-s border-white/10 ps-6">
                <p className="font-heading text-[1.6rem] leading-none font-bold text-accent" dir="ltr">
                  {f.number(reviews.length)}
                </p>
                <p className="mt-1.5 text-[12.5px] text-white/60">{t("coach.reviewsCountLabel")}</p>
              </div>
            </div>

            {/* How many gave each star, as bars: counted from the list above. */}
            <ul className="grid max-w-md gap-2">
              {spread.map((row) => (
                <li key={row.stars} className="flex items-center gap-3 text-[13px]">
                  <span className="sr-only">{t("account.ratingOf", { rating: row.stars })}</span>
                  <span aria-hidden="true" className="flex w-9 shrink-0 items-center gap-1 text-white/75">
                    <span dir="ltr">{row.stars}</span>
                    <span aria-hidden="true" className="text-accent">
                      <StarIcon size={12} />
                    </span>
                  </span>
                  <span aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${reviews.length ? (row.count / reviews.length) * 100 : 0}%` }}
                    />
                  </span>
                  <span dir="ltr" className="w-6 shrink-0 text-end font-semibold text-white tabular-nums">
                    {f.number(row.count)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <Reveal stagger as="ul" className="mt-6 grid gap-5 md:grid-cols-2">
            {reviews.map((review) => (
              <li key={review.id} className="flex">
                <article className="flex w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Stars rating={review.rating} label={t("account.ratingOf", { rating: review.rating })} dim="text-line" />
                    <span className="text-[12.5px] text-body/75">{f.date(review.submittedAt)}</span>
                  </div>
                  {review.title ? (
                    <p className="mt-4 font-heading text-[16px] leading-snug font-semibold text-ink" dir="auto">
                      {review.title}
                    </p>
                  ) : null}
                  <p className={`${review.title ? "mt-2" : "mt-4"} flex-1 text-[14.5px] leading-relaxed text-body`} dir="auto">
                    {review.body}
                  </p>
                  <p className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-05 font-heading text-[14px] font-bold text-primary-dark ring-1 ring-primary/15"
                    >
                      {Array.from(review.authorName.trim())[0] ?? ""}
                    </span>
                    <span className="text-[14px] font-semibold text-ink" dir="auto">
                      {review.authorName}
                    </span>
                  </p>
                </article>
              </li>
            ))}
          </Reveal>
        </>
      )}
    </PortalShell>
  );
}
