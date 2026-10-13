import { getTranslator, type Locale } from "@/i18n";

import { SupportChat } from "./support-chat";

/** The client's WhatsApp Business number (also on the contact and nutrition pages). */
const WHATSAPP_URL = "https://wa.me/962772116067";

/** The chat bubble with its words already translated — the client gets strings, not the dictionary. */
export function SiteSupport({ locale }: { locale: Locale }) {
  const t = getTranslator(locale);
  return (
    <SupportChat
      locale={locale}
      whatsappUrl={WHATSAPP_URL}
      labels={{
        whatsapp: t("support.whatsapp"),
        scrollTop: t("support.scrollTop"),
        open: t("support.open"),
        close: t("support.close"),
        title: t("support.title"),
        intro: t("support.intro"),
        name: t("support.name"),
        email: t("support.email"),
        message: t("support.message"),
        placeholder: t("support.placeholder"),
        send: t("support.send"),
        sending: t("support.sending"),
        you: t("support.you"),
        staff: t("support.staff"),
        closed: t("support.closed"),
        error: t("support.error"),
        reference: t("support.reference", { reference: "{reference}" }),
      }}
    />
  );
}
