import Link from "next/link";

import { StateMessage } from "@/components/feedback";
import { buttonClasses, PageHero, Section } from "@/components/ui";
import { getTranslator, localePath, type Locale } from "@/i18n";

/**
 * THE COMMUNITY WHILE IT IS SWITCHED OFF.
 *
 * The route, its types and its service exist and compile; the feature is off
 * in `config/features.ts`. Rather than an empty page, the visitor gets the
 * site's own hero and a plain statement that the area is not open yet — and
 * two ways on, to the journal and to the team, so the page is not a dead end.
 */
export function CommunityUnavailable({ locale }: { locale: Locale }) {
  const t = getTranslator(locale);

  return (
    <>
      <PageHero
        compact
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("community.title") }]}
        title={t("community.title")}
        lead={t("community.description")}
      />
      <Section tone="muted">
        <div className="mx-auto max-w-xl">
          <StateMessage
            title={t("state.notAvailableTitle")}
            description={t("state.notAvailableBody", { feature: t("nav.community") })}
            action={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href={localePath(locale, "/blog")} className={buttonClasses()}>
                  {t("article.allArticles")}
                </Link>
                <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "outline" })}>
                  {t("nav.contact")}
                </Link>
              </div>
            }
          />
        </div>
      </Section>
    </>
  );
}
