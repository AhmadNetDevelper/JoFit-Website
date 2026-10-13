"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { buttonClasses, Field, Rosette, selectClasses, textareaClasses } from "@/components/ui";
import { calculateTotals, useCart } from "@/features/cart";
import type { CheckoutLineInput } from "@/features/checkout";
import { formatDate, formatMoney } from "@/lib";

/**
 * The one interactive part of checkout: it reads the cart (which lives in the
 * browser), lets the customer choose how the order reaches them, and posts the
 * lines to the server as IDS.
 *
 * The totals shown here are the cart's own estimate and say so. The order's
 * real figures — re-priced, taxed, with delivery — are computed by the server,
 * and the confirmation page shows those.
 *
 * THE LAYOUT is the form recipe: the form in white cards (the kit's fields,
 * pills and radio cards), beside a deep panel that holds everything about the
 * money — how you pay, the estimate, and the one action. The panel sticks on
 * desktop, so the button is never a scroll away from the choices above it.
 */
export interface CheckoutCopy {
  readonly loading: string;
  readonly empty: string;
  readonly backToCart: string;
  readonly yourOrder: string;
  readonly howTitle: string;
  readonly delivery: string;
  readonly deliveryHint: string;
  readonly pickup: string;
  readonly pickupHint: string;
  readonly address: string;
  readonly noAddress: string;
  readonly addAddress: string;
  readonly notes: string;
  readonly optional: string;
  readonly estimate: string;
  readonly estimateNote: string;
  readonly deposits: string;
  readonly summary: string;
  readonly place: string;
  readonly placing: string;
  readonly paymentNote: string;
  readonly paymentTitle: string;
  readonly paymentBody: string;
  readonly hire: string;
}

export interface CheckoutAddressView {
  readonly id: string;
  readonly label: string;
}

type PlaceResult = { ok: true; orderId: string } | { ok: false; message: string };

