import Link from "next/link";

import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { ProseContact, ProsePage } from "../_components/prose-page";

/**
 * The terms a trainee agrees to when they register on a course.
 *
 * Every clause here traces back to something the client actually stated. The
 * refund clause is deliberately open: the client has not yet fixed the window
 * or the percentage, so the page promises the two routes that do exist — a
 * refund under the conditions that apply before a course begins, and deferral
 * to the next group — and sends the reader to the team for the specifics.
 * Inventing "14 days" or "50%" here would be inventing policy, and a legal
 * page is the worst place to guess.
 */

/** Verified: the client's WhatsApp Business number. */
const WHATSAPP_URL = "https://wa.me/962772116067";

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/terms",
    title: t("terms.title"),
    description: t("terms.description"),
  });
}

export default async function TermsPage({ params }: PageProps<"/[locale]/terms">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);

  return (
    <ProsePage
      locale={locale}
      eyebrow={t("terms.eyebrow")}
      title={t("terms.title")}
      lead={t("terms.lead")}
      sections={[
        {
          id: "terms-registration",
          heading: t("terms.registrationHeading"),
          paragraphs: [t("terms.registrationBody")],
          items: [
            t("terms.registrationItemSeat"),
            t("terms.registrationItemPending"),
            t("terms.registrationItemDetails"),
          ],
        },
        {
          id: "terms-refunds",
          heading: t("terms.refundsHeading"),
          paragraphs: [t("terms.refundsBody"), t("terms.refundsContact")],
          items: [t("terms.refundsItemRefund"), t("terms.refundsItemDefer")],
        },
        {
          id: "terms-certificates",
          heading: t("terms.certificatesHeading"),
          paragraphs: [t("terms.certificatesBody")],
          items: [
            t("terms.certificatesItemHours"),
            t("terms.certificatesItemExam"),
            t("terms.certificatesItemIssue"),
          ],
        },
      ]}
      footer={
        <ProseContact
          id="terms-contact"
          heading={t("terms.contactHeading")}
          body={t("terms.contactBody")}
          channels={[
            {
              kind: "email",
              label: t("terms.emailLabel"),
              value: t("site.contactEmail"),
              href: `mailto:${t("site.contactEmail")}`,
              ltr: true,
            },
            {
              kind: "whatsapp",
              label: t("terms.whatsappLabel"),
              value: t("site.contactPhone"),
              href: WHATSAPP_URL,
              ltr: true,
              external: true,
            },
            { kind: "hours", label: t("terms.hoursLabel"), value: t("site.openingHours") },
          ]}
        >
          {/* The registration clause says details are "handled as described in
              our privacy policy"; an unlinked cross-reference in a legal
              document is a dead end. */}
          <p className="mt-6">
            <Link
              href={localePath(locale, "/privacy")}
              className="text-[15px] font-semibold text-primary-dark underline decoration-accent underline-offset-4 transition-colors hover:text-primary"
            >
              {t("terms.privacyLink")}
            </Link>
          </p>

          {/* Dated by hand, not by `new Date()`: the line states when the text
              last changed, which is not the same as when the page rendered. */}
          <p className="mt-6 border-t border-line pt-5 text-[13px] leading-relaxed text-body/70">
            {t("terms.lastUpdated")}
            <span className="block">{t("terms.versionNote")}</span>
          </p>
        </ProseContact>
      }
    />
  );
}
