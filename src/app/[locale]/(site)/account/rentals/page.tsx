import Link from "next/link";

import { ArrowIcon } from "@/components/ui";
import { accountService } from "@/features/account";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { PortalIcon } from "../../_components/portal/portal-icons";
import { EmptyNote, PortalShell, StatusChip } from "../../_components/portal/portal-shell";
import { accountFrame, statusLabel } from "../_components/account-frame";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/rentals">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/account/rentals", title: getTranslator(locale)("account.rentals"), noIndex: true });
}

/**
 * Hires, and — the part a customer actually asks about — whether their deposit
 * has come back. Each hire links to the order it was paid through.
 */
export default async function AccountRentalsPage({ params }: PageProps<"/[locale]/account/rentals">) {
  const locale = resolveLocale((await params).locale);
  const { customerId, t, f, shell } = await accountFrame(locale, "/account/rentals");
  const rentals = await accountService.listRentals(customerId, locale);

  return (
    <PortalShell {...shell} active="/account/rentals" title={t("account.rentals")} lead={t("account.rentalsLead")}>
      {rentals.length === 0 ? (
        <EmptyNote icon="rentals" text={t("account.noRentals")} href={localePath(locale, "/rental")} action={t("account.browseRentals")} />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {rentals.map((rental) => (
            <li key={rental.id} className="flex">
              <article className="flex w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <span
                      aria-hidden="true"
                      className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
                    >
                      <PortalIcon name="rentals" size={18} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-heading text-[16.5px] leading-snug font-semibold">
                        {rental.itemHref ? (
                          <Link
                            href={localePath(locale, rental.itemHref)}
                            className="text-ink underline-offset-4 hover:text-primary-dark hover:underline"
                          >
                            {rental.itemTitle}
                          </Link>
                        ) : (
                          rental.itemTitle
                        )}
                      </h2>
                      <p className="mt-1 text-[13.5px] text-body">
                        {rental.period.from === rental.period.to
                          ? f.date(rental.period.from)
                          : `${f.date(rental.period.from)} – ${f.date(rental.period.to)}`}
                        {` · ${t("account.units", { count: f.number(rental.quantity) })}`}
                      </p>
                    </div>
                  </div>
                  <StatusChip status={rental.status} label={statusLabel(t, rental.status)} />
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line text-[14px]">
                  <div className="bg-canvas px-4 py-3.5">
                    <dt className="text-[12.5px] text-body/75">{t("account.hireCost")}</dt>
                    <dd className="mt-1 font-heading text-[16px] font-semibold text-ink">
                      <span dir="ltr" className="tabular-nums">
                        {f.money(rental.total)}
                      </span>
                    </dd>
                  </div>
                  <div className="bg-canvas px-4 py-3.5">
                    <dt className="text-[12.5px] text-body/75">{t("account.deposit")}</dt>
                    <dd className="mt-1 font-heading text-[16px] font-semibold text-ink">
                      {rental.deposit ? (
                        <>
                          <span dir="ltr" className="tabular-nums">
                            {f.money(rental.deposit)}
                          </span>
                          <span
                            className={`mt-1 block font-sans text-[12.5px] font-medium ${
                              rental.depositReleasedAt ? "text-primary-dark" : "text-body"
                            }`}
                          >
                            {rental.depositReleasedAt
                              ? t("account.depositReturned", { date: f.date(rental.depositReleasedAt) })
                              : rental.status === "returned"
                                ? t("account.depositProcessing")
                                : t("account.depositHeldNote")}
                          </span>
                        </>
                      ) : (
                        t("account.noDeposit")
                      )}
                    </dd>
                  </div>
                </dl>

                <p className="mt-auto pt-5">
                  <Link
                    href={localePath(locale, `/account/orders/${rental.orderId}`)}
                    className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary-dark underline-offset-4 hover:underline"
                  >
                    {/* No live orderReference on AccountRentalDto2 (see AccountRental in account/types.ts) — falls back to the order id. */}
                    {t("account.paidThrough", { reference: rental.orderReference ?? rental.orderId })}
                    <ArrowIcon size={14} />
                  </Link>
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </PortalShell>
  );
}
