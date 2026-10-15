import Image from "next/image";
import Link from "next/link";

import { JofitLogo } from "@/components/brand/jofit-logo";
import { Container, Rosette } from "@/components/ui";
import { accreditations, footerNav, isFeatureEnabled, legalNav } from "@/config";
import { getTranslator, localePath, type Locale } from "@/i18n";

import { flattenResolvedNav, resolveSiteNav } from "../../_components/site-nav-data";

const INSTAGRAM_URL = "https://www.instagram.com/jofit_co";
const WHATSAPP_URL = "https://wa.me/962772116067";
const FACEBOOK_URL = "https://www.facebook.com/share/1Yo8Tjsjvx/";

/**
 * THE FOOTER — the formal redesign.
 *
 * The deepest green on the site, the certificate linework, and the rosette
 * turning in the far corner: the page closes on the same material the heroes
 * open on. Four things, in the order a reader looks for them at the foot of a
 * certification body's site:
 *
 *   1. Who this is, and who stands behind it — the lockup, one sentence, and
 *      the bodies whose accreditation the certificates carry.
 *   2. The whole map — every page in the navigation, flattened, because the
 *      footer is where someone goes when the menu did not have what they
 *      wanted (pages that only live inside a dropdown are reachable here).
 *   3. How to reach JoFit — email, phone, city, hours, and the two accounts it
 *      actually has.
 *   4. The small print.
 */
