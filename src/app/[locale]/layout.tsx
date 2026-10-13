import { notFound } from "next/navigation";
import { Alexandria, IBM_Plex_Sans_Arabic } from "next/font/google";

import { CartProvider } from "@/features/cart";
import { themeService, themeToCssVars } from "@/features/theme";
import { LOCALES, LOCALE_DIRECTION, isLocale, type Locale } from "@/i18n";
import { buildMetadata } from "@/lib";

/*
 * `globals.css` is imported by each route group rather than here, so the
 * document shell stays free of Tailwind class names; see `(site)/layout.tsx`.
 */

/*
 * THE TWO FACES OF THE FORMAL SITE.
 *
 * Alexandria sets the headings. It is one geometric design drawn for Arabic and
 * Latin together, so a heading that mixes "NCSF" with Arabic reads as one
 * typeface rather than two meeting mid-line; its weight carries the
 * institutional voice without needing capitals, which Arabic does not have.
 *
 * IBM Plex Sans Arabic sets everything read at length. It has its own Latin,
 * matched to the Arabic, and it is a corporate text face — the register of a
 * certification body, not of a gym poster.
 *
 * Both are variable-free static cuts in the weights the design uses. The theme
 * record still carries a `fontFamily` field; the formal design does not read it
 * (see `styles/tokens.css`).
 */
const display = Alexandria({
  variable: "--font-alexandria",
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const text = IBM_Plex_Sans_Arabic({
  variable: "--font-plex",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/**
 * This is the ROOT layout: there is no `app/layout.tsx`.
 *
 * `<html>` needs `lang` and `dir`, and both depend on the locale, which only
 * exists inside this segment. Putting the document shell above the locale would
 * mean either reading a request header (making every page dynamic) or shipping
 * the wrong direction on first paint.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ locale: isLocale(locale) ? locale : undefined, path: "/" });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // An unknown language in the URL is a 404, not a silent fallback to English.
  if (!isLocale(locale)) notFound();

  const typed: Locale = locale;

  /*
   * The theme is fetched and written into the document here, on the server.
   * Reading it in the browser instead would paint the fallback palette first and
   * then swap — the flash every cookie-driven theme switcher has. These custom
   * properties sit on the element, so they beat the fallbacks in `tokens.css`
   * and the first paint is already the operator's theme.
   */
  const theme = await themeService.getActiveTheme();

  return (
    <html
      lang={typed}
      dir={LOCALE_DIRECTION[typed]}
      data-theme={theme.id}
      style={themeToCssVars(theme, LOCALE_DIRECTION[typed])}
      className={`${display.variable} ${text.variable}`}
    >
      <body>
        {/*
          CartProvider is a Client Component, but placing it here does NOT make
          the tree client-rendered — its children are Server Components passed
          through as an already-rendered slot.
        */}
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
