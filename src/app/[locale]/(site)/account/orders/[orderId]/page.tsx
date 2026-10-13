import Link from "next/link";
import { notFound } from "next/navigation";

import { revalidatePath } from "next/cache";

import { ArrowIcon, buttonClasses, HeroFacts } from "@/components/ui";
import { accountService } from "@/features/account";
import { requireAccount } from "@/features/auth";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { ActionForm, type FormState } from "../../../_components/portal/action-form";
import { failed, succeeded } from "../../../_components/portal/form-state";
import { PortalIcon } from "../../../_components/portal/portal-icons";
import { Panel, PortalNotice, PortalShell } from "../../../_components/portal/portal-shell";
import { accountFrame, statusLabel } from "../../_components/account-frame";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/orders/[orderId]">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/account/orders", title: getTranslator(locale)("account.orders"), noIndex: true });
}

/**
 * One order: where it is in its life, what was in it, and what it cost.
 *
 * The hero states the four facts (status, date, items, total); the tracker
 * shows the five steps with the reached ones sealed; the lines sit beside the
 * summary and the delivery address.
 *
 * Another customer's order id answers 404, exactly like an id that does not
 * exist — the service returns `null` for both.
 */
export default async function AccountOrderPage({
  params,
  searchParams,
}: PageProps<"/[locale]/account/orders/[orderId]">) {
  const { locale: raw, orderId } = await params;
  const justPlaced = (await searchParams).placed === "1";
  const locale = resolveLocale(raw);
  const { customerId, t, f, shell } = await accountFrame(locale, `/account/orders/${orderId}`);
  const order = await accountService.getOrder(customerId, orderId, locale);
  if (!order) notFound();

  const fallback = t("state.errorTitle");
  const cancelled = t("account.orderCancelledNow");

  async function cancel(): Promise<FormState> {
    "use server";
    const account = await requireAccount(locale, "customer", `/account/orders/${orderId}`);
    try {
      await accountService.cancelOrder(account.customerId!, orderId);
      revalidatePath(localePath(locale, `/account/orders/${orderId}`));
      return succeeded(cancelled);
    } catch (error) {
      return failed(error, fallback);
    }
  }

  const totals = [
    { label: t("account.itemsSubtotal"), value: order.itemsSubtotal },
    { label: t("account.delivery"), value: order.shippingTotal },
    { label: t("account.tax"), value: order.taxTotal },
    { label: t("account.depositHeld"), value: order.depositsTotal },
  ];
  const units = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  /* The step the order is at: the last one reached. */
  const reached = order.progress.filter((step) => step.done).length;

  return (
    <PortalShell
      {...shell}
      active="/account/orders"
      title={t("account.orderTitle", { reference: order.reference })}
      subpage={order.reference}
      hero={
        <HeroFacts
          items={[
            { label: t("account.colStatus"), value: statusLabel(t, order.status) },
            { label: t("account.colPlaced"), value: f.date(order.placedAt) },
            { label: t("account.factItems"), value: <span dir="ltr">{f.number(units)}</span> },
            { label: t("account.total"), value: <span dir="ltr">{f.money(order.grandTotal)}</span> },
          ]}
        />
      }
    >
      {justPlaced ? (
        /* The confirmation IS the order page: the figures below are the
           server's, re-priced, taxed and with delivery — not the basket's
           estimate. */
        <PortalNotice title={t("account.placedTitle")} body={t("account.placedBody")} />
      ) : null}

      <p className="mb-6">
        <Link href={localePath(locale, "/account/orders")} className={buttonClasses({ variant: "outline", size: "sm" })}>
          {/* The back arrow: the forward arrow turned round, in both directions. */}
          <span className="inline-flex -scale-x-100">
            <ArrowIcon size={14} />
          </span>
          {t("account.allOrders")}
        </Link>
      </p>

      {order.progress.length > 0 ? (
        <section aria-labelledby="order-tracking" className="mb-6 rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-7">
          <h2 id="order-tracking" className="text-[1.2rem] leading-snug sm:text-[1.3rem]">
            {t("account.tracking")}
          </h2>
          {/* The tracker: five steps, the reached ones sealed. It is an ordered
              list, so a screen reader hears the sequence and where it stops. */}
          <ol className="mt-7 grid grid-cols-5">
            {order.progress.map((step, index) => {
              const current = step.done && order.status === step.step;
              return (
                <li key={step.step} aria-current={current ? "step" : undefined} className="relative flex flex-col items-center px-1 text-center">
                  {index > 0 ? (
                    /* The line from the previous step's seal to this one's. */
                    <span
                      aria-hidden="true"
                      className={`absolute end-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${index < reached ? "bg-primary" : "bg-line"}`}
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className={`relative z-10 grid size-8 place-items-center rounded-full text-[13px] font-bold ${
                      step.done ? "bg-primary text-on-primary" : "border border-line bg-surface text-body/60"
                    } ${current ? "ring-4 ring-primary-10" : ""}`}
                  >
                    {step.done ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="m3.3 7.3 2.4 2.4 5-5.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span dir="ltr">{f.number(index + 1)}</span>
                    )}
                  </span>
                  <span
                    className={`mt-2.5 block text-[12.5px] leading-snug ${
                      current ? "font-semibold text-primary-dark" : step.done ? "font-medium text-ink" : "text-body/70"
                    }`}
                  >
                    {statusLabel(t, step.step)}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        <p className="mb-6 flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger-05 px-5 py-4 text-[14px] font-medium text-danger">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="shrink-0">
            <circle cx="9" cy="9" r="7.25" />
            <path d="M9 5.2v4.6M9 12.4v.1" strokeLinecap="round" />
          </svg>
          {t(order.status === "refunded" ? "account.orderRefunded" : "account.orderCancelled")}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <Panel id="order-lines" title={t("account.inThisOrder")}>
          <ul className="divide-y divide-line">
            {order.lines.map((line) => (
              <li key={line.id} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 py-4 first:pt-0 last:pb-0">
                <span className="flex min-w-0 items-start gap-3.5">
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
                  >
                    <PortalIcon name={line.kind === "rental" ? "rentals" : "orders"} />
                  </span>
                  <span className="min-w-0">
                    {line.href ? (
                      <Link
                        href={localePath(locale, line.href)}
                        className="font-heading text-[15px] font-semibold text-ink underline-offset-4 hover:text-primary-dark hover:underline"
                      >
                        {line.title}
                      </Link>
                    ) : (
                      <span className="font-heading text-[15px] font-semibold text-ink">{line.title}</span>
                    )}
                    <span className="mt-1 block text-[13.5px] text-body">
                      {line.kind === "rental" && line.rentalPeriod
                        ? `${t("account.hire")} · ${f.date(line.rentalPeriod.from)} – ${f.date(line.rentalPeriod.to)}`
                        : line.description}
                    </span>
                  </span>
                </span>
                <span className="flex items-baseline gap-5 ms-auto">
                  <span dir="ltr" className="text-[13.5px] text-body tabular-nums">
                    {`${f.number(line.quantity)} × ${f.money(line.unitPrice)}`}
                  </span>
                  <span dir="ltr" className="font-semibold text-ink tabular-nums">
                    {f.money(line.total)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <aside className="space-y-6">
          <Panel id="order-totals" title={t("cart.summary")}>
            <dl className="space-y-3 text-[14.5px]">
              {totals.map((row) => (
                <div key={row.label} className="flex justify-between gap-4">
                  <dt className="text-body">{row.label}</dt>
                  <dd dir="ltr" className="font-medium text-ink tabular-nums">
                    {f.money(row.value)}
                  </dd>
                </div>
              ))}
              <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4">
                <dt className="font-semibold text-ink">{t("account.total")}</dt>
                <dd dir="ltr" className="font-heading text-[1.35rem] font-bold text-primary-dark tabular-nums">
                  {f.money(order.grandTotal)}
                </dd>
              </div>
            </dl>
          </Panel>

          {order.status === "pending" ? (
            <Panel id="order-cancel" title={t("account.cancelOrderTitle")} lead={t("account.cancelOrderBody")}>
              <ActionForm
                action={cancel}
                submitLabel={t("account.cancelOrder")}
                pendingLabel={t("account.working")}
                tone="danger"
                className="[&>button]:mt-0"
              />
            </Panel>
          ) : null}

          <Panel id="order-address" title={t("account.deliverTo")}>
            <div className="flex items-start gap-3.5">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
              >
                <PortalIcon name="addresses" />
              </span>
              {order.shippingAddress ? (
                <p className="text-[14.5px] leading-relaxed text-ink" dir="auto">
                  <span className="font-semibold">{order.shippingAddress.recipientName}</span>
                  <br />
                  {order.shippingAddress.line1}
                  <br />
                  {order.shippingAddress.city}
                </p>
              ) : (
                <p className="text-[14.5px] leading-relaxed text-body">{t("account.collectFromDepot")}</p>
              )}
            </div>
          </Panel>
        </aside>
      </div>
    </PortalShell>
  );
}