/** A white form card, opened by a numbered seal: the steps of the order. */
function StepCard({
  step,
  id,
  title,
  children,
}: {
  step: string;
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8">
      <h2 id={id} className="flex items-center gap-3.5 text-[1.3rem] leading-snug">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-deep font-heading text-[14px] font-bold text-accent ring-1 ring-accent/50 ring-offset-2 ring-offset-surface"
          dir="ltr"
        >
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CheckoutForm({
  copy,
  localeTag,
  addresses,
  addAddressHref,
  cartHref,
  orderBase,
  action,
}: {
  copy: CheckoutCopy;
  localeTag: string;
  addresses: readonly CheckoutAddressView[];
  addAddressHref: string;
  cartHref: string;
  /** Localized prefix the new order's id is appended to. */
  orderBase: string;
  action: (input: {
    lines: CheckoutLineInput[];
    fulfilment: "delivery" | "pickup";
    addressId?: string;
    notes?: string;
  }) => Promise<PlaceResult>;
}) {
  const router = useRouter();
  const { cart, isHydrated, clear } = useCart();
  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <div aria-busy="true" aria-live="polite" className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <span className="sr-only">{copy.loading}</span>
        <div aria-hidden="true" className="space-y-6">
          <div className="h-[300px] animate-pulse rounded-3xl border border-line bg-surface" />
          <div className="h-[180px] animate-pulse rounded-3xl border border-line bg-surface" />
        </div>
        <div aria-hidden="true" className="h-[420px] animate-pulse rounded-3xl bg-deep/90" />
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface px-6 py-14 text-center shadow-soft">
        <p className="font-heading text-[1.4rem] font-bold text-ink">{copy.empty}</p>
        <Link href={cartHref} className={buttonClasses({ className: "mt-7" })}>
          {copy.backToCart}
        </Link>
      </div>
    );
  }

  const totals = calculateTotals(cart);
  const hasShop = cart.lines.some((line) => line.kind === "shop");
  const needsAddress = hasShop && fulfilment === "delivery";
  const money = (value: Parameters<typeof formatMoney>[0]) => formatMoney(value, localeTag);

  async function submit() {
    setPending(true);
    setFailure(null);
    const lines: CheckoutLineInput[] = cart.lines.map((line) =>
      line.kind === "shop"
        ? { kind: "shop", productId: line.productId, variantId: line.variantId, quantity: line.quantity }
        : { kind: "rental", itemId: line.itemId, period: line.period },
    );
    const result = await action({
      lines,
      fulfilment,
      addressId: needsAddress ? addressId : undefined,
      notes: notes.trim() || undefined,
    });
    if (!result.ok) {
      setPending(false);
      setFailure(result.message);
      return;
    }
    // Only now: a failed order must leave the basket exactly as it was.
    clear();
    router.push(`${orderBase}/${result.orderId}?placed=1`);
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
      <div className="space-y-6">
        <StepCard step="1" id="how-heading" title={copy.howTitle}>
          <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="how-heading">
            {(["delivery", "pickup"] as const).map((method) => {
              const checked = fulfilment === method;
              return (
                <label
                  key={method}
                  className={`relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-[border-color,background-color,box-shadow] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20 ${
                    checked ? "border-primary bg-primary-05" : "border-line bg-surface hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="fulfilment"
                    value={method}
                    checked={checked}
                    onChange={() => setFulfilment(method)}
                    className="sr-only"
                  />
                  {/* The drawn radio: a ring, filled when chosen. */}
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                      checked ? "border-primary" : "border-line"
                    }`}
                  >
                    <span className={`size-2.5 rounded-full bg-primary transition-transform ${checked ? "scale-100" : "scale-0"}`} />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">
                      {method === "delivery" ? copy.delivery : copy.pickup}
                    </span>
                    <span className="mt-1 block text-[13.5px] leading-relaxed text-body">
                      {method === "delivery" ? copy.deliveryHint : copy.pickupHint}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          {needsAddress ? (
            addresses.length === 0 ? (
              <div className="mt-6">
                <p className="mb-2 block text-[14px] font-semibold text-ink">{copy.address}</p>
                <p className="rounded-2xl border border-line bg-canvas px-4 py-3.5 text-[14px] text-body">
                  {copy.noAddress}{" "}
                  <Link href={addAddressHref} className="font-semibold text-primary-dark underline underline-offset-4">
                    {copy.addAddress}
                  </Link>
                </p>
              </div>
            ) : (
              <Field label={copy.address} htmlFor="checkout-address" className="mt-6">
                <select
                  id="checkout-address"
                  /* Addresses are what the customer typed: let the text pick its direction. */
                  dir="auto"
                  value={addressId}
                  onChange={(event) => setAddressId(event.target.value)}
                  className={selectClasses()}
                >
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label}
                    </option>
                  ))}
                </select>
              </Field>
            )
          ) : null}

          <Field
            label={
              <>
                {copy.notes} <span className="font-normal text-body/70">{copy.optional}</span>
              </>
            }
            htmlFor="checkout-notes"
            className="mt-6"
          >
            <textarea
              id="checkout-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              dir="auto"
              className={textareaClasses()}
            />
          </Field>
        </StepCard>

        <StepCard step="2" id="order-heading" title={copy.yourOrder}>
          <ul className="mt-5 divide-y divide-line">
            {cart.lines.map((line) => (
              <li key={line.lineId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4">
                <span className="min-w-0">
                  <span className="block font-heading text-[15px] font-semibold text-ink">{line.title}</span>
                  <span className="mt-0.5 block text-[13px] text-body">
                    {line.kind === "shop"
                      ? line.variantTitle
                      : `${copy.hire} · ${formatDate(line.period.range.from, localeTag)} – ${formatDate(line.period.range.to, localeTag)}`}
                  </span>
                </span>
                <span dir="ltr" className="text-[15px] font-semibold text-ink tabular-nums">
                  {line.kind === "shop" ? `${line.quantity} × ${money(line.unitPrice)}` : money(line.quote.subtotal)}
                </span>
              </li>
            ))}
          </ul>
        </StepCard>
      </div>

      {/*
        THE MONEY, on the deep panel. There is no payment step because there is
        no online payment: this is a reservation, settled in person. Said
        plainly at the top of the panel, before the figures and the button, so
        nobody reaches the button wondering where the card form is.
      */}
      <aside
        aria-labelledby="payment-heading"
        className="relative isolate overflow-hidden rounded-3xl bg-deep p-6 text-white/75 shadow-lift sm:p-7 lg:sticky lg:top-8"
      >
        <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.04]" />
        <span aria-hidden="true" className="absolute -end-44 -top-44 -z-10 size-72 text-accent/[0.14]">
          <Rosette className="size-full" />
        </span>

        <h2 id="payment-heading" className="text-[1.15rem] text-white">
          {copy.paymentTitle}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-white/70">{copy.paymentBody}</p>

        <div className="mt-6 border-t border-white/15 pt-6">
          <h3 className="font-sans text-[13px] font-semibold text-white/60">{copy.summary}</h3>
          <dl className="mt-4 space-y-3 text-[15px]">
            <div className="flex justify-between gap-4">
              <dt>{copy.estimate}</dt>
              <dd dir="ltr" className="font-heading text-[1.35rem] leading-none font-bold text-accent tabular-nums">
                {money(totals.itemsSubtotal)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{copy.deposits}</dt>
              <dd dir="ltr" className="font-semibold text-white tabular-nums">
                {money(totals.depositsTotal)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[12.5px] leading-relaxed text-white/55">{copy.estimateNote}</p>
        </div>

        <div aria-live="polite">
          {failure ? (
            <p className="mt-5 rounded-xl bg-white px-4 py-3 text-[14px] font-medium text-danger">{failure}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={pending || (needsAddress && !addressId)}
          className={buttonClasses({ variant: "gold", size: "lg", className: "mt-6 w-full" })}
        >
          {pending ? copy.placing : copy.place}
        </button>
        <p className="mt-3 text-center text-[12.5px] text-white/60">{copy.paymentNote}</p>
      </aside>
    </div>
  );
}
