import { getTranslator, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { ProseContact, ProsePage } from "../_components/prose-page";

/**
 * The privacy policy.
 *
 * Deliberately short. It states only the three commitments the company has
 * actually made — what is held, that the NCSF is the single recipient and only
 * for issuing certificates, and that online sales are encrypted. A policy that
 * describes practices the company does not follow (cookie banners, retention
 * schedules, data-subject rights) is a liability, so none of that is here.
 *
 * The WhatsApp URL is the only literal: it is an address, not copy. Every
 * string the reader sees comes from the dictionary, including the email and the
 * phone number, which are shared with the footer so they can never drift apart.
 */
const WHATSAPP_URL = "https://wa.me/962772116067";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/privacy",
    title: t("privacy.title"),
    description: t("privacy.description"),
  });
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);

  const email = t("site.contactEmail");
  const phone = t("site.contactPhone");

  return (
    <ProsePage
      locale={locale}
      eyebrow={t("privacy.eyebrow")}
      title={t("privacy.title")}
      lead={t("privacy.lead")}
      sections={[
        {
          id: "privacy-data",
          heading: t("privacy.dataHeading"),
          paragraphs: [t("privacy.dataBody")],
          items: [
            t("privacy.dataName"),
            t("privacy.dataEmail"),
            t("privacy.dataPhone"),
            t("privacy.dataPayment"),
          ],
        },
        {
          id: "privacy-sharing",
          heading: t("privacy.sharingHeading"),
          paragraphs: [t("privacy.sharingBody"), t("privacy.sharingPurpose")],
        },
        {
          id: "privacy-security",
          heading: t("privacy.securityHeading"),
          paragraphs: [t("privacy.securityBody")],
        },
      ]}
      footer={
        <ProseContact
          id="privacy-contact"
          heading={t("privacy.contactHeading")}
          body={t("privacy.contactBody")}
          channels={[
            { kind: "email", label: t("privacy.emailLabel"), value: email, href: `mailto:${email}`, ltr: true },
            { kind: "whatsapp", label: t("privacy.whatsappLabel"), value: phone, href: WHATSAPP_URL, ltr: true, external: true },
            { kind: "hours", label: t("privacy.hoursLabel"), value: t("privacy.hours") },
          ]}
        >
          {/* Written, not rendered: the date a policy was last revised is a fact
              about the document, so it lives in the dictionary and never moves
              on its own. */}
          <p className="mt-6 border-t border-line pt-5 text-[13px] text-body/70">{t("privacy.lastUpdated")}</p>
        </ProseContact>
      }
    />
  );
}