export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = getTranslator(locale);
  const explore = flattenResolvedNav(await resolveSiteNav(locale));
  const exploreHrefs = new Set(explore.map((item) => item.href));
  const secondary = footerNav.filter(
    (item) => (!item.feature || isFeatureEnabled(item.feature)) && !exploreHrefs.has(localePath(locale, item.href)),
  );
  const phone = t("site.contactPhone");

  return (
    <footer
      className="relative isolate overflow-hidden bg-deep-2 text-[14.5px] text-white/65"
      style={{ ["--color-accent" as string]: "#d4b36a" }}
    >
      <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.03]" />
      <span aria-hidden="true" className="absolute -end-56 -bottom-72 -z-10 size-[44rem] text-accent/[0.09]">
        <Rosette className="spin-slow size-full" />
      </span>
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/50 to-transparent" />

      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="max-w-sm">
            <Link href={localePath(locale, "/")} aria-label={t("site.name")} className="inline-block">
              <JofitLogo variant="full" className="h-14 w-auto" />
            </Link>
            <p className="mt-6 leading-relaxed">{t("site.footerAbout")}</p>

            <section aria-labelledby="footer-accredited" className="mt-8">
              <h2 id="footer-accredited" className="font-sans text-[13px] font-semibold text-[#d4b36a]">
                {t("site.accredited")}
              </h2>
              <ul className="mt-3 flex flex-wrap items-center gap-2.5">
                {accreditations.map((logo) => (
                  <li
                    key={logo.id}
                    className={`flex h-12 items-center justify-center rounded-2xl bg-white ${logo.shape === "seal" ? "w-12 p-1.5" : "px-3"}`}
                  >
                    <Image
                      src={logo.src}
                      alt={logo.altKey ? t(logo.altKey) : logo.alt}
                      width={logo.width}
                      height={logo.height}
                      className={logo.shape === "seal" ? "size-full object-contain" : logo.shape === "wordmark" ? "h-6 w-auto" : "h-7 w-auto"}
                    />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="text-[15px] text-white">
              {t("site.footerExplore")}
            </h2>
            <span aria-hidden="true" className="mt-3 block h-0.5 w-8 rounded-full bg-accent" />
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5">
              {explore.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors duration-200 hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
              {secondary.map((item) => (
                <li key={item.href}>
                  <Link
                    href={localePath(locale, item.href)}
                    className="transition-colors duration-200 hover:text-white"
                  >
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section aria-labelledby="footer-contact">
            <h2 id="footer-contact" className="text-[15px] text-white">
              {t("site.footerContact")}
            </h2>
            <span aria-hidden="true" className="mt-3 block h-0.5 w-8 rounded-full bg-accent" />
            <ul className="mt-5 space-y-3.5">
              <li>
                <a href={`mailto:${t("site.contactEmail")}`} className="inline-flex items-center gap-3 transition-colors hover:text-white">
                  <ContactIcon kind="mail" />
                  {t("site.contactEmail")}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                  className="inline-flex items-center gap-3 transition-colors hover:text-white"
                >
                  <ContactIcon kind="phone" />
                  <span dir="ltr">{phone}</span>
                </a>
              </li>
              <li className="inline-flex items-center gap-3">
                <ContactIcon kind="pin" />
                {t("site.address")}
              </li>
              <li className="flex items-center gap-3">
                <ContactIcon kind="clock" />
                {t("site.openingHours")}
              </li>
            </ul>

            <p className="mt-8 text-[13px] font-semibold text-accent">{t("site.follow")}</p>
            <div className="mt-3 flex items-center gap-2.5">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                aria-label={t("site.socialInstagram")}
                className="grid size-10 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-accent hover:bg-accent hover:text-deep"
              >
                <InstagramIcon />
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                aria-label={t("site.socialWhatsapp")}
                className="grid size-10 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-accent hover:bg-accent hover:text-deep"
              >
                <WhatsappIcon />
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noreferrer"
                aria-label={t("site.socialFacebook")}
                className="grid size-10 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-accent hover:bg-accent hover:text-deep"
              >
                <FacebookIcon />
              </a>
            </div>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-[13px]">
          <p className="text-white/45">
            {t("site.footerRights", { year: new Date().getFullYear() })}
            <span className="mx-2 text-white/20">·</span>
            {t("site.footerAgency")}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legalNav.map((item) => (
              <Link
                key={item.href}
                href={localePath(locale, item.href)}
                className="text-white/45 transition-colors duration-200 hover:text-white"
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}

function ContactIcon({ kind }: { kind: "mail" | "phone" | "pin" | "clock" }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-accent ring-1 ring-white/10">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {kind === "mail" ? (
          <>
            <rect x="1.8" y="3.2" width="12.4" height="9.6" rx="1.6" stroke="currentColor" strokeWidth="1.2" />
            <path d="m2.4 4.4 5.6 4.1 5.6-4.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </>
        ) : kind === "phone" ? (
          <path
            d="M3 2.6h2.2l1.1 2.8-1.4 1a7.6 7.6 0 0 0 3.7 3.7l1-1.4 2.8 1.1v2.2a1 1 0 0 1-1.1 1A11 11 0 0 1 2 3.7a1 1 0 0 1 1-1.1Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        ) : kind === "pin" ? (
          <>
            <path d="M8 14.4s-4.6-4-4.6-7.6a4.6 4.6 0 0 1 9.2 0c0 3.6-4.6 7.6-4.6 7.6Z" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="8" cy="6.8" r="1.6" stroke="currentColor" strokeWidth="1.2" />
          </>
        ) : (
          <>
            <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 4.6V8l2.3 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </>
        )}
      </svg>
    </span>
  );
}

function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="3.6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2.8" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="11.6" cy="4.4" r="0.8" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M9.2 14V8.6h1.8l.3-2.1H9.2V5.2c0-.6.2-1 1-1h1.2V2.3c-.2 0-.9-.1-1.7-.1-1.7 0-2.8 1-2.8 2.9v1.4H5.1v2.1H7V14h2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.8a6.2 6.2 0 0 0-5.3 9.4L1.9 14l2.9-.8A6.2 6.2 0 1 0 8 1.8Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M5.8 5.2c.2-.4.4-.4.6-.4h.4c.1 0 .3 0 .4.3l.6 1.4c0 .1 0 .3-.1.4l-.4.5c-.1.1-.1.2 0 .4.4.7 1 1.3 1.7 1.7.2.1.3.1.4 0l.5-.6c.1-.1.3-.2.4-.1l1.4.6c.2.1.3.2.3.3 0 .5-.2 1-.6 1.3-.4.3-1 .4-1.5.3-1.4-.4-2.7-1.4-3.5-2.6-.5-.7-.8-1.6-.6-2.4 0-.4.2-.8.4-1.1Z"
        fill="currentColor"
      />
    </svg>
  );
}
