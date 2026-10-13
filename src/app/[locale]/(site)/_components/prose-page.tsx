import type { ReactNode } from "react";

import { PageHero, Section, type Crumb } from "@/components/ui";
import { getFormatters, getTranslator, localePath, type Locale } from "@/i18n";

/**
 * THE DOCUMENT SHELL — the formal design's prose page.
 *
 * Every page whose job is to be *read* rather than used — terms, privacy, the
 * nutrition note, the pages staff write for the Courses menu — takes this shape
 * instead of inventing its own:
 *
 *   PageHero (compact)   breadcrumbs, eyebrow, the page's one `<h1>`, the lead
 *   Section (surface)    the document at a reading measure, its clauses
 *                        numbered in gold like a formal instrument, beside a
 *                        sticky contents list on wide screens
 *
 * One place decides the reading measure, the rhythm between sections and how a
 * heading relates to its body, so a new document is a data structure rather
 * than a layout problem.
 *
 * WHY THE HEADINGS ARE DATA. `sections` is a list, not children. That keeps the
 * document's structure checkable — every section has exactly one `<h2>`, the
 * order is the order of the array, and the contents list is built from the same
 * array so it can never disagree with the page — and it means a document can
 * come from the backend, which is where policy text belongs.
 */
export interface ProseSection {
  readonly id: string;
  readonly heading: string;
  /** Kept separate from `items` so a section can introduce its own list. */
  readonly paragraphs?: readonly string[];
  readonly items?: readonly string[];
}

export interface ProsePageProps {
  readonly locale: Locale;
  readonly eyebrow?: string;
  readonly title: string;
  readonly lead?: string;
  /** Crumbs between Home and this page (Home and the page itself are added). */
  readonly parents?: readonly Crumb[];
  /** Hero actions — "See the course" on a page that belongs to one. */
  readonly actions?: ReactNode;
  readonly sections: readonly ProseSection[];
  /** Contact details, a signature line — whatever closes the document. */
  readonly footer?: ReactNode;
  /** Extra cards under the contents list in the sticky side column. */
  readonly aside?: ReactNode;
}

export function ProsePage({ locale, eyebrow, title, lead, parents = [], actions, sections, footer, aside }: ProsePageProps) {
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);
  const ordinal = (index: number) => number(index + 1).padStart(2, "0");
  const contents = sections.length > 1;

  return (
    <>
      <PageHero
        compact
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, ...parents, { label: title }]}
        eyebrow={eyebrow}
        title={title}
        lead={lead}
        actions={actions}
      />

      <Section>
        <div className={contents || aside ? "grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-20" : ""}>
          <article className="max-w-3xl">
            <div className="space-y-14">
              {sections.map((section, index) => (
                <section key={section.id} aria-labelledby={section.id} className="scroll-mt-28">
                  <p aria-hidden="true" className="flex items-center gap-3 font-heading text-[14px] font-bold text-accent-strong">
                    <span dir="ltr">{ordinal(index)}</span>
                    <span className="h-px w-10 bg-accent/60" />
                  </p>
                  <h2 id={section.id} className="mt-3 text-[1.55rem] leading-snug sm:text-2xl">
                    {section.heading}
                  </h2>

                  {section.paragraphs?.map((paragraph, key) => (
                    <p key={key} className="mt-4 text-[1.02rem] leading-relaxed text-body">
                      {paragraph}
                    </p>
                  ))}

                  {section.items?.length ? (
                    <ul className="mt-5 list-disc space-y-3 ps-5 marker:text-accent">
                      {section.items.map((item) => (
                        <li key={item} className="ps-1.5 text-[1.02rem] leading-relaxed text-body">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>

            {footer ? <div className="mt-16">{footer}</div> : null}
          </article>

          {contents || aside ? (
            <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
              {contents ? (
                /* The contents list is a wide-screen aid: on a phone the
                   document is one column and the list would only push it down. */
                <nav aria-labelledby="prose-contents" className="rounded-3xl border border-line bg-canvas p-6 max-lg:hidden">
                  <h2 id="prose-contents" className="font-sans text-[13px] font-semibold text-ink">
                    {t("prose.contents")}
                  </h2>
                  <ol className="mt-4 space-y-1">
                    {sections.map((section, index) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="group flex items-baseline gap-3 rounded-xl px-2 py-2 text-[14px] leading-snug text-body transition-colors hover:bg-surface hover:text-primary-dark"
                        >
                          <span dir="ltr" className="shrink-0 font-heading text-[12px] font-bold text-accent-strong">
                            {ordinal(index)}
                          </span>
                          <span>{section.heading}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              ) : null}
              {aside}
            </aside>
          ) : null}
        </div>
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------------- */

export interface ProseChannel {
  readonly kind: "email" | "whatsapp" | "phone" | "hours";
  readonly label: string;
  readonly value: string;
  readonly href?: string;
  /** A bare Latin token — an address, a phone number — kept in reading order. */
  readonly ltr?: boolean;
  readonly external?: boolean;
}

/**
 * THE DOCUMENT'S CLOSING PANEL: who to ask, and how.
 *
 * Terms, privacy and the nutrition note all end with the same three lines —
 * email, WhatsApp, hours — under a heading of their own. One panel draws them,
 * so the channels look the same on every document and on the contact page.
 */
export function ProseContact({
  id,
  heading,
  body,
  channels,
  children,
}: {
  id: string;
  heading: string;
  body?: string;
  channels: readonly ProseChannel[];
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="rounded-3xl border border-line bg-canvas p-6 sm:p-8">
      <h2 id={id} className="text-[1.35rem] leading-snug sm:text-[1.5rem]">
        {heading}
      </h2>
      {body ? <p className="mt-3 text-[1.02rem] leading-relaxed text-body">{body}</p> : null}

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        {channels.map((channel) => {
          const value = (
            <span dir={channel.ltr ? "ltr" : undefined} className="wrap-break-word">
              {channel.value}
            </span>
          );
          return (
            <div
              key={channel.kind}
              className={`flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 ${channel.kind === "hours" ? "sm:col-span-2" : ""}`}
            >
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
              >
                <ChannelIcon kind={channel.kind} />
              </span>
              <div className="min-w-0">
                <dt className="text-[12.5px] text-body/75">{channel.label}</dt>
                <dd className="mt-0.5 text-[15px] font-semibold text-ink">
                  {channel.href ? (
                    <a
                      href={channel.href}
                      {...(channel.external ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="underline decoration-accent/70 underline-offset-4 transition-colors hover:text-primary-dark"
                    >
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>

      {children}
    </section>
  );
}

function ChannelIcon({ kind }: { kind: ProseChannel["kind"] }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {kind === "email" ? (
        <>
          <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
          <path d="m3.2 6.6 8.8 6 8.8-6" />
        </>
      ) : kind === "whatsapp" ? (
        <>
          <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.5-4.3a8.5 8.5 0 1 1 15.5-4.6Z" />
          <path d="M9 8.5c0 3.6 2.9 6.5 6.5 6.5l1-1.6-2-1-1 .9a4.4 4.4 0 0 1-2.8-2.8l.9-1-1-2L9 8.5Z" />
        </>
      ) : kind === "phone" ? (
        <path d="M4.2 3.6h3.3l1.7 4.2-2.1 1.5a11.4 11.4 0 0 0 5.6 5.6l1.5-2.1 4.2 1.7v3.3a1.5 1.5 0 0 1-1.7 1.5A16.5 16.5 0 0 1 2.7 5.3a1.5 1.5 0 0 1 1.5-1.7Z" />
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      )}
    </svg>
  );
}
