import Link from "next/link";

import { JofitLogo } from "@/components/brand/jofit-logo";
import { buttonClasses, Container, SkipLink } from "@/components/ui";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
// Tailwind is imported per route group, not in the root layout. See the
// comment in `[locale]/layout.tsx`.
import "@/styles/globals.css";

/**
 * CHECKOUT'S OWN CHROME — deliberately stripped down: fewer exits, fewer
 * distractions. This is the reason the `(checkout)` route group exists at all.
 *
 * No navigation, no search, no support widget: the logo (home), the one way
 * back that makes sense here (the cart), and a single hairline footer with who
 * to ask. It is the formal site's language all the same — the white bar with
 * the brand's hairline, the logo, a pill — so leaving the storefront for the
 * checkout does not feel like leaving the site.
 *
 * The header is in the flow and nothing floats, so the page's own hero sits
 * directly under it.
 */
export default async function CheckoutLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);

  return (
    <>
      <SkipLink label={t("site.skipToContent")} />
      <header className="border-b border-line bg-surface">
        <Container className="flex h-18 items-center justify-between gap-4 lg:h-20">
          <Link href={localePath(locale, "/")} aria-label={t("site.name")} className="flex shrink-0 items-center">
            <JofitLogo variant="full" className="h-10 w-auto lg:h-11" />
          </Link>

          <Link href={localePath(locale, "/cart")} className={buttonClasses({ variant: "outline", size: "sm" })}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 rtl:-scale-x-100">
              <path d="M13 8H3M7 4 3 8l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("checkout.backToCart")}
          </Link>
        </Container>
      </header>

      <main id="main-content" className="flex-1 bg-surface">
        {children}
      </main>

      <footer className="border-t border-line bg-canvas">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-6 text-[13px] text-body/75">
          <p>{t("site.footerRights", { year: new Date().getFullYear() })}</p>
          <Link href={localePath(locale, "/contact")} className="font-semibold text-primary-dark hover:underline">
            {t("landing.helpPrimary")}
          </Link>
        </Container>
      </footer>
    </>
  );
}
