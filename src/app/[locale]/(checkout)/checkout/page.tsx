import { updateTag } from "next/cache";

import { PageHero, Section } from "@/components/ui";
import { accountService } from "@/features/account";
import { requireAccount } from "@/features/auth";
import { checkoutService, type CheckoutLineInput } from "@/features/checkout";
import { LOCALE_TAGS, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, isAppError } from "@/lib";
import { cacheTags } from "@/services";

import { CheckoutForm } from "./checkout-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({
    locale,
    path: "/checkout",
    title: getTranslator(locale)("checkout.title"),
    noIndex: true,
  });
}

/**
 * CHECKOUT — the form recipe, inside the stripped-down `(checkout)` chrome.
 *
 *   PageHero (compact)   the trail back through the cart, a greeting, one line
 *   form                 how it reaches you, how you pay, what you are
 *                        ordering — beside the sticky summary and the one
 *                        action (client: it reads the cart)
 *
 * A signed-in customer only — `requireAccount` sends anyone else to sign in and
 * straight back here. The page renders on the server; only the form, which has
 * to read the cart from the browser, is a Client Component.
 *
 * The Server Action is where the order is made. It re-reads the session (an
 * action is an endpoint of its own), hands the lines to `checkoutService` as
 * ids to be re-priced, and answers with the new order's id or a sentence
 * explaining what could not be sold.
 *
 * OPEN BUSINESS DECISION: payment. The order is created `pending` and nothing
 * is charged; the copy says so beside the button.
 */
export default async function CheckoutPage({ params }: PageProps<"/[locale]/checkout">) {
  const locale = resolveLocale((await params).locale);
  const account = await requireAccount(locale, "customer", "/checkout");
  const t = getTranslator(locale);
  const addresses = await accountService.listAddresses(account.customerId!);
  const fallback = t("state.errorTitle");

  async function place(input: {
    lines: CheckoutLineInput[];
    fulfilment: "delivery" | "pickup";
    addressId?: string;
    notes?: string;
  }) {
    "use server";
    const caller = await requireAccount(locale, "customer", "/checkout");
    try {
      const order = await checkoutService.placeOrder(caller.customerId!, input, locale);
      // Stock moved: product pages must not keep selling the old count.
      updateTag(cacheTags.products);
      return { ok: true as const, orderId: order.id };
    } catch (error) {
      return { ok: false as const, message: isAppError(error) ? error.message : fallback };
    }
  }

  return (
    <>
      <PageHero
        compact
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("cart.title"), href: localePath(locale, "/cart") },
          { label: t("checkout.title") },
        ]}
        title={t("checkout.title")}
        lead={t("checkout.lead", { name: account.name.split(" ")[0] ?? account.name })}
      />

      <Section tone="muted" className="pt-10 sm:pt-12 lg:pt-14">
        <CheckoutForm
          localeTag={LOCALE_TAGS[locale]}
          addresses={addresses.map((address) => ({
            id: address.id,
            label: [address.label, address.recipientName, address.line1, address.city].filter(Boolean).join(" · "),
          }))}
          addAddressHref={localePath(locale, "/account/addresses")}
          cartHref={localePath(locale, "/cart")}
          orderBase={localePath(locale, "/account/orders")}
          action={place}
          copy={{
            loading: t("cart.loading"),
            empty: t("checkout.empty"),
            backToCart: t("checkout.backToCart"),
            yourOrder: t("checkout.yourOrder"),
            howTitle: t("checkout.howTitle"),
            delivery: t("checkout.delivery"),
            deliveryHint: t("checkout.deliveryHint"),
            pickup: t("checkout.pickup"),
            pickupHint: t("checkout.pickupHint"),
            address: t("checkout.address"),
            noAddress: t("checkout.noAddress"),
            addAddress: t("account.addAddress"),
            notes: t("checkout.notes"),
            optional: t("booking.goalOptional"),
            estimate: t("cart.items"),
            estimateNote: t("checkout.estimateNote"),
            deposits: t("cart.deposits"),
            summary: t("cart.summary"),
            place: t("checkout.place"),
            placing: t("checkout.placing"),
            paymentNote: t("checkout.paymentNote"),
            paymentTitle: t("checkout.paymentTitle"),
            paymentBody: t("checkout.paymentBody"),
            hire: t("account.hire"),
          }}
        />
      </Section>
    </>
  );
}
