import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowIcon, buttonClasses, PageHero, Reveal, Rosette, Section, SectionHead, VisuallyHidden } from "@/components/ui";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

/*
 * THE CONTACT PAGE — the formal design.
 *
 *   PageHero (compact)  who you are writing to, and the two fastest ways in
 *   channels            four channel cards — email, phone, WhatsApp, Instagram —
 *                       beside a deep panel with the head office, the working
 *                       hours and the agency the office holds
 *   routes              three pages that already answer the commonest questions
 *
 * There is no form, because no inbox has been defined for one, and a form that
 * silently goes nowhere is worse than an address that works. Every channel is
 * a live link — `mailto:`, `tel:`, `wa.me` and the Instagram profile.
 *
 * The two URLs below are the only literals on the page. A URL is not translated
 * copy — it is the same string in both languages — so it lives here rather than
 * in the dictionary, where a translator could plausibly "fix" it.
 */
const WHATSAPP_URL = "https://wa.me/962772116067";
const INSTAGRAM_URL = "https://www.instagram.com/jofit_co";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/contact",
    title: t("contact.title"),
    description: t("contact.description"),
  });
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);

  /*
   * The email, the phone number and the opening hours are read from the `site.*`
   * keys the header and footer already render. One address, one source.
   *
   * A `tel:` target must be digits and a leading plus — the spaces that make the
   * number readable are stripped for the href and kept for the eye.
   */
  const email = t("site.contactEmail");
  const phone = t("site.contactPhone");
  const phoneHref = `tel:${phone.replace(/[^+\d]/g, "")}`;

  const routes = [
    { href: "/education", title: t("nav.education"), body: t("education.description"), icon: <RouteIcon kind="courses" /> },
    { href: "/quotations", title: t("nav.quotations"), body: t("quotations.description"), icon: <RouteIcon kind="quote" /> },
    { href: "/terms", title: t("nav.terms"), body: t("terms.description"), icon: <RouteIcon kind="terms" /> },
  ];

  return (
    <>
      <PageHero
        compact
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("nav.contact") }]}
        eyebrow={t("contact.eyebrow")}
        title={t("contact.title")}
        lead={t("contact.lead")}
        actions={
          <>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={buttonClasses({ variant: "gold", size: "lg" })}>
              <WhatsAppIcon />
              {t("landing.helpWhatsapp")}
              <VisuallyHidden>{t("contact.newTab")}</VisuallyHidden>
            </a>
            <a href={phoneHref} className={buttonClasses({ variant: "ghostDark", size: "lg" })}>
              <PhoneIcon />
              {t("contact.callAction")}
            </a>
          </>
        }
      />

      <Section labelledBy="contact-channels">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-12">
          <div>
            <SectionHead id="contact-channels" title={t("contact.channelsHeading")} lead={t("contact.channelsLead")} />

            <Reveal stagger as="ul" className="mt-10 grid gap-5 sm:grid-cols-2">
              <Channel href={`mailto:${email}`} label={t("contact.emailLabel")} value={email} valueDir="ltr" icon={<MailIcon />} />

              {/* A phone number is Latin digits and reads left to right in both
                  scripts; `dir` here stops Arabic reordering the country code. */}
              <Channel href={phoneHref} label={t("contact.phoneLabel")} value={phone} valueDir="ltr" icon={<PhoneIcon />} />

              <Channel
                href={WHATSAPP_URL}
                label={t("contact.whatsappLabel")}
                value={t("contact.whatsappValue")}
                icon={<WhatsAppIcon />}
                newTabLabel={t("contact.newTab")}
              />

              <Channel
                href={INSTAGRAM_URL}
                label={t("contact.instagramLabel")}
                value={t("contact.instagramValue")}
                valueDir="ltr"
                icon={<InstagramIcon />}
                newTabLabel={t("contact.newTab")}
              />
            </Reveal>
          </div>

          {/* THE OFFICE: where it is, when it answers, and what it is. */}
          <Reveal>
            <aside
              aria-labelledby="contact-details"
              className="relative isolate h-full overflow-hidden rounded-[2rem] bg-deep p-8 text-white/75 sm:p-10"
            >
              <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.04]" />
              <span aria-hidden="true" className="absolute -end-28 -bottom-28 -z-10 size-80 text-accent/15">
                <Rosette className="spin-slow size-full" />
              </span>

              <h2 id="contact-details" className="text-[1.5rem] leading-snug text-white">
                {t("contact.detailsHeading")}
              </h2>
              <span aria-hidden="true" className="mt-5 block h-px w-14 bg-accent" />

              <dl className="mt-8 space-y-7">
                <div className="flex gap-4">
                  <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-white/[0.07] text-accent ring-1 ring-white/15">
                    <PinIcon />
                  </span>
                  <div>
                    <dt className="text-[13px] text-white/55">{t("contact.officeLabel")}</dt>
                    <dd className="mt-1 font-heading text-[1.1rem] font-semibold text-white">{t("contact.officeValue")}</dd>
                    <dd className="mt-1.5 text-[14px] leading-relaxed">{t("contact.officeNote")}</dd>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-white/[0.07] text-accent ring-1 ring-white/15">
                    <ClockIcon />
                  </span>
                  <div>
                    <dt className="text-[13px] text-white/55">{t("contact.hoursLabel")}</dt>
                    <dd className="mt-1 font-heading text-[1.1rem] font-semibold text-white">{t("site.openingHours")}</dd>
                    <dd className="mt-1.5 text-[14px] leading-relaxed">{t("contact.weekendNote")}</dd>
                  </div>
                </div>
              </dl>

              <div className="mt-9 flex items-center gap-4 border-t border-white/15 pt-7">
                <Image
                  src="/images/partners/ncsf-seal.png"
                  alt={t("site.ncsfSealAlt")}
                  width={96}
                  height={96}
                  className="size-14 shrink-0 rounded-full bg-white p-1"
                />
                <p className="min-w-0">
                  <span className="block text-[12.5px] font-semibold text-accent">{t("contact.agencyLabel")}</span>
                  <span className="mt-1 block text-[14px] leading-relaxed text-white/80">{t("site.agencyStrip")}</span>
                </p>
              </div>
            </aside>
          </Reveal>
        </div>
      </Section>

      <Section tone="muted" labelledBy="contact-routes">
        <SectionHead id="contact-routes" eyebrow={t("contact.routesEyebrow")} title={t("contact.routesTitle")} />
        <Reveal stagger as="ul" className="mt-10 grid gap-5 md:grid-cols-3">
          {routes.map((route) => (
            <li key={route.href} className="flex">
              <Link
                href={localePath(locale, route.href)}
                className="group flex w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift"
              >
                <span
                  aria-hidden="true"
                  className="grid size-12 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
                >
                  {route.icon}
                </span>
                <span className="mt-5 font-heading text-[1.1rem] font-semibold text-ink">{route.title}</span>
                <span className="mt-2 text-[14px] leading-relaxed text-body">{route.body}</span>
                <span className="mt-auto flex justify-end pt-5 text-primary">
                  <span className="grid size-10 place-items-center rounded-full border border-line transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary">
                    <ArrowIcon />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </Reveal>
      </Section>
    </>
  );
}

/**
 * One way to reach the company.
 *
 * The whole card is the link, so its accessible name is "label + value" — for
 * example "Email m.ibdah@jofit.net" — which is descriptive on its own in a
 * screen reader's link list. That is why the label is not a heading: a heading
 * outside the link would leave the link named by the bare address.
 *
 * `newTabLabel` is only passed for the two off-site destinations, and it is the
 * warning, not the decision: a link that carries one also opens in a new tab.
 */
function Channel({
  href,
  label,
  value,
  valueDir,
  icon,
  newTabLabel,
}: {
  href: string;
  label: string;
  value: string;
  valueDir?: "ltr";
  icon: ReactNode;
  newTabLabel?: string;
}) {
  const external = Boolean(newTabLabel);

  return (
    <li className="flex">
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className="group flex w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift sm:p-7"
      >
        <span className="flex items-start justify-between gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15 ring-offset-4 ring-offset-surface transition-colors duration-300 group-hover:bg-primary group-hover:text-on-primary"
          >
            {icon}
          </span>
          <span aria-hidden="true" className="text-body/40 transition-colors group-hover:text-primary">
            <ArrowIcon />
          </span>
        </span>

        <span className="mt-6 block text-[13px] font-semibold text-accent-strong">{label}</span>
        {/* The direction goes on an inline run, so a Latin address keeps its
            order but still sits at the reading edge of an Arabic card. */}
        <span className="mt-1.5 block font-heading text-[1.1rem] leading-snug font-semibold wrap-break-word text-ink">
          <span {...(valueDir ? { dir: valueDir } : {})}>{value}</span>
        </span>
        {newTabLabel ? <VisuallyHidden>{newTabLabel}</VisuallyHidden> : null}
      </a>
    </li>
  );
}

/*
 * The icons are inline SVG, as everywhere else on this site: they inherit
 * `currentColor`, so they re-tint with the well on hover, and they carry no
 * accessible name of their own — the link's text is the name.
 */
function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="m3.2 6.6 8.8 6 8.8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.2 3.6h3.3l1.7 4.2-2.1 1.5a11.4 11.4 0 0 0 5.6 5.6l1.5-2.1 4.2 1.7v3.3a1.5 1.5 0 0 1-1.7 1.5A16.5 16.5 0 0 1 2.7 5.3a1.5 1.5 0 0 1 1.5-1.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.8 11.8 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function RouteIcon({ kind }: { kind: "courses" | "quote" | "terms" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {kind === "courses" ? (
        <>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
          <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5ZM9 8h7M9 11.5h5" />
        </>
      ) : kind === "quote" ? (
        <>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4V3h6v1M8.5 10h7M8.5 13.5h7M8.5 17h4" />
        </>
      ) : (
        <>
          <path d="M12 3 5 6v5c0 4.4 3 8.3 7 10 4-1.7 7-5.6 7-10V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </>
      )}
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
