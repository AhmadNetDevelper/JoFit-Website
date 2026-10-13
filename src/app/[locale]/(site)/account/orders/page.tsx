import { accountService } from "@/features/account";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { EmptyNote, PortalShell } from "../../_components/portal/portal-shell";
import { accountFrame } from "../_components/account-frame";
import { OrderRows } from "../_components/order-rows";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/orders">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/account/orders", title: getTranslator(locale)("account.orders"), noIndex: true });
}

/** Every order, newest first, as one table. Each row opens the order and its tracking. */
export default async function AccountOrdersPage({ params }: PageProps<"/[locale]/account/orders">) {
  const locale = resolveLocale((await params).locale);
  const { customerId, t, f, shell } = await accountFrame(locale, "/account/orders");
  const orders = await accountService.listOrders(customerId, locale);

  return (
    <PortalShell {...shell} active="/account/orders" title={t("account.orders")} lead={t("account.ordersLead")}>
      {orders.length === 0 ? (
        <EmptyNote icon="orders" text={t("account.noOrders")} href={localePath(locale, "/shop")} action={t("cart.browseShop")} />
      ) : (
        <section
          aria-label={t("account.orders")}
          className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft"
        >
          <OrderRows orders={orders} locale={locale} t={t} f={f} />
        </section>
      )}
    </PortalShell>
  );
}
