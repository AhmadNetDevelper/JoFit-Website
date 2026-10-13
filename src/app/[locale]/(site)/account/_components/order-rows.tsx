import Link from "next/link";

import { ArrowIcon } from "@/components/ui";
import type { AccountOrder } from "@/features/account";
import { localePath, type Formatters, type Locale, type Translate } from "@/i18n";

import { StatusChip } from "../../_components/portal/portal-shell";
import { statusLabel } from "./account-frame";

/*
 * The column template, shared by the header row and every order row so the
 * columns line up. Below `md` there is no header: each row folds into two
 * lines — reference and date, then status and total.
 */
const COLUMNS = "md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_7rem_1rem] md:gap-x-3";

/**
 * ORDERS AS A TABLE — the account's one tabular view, used whole on the
 * orders page and as the latest few on the overview.
 *
 * Each row is ONE link (the whole row opens the order), so it is a list of
 * links laid out as a table rather than a `<table>`: a table cannot be a link
 * per row. The header row is visual — each row's text reads complete on its
 * own — so it is hidden from assistive technology.
 */
export function OrderRows({
  orders,
  locale,
  t,
  f,
  preview = true,
}: {
  orders: readonly AccountOrder[];
  locale: Locale;
  t: Translate;
  f: Formatters;
  /** Show the first items under each reference. */
  preview?: boolean;
}) {
  return (
    <>
      <div
        aria-hidden="true"
        className={`hidden gap-4 border-b border-line bg-canvas px-6 py-3 text-[13px] font-semibold text-body md:grid ${COLUMNS}`}
      >
        <span>{t("account.colOrder")}</span>
        <span>{t("account.colPlaced")}</span>
        <span>{t("account.colStatus")}</span>
        <span className="text-end">{t("account.total")}</span>
        <span />
      </div>
      <ul className="divide-y divide-line">
        {orders.map((order) => {
          const items = order.lines.map((line) => line.title).join(" · ");
          return (
            <li key={order.id}>
              <Link
                href={localePath(locale, `/account/orders/${order.id}`)}
                className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-primary-05 sm:px-6 md:gap-y-0 ${COLUMNS}`}
              >
                <span className="min-w-0">
                  <span dir="ltr" className="font-heading text-[15.5px] font-semibold text-ink group-hover:text-primary-dark">
                    {order.reference}
                  </span>
                  {preview && items ? (
                    <span className="mt-0.5 block truncate text-[13px] text-body/80">{items}</span>
                  ) : null}
                </span>
                <span className="text-[14px] whitespace-nowrap text-body max-md:text-end">{f.date(order.placedAt)}</span>
                <span>
                  <StatusChip status={order.status} label={statusLabel(t, order.status)} />
                </span>
                <span className="text-end">
                  <span dir="ltr" className="font-semibold whitespace-nowrap text-ink tabular-nums">
                    {f.money(order.grandTotal)}
                  </span>
                </span>
                <span className="text-primary transition-transform group-hover:translate-x-0.5 max-md:hidden rtl:group-hover:-translate-x-0.5">
                  <ArrowIcon />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
