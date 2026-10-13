import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonClasses } from "@/components/ui";
import { menuPagePath, menusService } from "@/features/menus";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { HelpBand } from "../../_components/help-band";
import { ProsePage } from "../../_components/prose-page";

/**
 * A PAGE STAFF WRITE. Every item in the header's Courses menu that points at a
 * page lands here; its eyebrow, title, summary, sections and call to action
 * are all edited in the admin (Content → Courses menu), in both languages.
 * A draft or deleted page is a 404, never an empty shell.
 *
 * It is a document, so it takes the prose shell; the page's own call to action
 * leads the hero, and the closing help band follows, because every one of these
 * pages is about a course somebody may want to take.
 */
export async function generateMetadata({ params }: PageProps<"/[locale]/specialisations/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const page = await menusService.getPage(slug, locale);
  if (!page) return {};
  return buildMetadata({ locale, path: menuPagePath(page.slug), title: page.title, description: page.summary });
}

/** Paragraphs are separated by blank lines in the editor. */
const paragraphs = (body: string) =>
  body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export default async function MenuPageRoute({ params }: PageProps<"/[locale]/specialisations/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const page = await menusService.getPage(slug, locale);
  if (!page) notFound();

  return (
    <>
      <ProsePage
        locale={locale}
        parents={[{ label: t("nav.specialisations"), href: localePath(locale, "/specialisations") }]}
        eyebrow={page.eyebrow || undefined}
        title={page.title}
        lead={page.summary || undefined}
        actions={
          <>
            {page.cta ? (
              <Link
                href={page.cta.href.startsWith("/") ? localePath(locale, page.cta.href) : page.cta.href}
                className={buttonClasses({ variant: "gold", size: "lg" })}
              >
                {page.cta.label}
              </Link>
            ) : null}
            <Link href={localePath(locale, "/specialisations")} className={buttonClasses({ variant: "ghostDark", size: "lg" })}>
              {t("education.pathLink")}
            </Link>
          </>
        }
        sections={page.sections.map((section) => ({
          id: `section-${section.id}`,
          heading: section.heading,
          paragraphs: paragraphs(section.body),
        }))}
      />
      <HelpBand locale={locale} topic="courses" />
    </>
  );
}
