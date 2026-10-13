import Link from "next/link";

import { buttonClasses, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { CartView, type CartCopy } from "@/features/cart";
import { LOCALE_TAGS, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

export async function generateMetadata({ params }: PageProps<"/[locale]/cart">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({
    locale,
    path: "/cart",
    title: getTranslator(locale)("cart.title"),
    noIndex: true,
  });
}

/**
 * THE CART — a utility page, so a compact hero, then the work.
 *
 *   PageHero (compact)   where you are and what this page holds
 *   cart                 the lines beside the deep summary panel (client)
 *   after                what happens once you check out, and who to ask
 *
 * The page stays a Server Component; only the cart body, which reads client
 * state, opts in — and it receives its copy already translated. The hero does
 * not depend on what is in the cart, so it paints immediately while the client
 * half is still reading localStorage.
 */
export default async function CartPage({ params }: PageProps<"/[locale]/cart">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);

  const copy: CartCopy = {
    loading: t("cart.loading"),
    empty: t("cart.empty"),
    emptyLead: t("cart.emptyLead"),
    browseShop: t("cart.browseShop"),
    emptyRental: t("cart.emptyRental"),
    purchases: t("cart.purchases"),
    bookings: t("cart.bookings"),
    remove: t("cart.remove"),
    removeNamed: t("cart.removeNamed", { title: "{title}" }),
    totals: t("cart.totals"),
    summary: t("cart.summary"),
    items: t("cart.items"),
    deposits: t("cart.deposits"),
    payableNow: t("cart.payableNow"),
    taxNote: t("cart.taxNote"),
    checkout: t("cart.checkout"),
    checkoutSoon: t("cart.checkoutSoon"),
    clear: t("cart.clear"),
    staleBooking: t("cart.staleBooking"),
    refundableDeposit: t("cart.refundableDeposit", { amount: "{amount}" }),
    quantity: t("cart.quantity"),
    increase: t("cart.increase", { title: "{title}" }),
    decrease: t("cart.decrease", { title: "{title}" }),
    rentalPeriod: t("cart.rentalPeriod"),
    rentalFixed: t("cart.rentalFixed"),
  };

  const assurances = [
    { title: t("cart.assurance1Title"), body: t("cart.assurance1Body"), icon: <TruckIcon /> },
    { title: t("cart.assurance2Title"), body: t("cart.assurance2Body"), icon: <ReturnIcon /> },
    { title: t("cart.assurance3Title"), body: t("cart.assurance3Body"), icon: <ChatIcon /> },
  ];

  return (
    <>
      <PageHero
        compact
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("cart.title") }]}
        eyebrow={t("cart.eyebrow")}
        title={t("cart.title")}
        lead={t("cart.lead")}
      />

      <Section className="pt-10 sm:pt-12 lg:pt-14">
        <CartView
          copy={copy}
          localeTag={LOCALE_TAGS[locale]}
          shopHref={localePath(locale, "/shop")}
          rentalHref={localePath(locale, "/rental")}
          checkoutHref={localePath(locale, "/checkout")}
          /* Prefixes, not builders — a function cannot cross this boundary.
             See the note on the props themselves. */
          productBase={localePath(locale, "/shop/products")}
          rentalItemBase={localePath(locale, "/rental/items")}
        />
      </Section>

      <Section tone="muted" labelledBy="cart-assurance">
        <SectionHead id="cart-assurance" title={t("cart.assuranceTitle")} />

        <Reveal stagger as="ul" className="mt-12 grid gap-5 md:grid-cols-3">
          {assurances.map((item) => (
            <li key={item.title} className="rounded-3xl border border-line bg-surface p-7 shadow-soft">
              <span
                aria-hidden="true"
                className="grid size-14 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15 ring-offset-4 ring-offset-surface"
              >
                {item.icon}
              </span>
              <h3 className="mt-6 text-[1.1rem] leading-snug">{item.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-body">{item.body}</p>
            </li>
          ))}
        </Reveal>

        {/* Who to ask when the list is wrong — a note at the foot of the band
            rather than a band of its own. */}
        <div className="mt-12 flex flex-col items-start gap-5 rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 id="cart-help" className="text-[1.3rem] leading-snug">
              {t("cart.helpTitle")}
            </h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-body">{t("cart.helpBody")}</p>
          </div>
          <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "outline" })}>
            {t("cart.helpCta")}
          </Link>
        </div>
      </Section>
    </>
  );
}

/* Line icons on the site's 24-unit grid, stroked in `currentColor`. */
function TruckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 6.5h10.5v9.5H2.5V6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M13 9.5h4l3 3.4V16h-7V9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="18" r="1.8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.6-5.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 3.5V8h-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 16H9.5L5 19.5V16a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
