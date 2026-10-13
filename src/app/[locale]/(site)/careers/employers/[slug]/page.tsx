import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { buttonClasses, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { careersService } from "@/features/careers";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { CertifyBand } from "../../_components/certify-band";
import { EmployerMark } from "../../_components/employer-mark";
import { BuildingIcon, GlobeIcon, MailIcon, PhoneIcon, PinIcon, ShieldIcon, UsersIcon } from "../../_components/icons";
import { JobCard } from "../../_components/job-card";

export async function generateMetadata({ params }: PageProps<"/[locale]/careers/employers/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const employer = await careersService.getEmployerBySlug(slug, locale);
  if (!employer) return buildMetadata({ locale, path: `/careers/employers/${slug}`, title: t("careers.employers.metaTitle"), noIndex: true });
  return buildMetadata({
    locale,
    path: `/careers/employers/${employer.slug}`,
    title: employer.name,
    description: employer.about.slice(0, 180),
    imageUrl: employer.logo && !employer.logo.url.startsWith("data:") ? employer.logo.url : undefined,
  });
}

/**
 * A COMPANY'S PAGE on the board — the formal detail recipe.
 *
 *   PageHero         the name and what kind of business it is; in the end
 *                    column the REGISTER CARD — the seal, "verified by
 *                    JoFit", the open-jobs figure, the facts, the way to its jobs
 *   about + contact  the company's own words beside how to reach them
 *   open jobs        its jobs as cards, or a way back to the board
 *   certify          the closing band
 *
 * Only verified employers have a page at all (`getEmployerBySlug` answers
 * `null` otherwise), which is what lets the card say "verified" plainly.
 */
export default async function EmployerPage({ params }: PageProps<"/[locale]/careers/employers/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const employer = await careersService.getEmployerBySlug(slug, locale);
  if (!employer) notFound();
  const jobs = await careersService.listJobs({ locale, employerSlug: employer.slug, pageSize: 24 });

  const facts: readonly { icon: ReactNode; label: string; value: string }[] = [
    { icon: <BuildingIcon size={16} />, label: t("careers.employer.factKind"), value: t(`careers.kind.${employer.kind}`) },
    ...(employer.city ? [{ icon: <PinIcon size={16} />, label: t("careers.job.factCity"), value: employer.city.name }] : []),
    ...(employer.size
      ? [{ icon: <UsersIcon size={16} />, label: t("careers.employer.factSize"), value: t(`careers.size.${employer.size}`) }]
      : []),
  ];

  /* The address is the employer's own; only a web address becomes a link, so a
     `javascript:` "website" can never run on a public page. */
  const website = employer.website && /^https?:\/\//i.test(employer.website) ? employer.website : undefined;
  const contact = [
    website
      ? {
          icon: <GlobeIcon size={16} />,
          label: t("careers.employer.website"),
          href: website,
          value: website.replace(/^https?:\/\//, "").replace(/\/$/, ""),
          external: true,
        }
      : null,
    employer.email
      ? { icon: <MailIcon size={16} />, label: t("careers.employer.email"), href: `mailto:${employer.email}`, value: employer.email }
      : null,
    employer.phone
      ? { icon: <PhoneIcon size={16} />, label: t("careers.employer.phone"), href: `tel:${employer.phone.replace(/\s+/g, "")}`, value: employer.phone }
      : null,
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("nav.careers"), href: localePath(locale, "/careers") },
          { label: t("careers.employers.eyebrow"), href: localePath(locale, "/careers/employers") },
          { label: employer.name },
        ]}
        eyebrow={t("careers.employers.eyebrow")}
        /* The name is the employer's own, so it keeps its own direction — on an
           inner span, so the heading still sits on the page's reading edge. */
        title={<span dir="auto">{employer.name}</span>}
        lead={[t(`careers.kind.${employer.kind}`), employer.city?.name].filter(Boolean).join(" · ")}
        aside={
          <div className="rounded-3xl bg-white p-6 text-ink shadow-lift sm:p-7">
            <div className="flex items-center gap-5">
              <EmployerMark name={employer.name} logo={employer.logo} size="lg" />
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-primary-05 px-2.5 py-1 text-[12px] font-semibold text-primary-dark">
                  <ShieldIcon size={13} />
                  {t("careers.employers.verified")}
                </p>
                {/* A figure over a bare noun: Arabic agreement changes with the number. */}
                <p className="mt-3">
                  <span className="block font-heading text-[2.25rem] leading-none font-bold text-primary" dir="ltr">
                    {number(employer.openJobCount)}
                  </span>
                  <span className="mt-1.5 block text-[13px] text-body">{t("careers.employers.openJobs")}</span>
                </p>
              </div>
            </div>
            <dl className="mt-6 divide-y divide-line border-t border-line">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-start gap-3 py-3.5">
                  <dt className="flex w-32 shrink-0 items-center gap-2 text-[13px] text-body">
                    <span aria-hidden="true" className="text-primary">
                      {fact.icon}
                    </span>
                    {fact.label}
                  </dt>
                  <dd className="min-w-0 text-[14px] font-semibold text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
            {employer.openJobCount > 0 ? (
              <a href="#employer-jobs" className={buttonClasses({ size: "lg", className: "mt-3 w-full" })}>
                {t("careers.employer.jobs")}
              </a>
            ) : (
              <p className="mt-3 rounded-2xl bg-canvas px-4 py-3 text-[13.5px] leading-relaxed text-body">
                {t("careers.employers.noOpenJobs")}
              </p>
            )}
          </div>
        }
      />

      <Section labelledBy="employer-about">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="min-w-0">
            <SectionHead id="employer-about" eyebrow={t(`careers.kind.${employer.kind}`)} title={t("careers.employer.about")} />
            <p className="mt-6 max-w-[68ch] text-[1.05rem] leading-[1.9] whitespace-pre-line text-body" dir="auto">
              {employer.about}
            </p>
          </div>

          <aside aria-labelledby="employer-contact" className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
              <h2 id="employer-contact" className="flex items-center gap-2 font-sans text-[13px] font-semibold text-ink">
                <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-primary-05 text-primary">
                  <MailIcon size={14} />
                </span>
                {t("careers.employer.contact")}
              </h2>
              <dl className="mt-5 space-y-4">
                {contact.map((row) => (
                  <div key={row.label}>
                    <dt className="flex items-center gap-2 text-[12.5px] text-body/80">
                      <span aria-hidden="true" className="text-primary">
                        {row.icon}
                      </span>
                      {row.label}
                    </dt>
                    <dd className="mt-1 ps-6">
                      <a
                        href={row.href}
                        dir="ltr"
                        {...("external" in row && row.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="text-[14.5px] font-medium break-all text-primary-dark underline-offset-4 hover:underline"
                      >
                        {row.value}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 rounded-2xl bg-canvas px-4 py-3 text-[13px] leading-relaxed text-body">
                {t("careers.employer.contactNote")}
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <Section id="employer-jobs" tone="muted" labelledBy="employer-jobs-heading" className="scroll-mt-6">
        <SectionHead
          id="employer-jobs-heading"
          eyebrow={employer.name}
          title={t("careers.employer.jobs")}
          actions={
            <Link href={localePath(locale, "/careers")} className={buttonClasses({ variant: "outline" })}>
              {t("careers.job.back")}
            </Link>
          }
        />
        {jobs.items.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-line bg-surface px-6 py-14 text-center shadow-soft">
            <p className="mx-auto max-w-[48ch] text-[15px] leading-relaxed text-body">{t("careers.employer.noJobs")}</p>
            <Link href={localePath(locale, "/careers")} className={buttonClasses({ className: "mt-6" })}>
              {t("careers.job.browse")}
            </Link>
          </div>
        ) : (
          <Reveal stagger as="ul" className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {jobs.items.map((job) => (
              <li key={job.id} className="flex min-w-0">
                <JobCard job={job} locale={locale} t={t} />
              </li>
            ))}
          </Reveal>
        )}
      </Section>

      <CertifyBand locale={locale} t={t} />
    </>
  );
}
