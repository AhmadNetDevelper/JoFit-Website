import Link from "next/link";
import { revalidatePath } from "next/cache";

import { Field, inputClasses, labelClasses, selectClasses, textareaClasses } from "@/components/ui";
import { accountService, type ReviewTargetType } from "@/features/account";
import { requireAccount } from "@/features/auth";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { ActionForm, type FormState } from "../../_components/portal/action-form";
import { failed, succeeded } from "../../_components/portal/form-state";
import { EmptyNote, Panel, PortalShell, PortalSubhead, StatusChip } from "../../_components/portal/portal-shell";
import { accountFrame } from "../_components/account-frame";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/reviews">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/account/reviews", title: getTranslator(locale)("account.reviews"), noIndex: true });
}

/**
 * What the customer has said, and what they could still say.
 *
 * Only something they bought, hired, trained with or studied can be reviewed —
 * the list to choose from IS that set. A review is held for moderation before
 * it is public, and the page says so rather than letting someone wonder why
 * theirs is not on the product yet.
 */
export default async function AccountReviewsPage({ params }: PageProps<"/[locale]/account/reviews">) {
  const locale = resolveLocale((await params).locale);
  const { customerId, t, f, shell } = await accountFrame(locale, "/account/reviews");
  const [reviews, reviewable] = await Promise.all([
    accountService.listReviews(customerId, locale),
    accountService.listReviewable(customerId, locale),
  ]);

  const fallback = t("state.errorTitle");
  const thanks = t("account.reviewThanks");

  async function submit(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const account = await requireAccount(locale, "customer", "/account/reviews");
    const [type, id] = String(formData.get("target") ?? "").split("|");
    try {
      await accountService.submitReview(account.customerId!, {
        type: type as ReviewTargetType,
        id: id ?? "",
        rating: Number(formData.get("rating") ?? 0),
        title: String(formData.get("title") ?? ""),
        body: String(formData.get("body") ?? ""),
      });
      revalidatePath(localePath(locale, "/account/reviews"));
      revalidatePath(localePath(locale, "/account"));
      return succeeded(thanks);
    } catch (error) {
      return failed(error, fallback);
    }
  }

  const kindLabel = (type: string) => t(`account.reviewKind.${type}` as Parameters<typeof t>[0]);
  const optional = <span className="ms-1 font-normal text-body/70">{t("booking.goalOptional")}</span>;

  return (
    <PortalShell {...shell} active="/account/reviews" title={t("account.reviews")} lead={t("account.reviewsLead")}>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <section aria-labelledby="my-reviews">
          <PortalSubhead id="my-reviews" title={t("account.yourReviews")} />
          {reviews.length === 0 ? (
            <div className="mt-5">
              <EmptyNote icon="reviews" text={t("account.noReviews")} />
            </div>
          ) : (
            <ul className="mt-5 grid gap-4">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      dir="ltr"
                      role="img"
                      className="inline-flex gap-0.5 text-[16px] leading-none text-accent"
                      aria-label={t("account.ratingOf", { rating: review.rating })}
                    >
                      {"★".repeat(review.rating)}
                      <span className="text-line">{"★".repeat(5 - review.rating)}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-3">
                      <span className="text-[13px] text-body/75">{f.date(review.submittedAt)}</span>
                      <StatusChip status={review.status} label={t(`account.review.${review.status}` as Parameters<typeof t>[0])} />
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] text-body">
                    <span className="rounded-full bg-canvas px-2.5 py-1 font-medium">{kindLabel(review.targetType)}</span>
                    <span className="ms-2">
                      {review.targetHref ? (
                        <Link
                          href={localePath(locale, review.targetHref)}
                          className="font-semibold text-primary-dark underline-offset-4 hover:underline"
                        >
                          {review.targetTitle}
                        </Link>
                      ) : (
                        <span className="font-semibold text-ink">{review.targetTitle}</span>
                      )}
                    </span>
                  </p>
                  {review.title ? (
                    <p className="mt-4 font-heading text-[16px] font-semibold text-ink" dir="auto">
                      {review.title}
                    </p>
                  ) : null}
                  <p className={`${review.title ? "mt-1.5" : "mt-4"} text-[14.5px] leading-relaxed text-body`} dir="auto">
                    {review.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Panel id="write-review" title={t("account.writeReview")} lead={reviewable.length > 0 ? t("account.reviewModerated") : undefined} className="lg:sticky lg:top-28">
          {reviewable.length === 0 ? (
            <p className="text-[14.5px] leading-relaxed text-body">{t("account.nothingToReview")}</p>
          ) : (
            <ActionForm
              action={submit}
              submitLabel={t("account.submitReview")}
              pendingLabel={t("account.working")}
              resetOnSuccess
              className="grid gap-5"
              submitClassName="w-full"
            >
              <Field label={t("account.reviewWhat")} htmlFor="review-target">
                <select id="review-target" name="target" required className={selectClasses()}>
                  {reviewable.map((entry) => (
                    <option key={`${entry.type}|${entry.id}`} value={`${entry.type}|${entry.id}`}>
                      {`${kindLabel(entry.type)} — ${entry.title}`}
                    </option>
                  ))}
                </select>
              </Field>

              <fieldset>
                <legend className={labelClasses}>{t("account.reviewRating")}</legend>
                <div className="flex gap-2" dir="ltr">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="cursor-pointer">
                      <input type="radio" name="rating" value={value} defaultChecked={value === 5} className="peer sr-only" required />
                      <span className="inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-full border border-line bg-surface px-3 text-[14px] font-semibold text-ink transition-colors hover:border-primary/40 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                        {value}
                        <span aria-hidden="true" className="text-[12px] text-accent">
                          ★
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="review-title" className={labelClasses}>
                  {t("account.reviewTitle")}
                  {optional}
                </label>
                <input id="review-title" name="title" maxLength={80} className={inputClasses()} dir="auto" />
              </div>

              <div>
                <label htmlFor="review-body" className={labelClasses}>
                  {t("account.reviewBody")}
                </label>
                <textarea id="review-body" name="body" required minLength={10} rows={4} className={textareaClasses()} dir="auto" />
              </div>
            </ActionForm>
          )}
        </Panel>
      </div>
    </PortalShell>
  );
}
