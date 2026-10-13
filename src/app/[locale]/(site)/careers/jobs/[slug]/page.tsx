import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { buttonClasses, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { authService, type Account } from "@/features/auth";
import { careersService, type CandidateApplication, type JobPosting } from "@/features/careers";
import { getFormatters, getTranslator, LOCALE_TAGS, localePath, resolveLocale, type Locale, type Translate } from "@/i18n";
import { absoluteUrl, buildMetadata } from "@/lib";

import { CertifyBand } from "../../_components/certify-band";
import { EmployerMark } from "../../_components/employer-mark";
import { closesLabel, postedLabel, salaryLabel } from "../../_components/format";
import {
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  ChatIcon,
  CheckIcon,
  LevelIcon,
  StarIcon,
  UsersIcon,
  WalletIcon,
} from "../../_components/icons";
import { JobCard } from "../../_components/job-card";
import { jobPostingJsonLd, safeJsonLdScriptProps } from "../../_components/job-posting-json-ld";
import { ApplicationStatusBadge } from "../../_components/status-badge";

export async function generateMetadata({ params }: PageProps<"/[locale]/careers/jobs/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const job = await careersService.getJobBySlug(slug, locale);
  if (!job) return buildMetadata({ locale, path: `/careers/jobs/${slug}`, title: t("careers.board.metaTitle"), noIndex: true });
  return buildMetadata({
    locale,
    path: `/careers/jobs/${job.slug}`,
    title: `${job.title} · ${job.employer.name}`,
    description: job.city
      ? t("careers.job.metaDescription", { title: job.title, employer: job.employer.name, city: job.city.name })
      : undefined,
    /* A closed job stays readable for the people who have the link, but it
       is no longer a result anybody should land on from a search. */
    noIndex: !job.acceptingApplications,
  });
}

/**
 * A JOB'S PAGE — the formal detail recipe.
 *
 * It answers, in order: what is the job, is it for me, and how do I apply.
 *
 *   PageHero        the field, the title, who is hiring; in the end column the
 *                   APPLY CARD — the terms a candidate checks before reading a
 *                   word, and the one next step for whoever is looking
 *   the body        the employer's own words (the role, what you bring, what
 *                   they offer) beside a sticky aside: the employer, the
 *                   working languages, the sports, and the next step again
 *   more from them  the company's other open jobs, when there are any
 *   certify         the closing band
 *
 * The apply card is the only part that depends on who is looking — signed
 * out, a candidate who has applied, one who has not, or an employer or coach
 * who cannot apply from the account they are in.
 */
export default async function JobPage({ params }: PageProps<"/[locale]/careers/jobs/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const f = getFormatters(locale);

  const job = await careersService.getJobBySlug(slug, locale);
  if (!job) notFound();

  const session = await authService.getSession();
  const account = session?.account ?? null;
  const [mine, more] = await Promise.all([
    account?.role === "customer" && account.customerId
      ? careersService.findMyApplication(account.customerId, job.id, locale)
      : Promise.resolve(null),
    careersService.listJobs({ locale, employerSlug: job.employer.slug, pageSize: 4 }),
  ]);
  const others = more.items.filter((entry) => entry.id !== job.id).slice(0, 3);
  /* The live job carries neither of these for its employer. `more` is the
     board filtered to this employer, so its total IS their open-job count. */
  const employerOpenJobs = job.employer.openJobCount ?? more.meta.totalItems;
  const employerLine = [t(`careers.kind.${job.employer.kind}`), job.employer.city?.name].filter(Boolean).join(" · ");

  const jobPath = `/careers/jobs/${job.slug}`;
  const employerPath = `/careers/employers/${job.employer.slug}`;
  const salary = salaryLabel(job.salary, t, f);
  const action = nextStep(job, account, mine, locale, t, jobPath);
  const languages = new Intl.ListFormat(LOCALE_TAGS[locale], { type: "conjunction" }).format(
    job.languages.map((language) => t(`careers.lang.${language}`)),
  );

  const facts: readonly { icon: ReactNode; label: string; value: ReactNode }[] = [
    { icon: <BriefcaseIcon size={16} />, label: t("careers.job.factType"), value: t(`careers.type.${job.employmentType}`) },
    { icon: <BuildingIcon size={16} />, label: t("careers.job.factMode"), value: t(`careers.mode.${job.workMode}`) },
    { icon: <LevelIcon size={16} />, label: t("careers.job.factLevel"), value: t(`careers.level.${job.experienceLevel}`) },
    { icon: <UsersIcon size={16} />, label: t("careers.job.factPositions"), value: <span dir="ltr">{f.number(job.positions)}</span> },
    /* A closed job with no closing date has no "apply by" to state — and
       "open until filled" would be untrue of it. */
    ...(job.closesOn || job.acceptingApplications
      ? [
          {
            icon: <CalendarIcon size={16} />,
            label: t("careers.job.factCloses"),
            value: job.closesOn ? f.date(job.closesOn) : t("careers.card.untilFilled"),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("nav.careers"), href: localePath(locale, "/careers") },
          { label: job.title },
        ]}
        eyebrow={job.category?.name}
        /* The title is the employer's own words, so it keeps its own
           direction — on an inner span, so the heading still sits on the
           page's reading edge. */
        title={<span dir="auto">{job.title}</span>}
        lead={
          <Link href={localePath(locale, employerPath)} className="group inline-flex items-center gap-4">
            <EmployerMark name={job.employer.name} logo={job.employer.logo} size="md" />
            <span className="min-w-0">
              <span className="block font-heading text-[1.05rem] font-semibold text-white transition-colors group-hover:text-accent" dir="auto">
                {job.employer.name}
              </span>
              <span className="mt-0.5 block text-[14px] text-white/65">{employerLine}</span>
            </span>
          </Link>
        }
        actions={
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px] text-white/65">
            {job.featured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-[12px] font-semibold text-deep">
                <StarIcon size={11} />
                {t("careers.card.featured")}
              </span>
            ) : null}
            {job.postedAt ? (
              <>
                <span>{postedLabel(job.postedAt, locale, t, f)}</span>
                <span aria-hidden="true" className="text-white/30">
                  ·
                </span>
              </>
            ) : null}
            {/* The code is a Latin token inside a sentence: isolated left to
                right, so its hyphens and digits keep their order in Arabic. */}
            <span>{t("careers.job.reference", { reference: `⁦${job.reference}⁩` })}</span>
          </p>
        }
        aside={
          <ApplyCard job={job} account={account} mine={mine} locale={locale} t={t} salary={salary} facts={facts} action={action} />
        }
      />

      <Section labelledBy="job-role">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="min-w-0">
            <SectionHead id="job-role" eyebrow={job.employer.name} title={t("careers.job.description")} />
            <p className="mt-6 max-w-[68ch] text-[1.05rem] leading-[1.9] whitespace-pre-line text-body" dir="auto">
              {job.description}
            </p>

            {job.requirements.length > 0 ? (
              <ListBlock id="job-requirements" title={t("careers.job.requirements")} items={job.requirements} />
            ) : null}
            {job.benefits.length > 0 ? (
              <ListBlock id="job-benefits" title={t("careers.job.benefits")} items={job.benefits} tone="gold" />
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <SideCard icon={<BuildingIcon size={15} />} title={t("careers.job.employer")} id="job-employer">
              <div className="flex items-center gap-3.5">
                <EmployerMark name={job.employer.name} logo={job.employer.logo} size="sm" />
                <div className="min-w-0">
                  <p className="font-heading text-[15px] leading-snug font-semibold text-ink" dir="auto">
                    {job.employer.name}
                  </p>
                  <p className="mt-0.5 text-[13px] text-body/80">{employerLine}</p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4 border-t border-line pt-4">
                {/* A figure over a bare noun: Arabic agreement changes with the number. */}
                <p>
                  <span className="block font-heading text-[22px] leading-none font-bold text-primary" dir="ltr">
                    {f.number(employerOpenJobs)}
                  </span>
                  <span className="mt-1 block text-[12px] text-body/75">{t("careers.job.employerOpen")}</span>
                </p>
                <Link href={localePath(locale, employerPath)} className={buttonClasses({ variant: "outline", size: "sm" })}>
                  {t("careers.job.employerLink")}
                </Link>
              </div>
            </SideCard>

            <SideCard icon={<ChatIcon size={15} />} title={t("careers.job.factLanguages")}>
              <p className="text-[14px] text-body">{languages}</p>
            </SideCard>

            {job.sports.length > 0 ? (
              <SideCard icon={<StarIcon size={13} />} title={t("careers.job.sports")}>
                <ul className="flex flex-wrap gap-2">
                  {job.sports.map((sport) => (
                    <li key={sport.id}>
                      <Link
                        href={localePath(locale, `/sports/${sport.slug}`)}
                        className="inline-block rounded-full bg-primary-05 px-3 py-1.5 text-[13px] font-medium text-primary-dark transition-colors hover:bg-primary hover:text-on-primary"
                      >
                        {sport.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </SideCard>
            ) : null}

            {/* The next step again, for the reader who has scrolled through the
                role: the same link the apply card holds. */}
            {action ? (
              <div className="relative isolate overflow-hidden rounded-3xl bg-deep p-5 text-white/75">
                <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.04]" />
                <p className="font-heading text-[15px] font-semibold text-white">{action.title}</p>
                <p className="mt-1 text-[13px] text-white/60">
                  {job.acceptingApplications ? closesLabel(job.closesOn, t, f) : t("careers.job.closedBody")}
                </p>
                <Link href={action.href} className={buttonClasses({ variant: "gold", className: "mt-4 w-full" })}>
                  {action.label}
                </Link>
              </div>
            ) : null}
          </aside>
        </div>
      </Section>

      {others.length > 0 ? (
        <Section tone="muted" labelledBy="job-more">
          <SectionHead
            id="job-more"
            eyebrow={job.employer.name}
            title={t("careers.job.moreFrom")}
            actions={
              <Link href={localePath(locale, employerPath)} className={buttonClasses({ variant: "outline" })}>
                {t("careers.job.employerLink")}
              </Link>
            }
          />
          <Reveal stagger as="ul" className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {others.map((entry) => (
              <li key={entry.id} className="flex min-w-0">
                <JobCard job={entry} locale={locale} t={t} />
              </li>
            ))}
          </Reveal>
        </Section>
      ) : null}

      <CertifyBand locale={locale} t={t} />

      {job.acceptingApplications ? (
        <script
          {...safeJsonLdScriptProps(
            jobPostingJsonLd(job, {
              job: absoluteUrl(localePath(locale, jobPath)),
              employer: absoluteUrl(localePath(locale, employerPath)),
            }),
          )}
        />
      ) : null}
    </>
  );
}

/**
 * The reader's one next step, or none: follow the application they sent,
 * browse on from a closed job, sign in to apply, or apply. An employer or a
 * coach cannot apply from the account they are in, so they get no button.
 */
function nextStep(
  job: JobPosting,
  account: Account | null,
  mine: CandidateApplication | null,
  locale: Locale,
  t: Translate,
  jobPath: string,
): { title: string; label: string; href: string } | null {
  /* A candidate's live application is shown even on a closed job: it is still
     theirs to follow. */
  if (mine) {
    return { title: t("careers.job.appliedTitle"), label: t("careers.job.appliedLink"), href: localePath(locale, "/account/applications") };
  }
  if (!job.acceptingApplications) {
    return { title: t("careers.job.closedTitle"), label: t("careers.job.browse"), href: localePath(locale, "/careers") };
  }
  if (!account) {
    return {
      title: t("careers.job.applyTitle"),
      label: t("careers.job.signInToApply"),
      href: `${localePath(locale, "/sign-in")}?next=${encodeURIComponent(jobPath)}`,
    };
  }
  if (account.role !== "customer") return null;
  return { title: t("careers.job.applyTitle"), label: t("careers.job.applyNow"), href: localePath(locale, `${jobPath}/apply`) };
}

/**
 * THE APPLY CARD — the white card in the hero's end column: whether the job
 * is open and until when, the terms, and the next step for this reader.
 */
function ApplyCard({
  job,
  account,
  mine,
  locale,
  t,
  salary,
  facts,
  action,
}: {
  job: JobPosting;
  account: Account | null;
  mine: CandidateApplication | null;
  locale: Locale;
  t: Translate;
  salary: string | undefined;
  facts: readonly { icon: ReactNode; label: string; value: ReactNode }[];
  action: ReturnType<typeof nextStep>;
}) {
  const f = getFormatters(locale);
  const title = mine
    ? t("careers.job.appliedTitle")
    : job.acceptingApplications
      ? t("careers.job.applyTitle")
      : t("careers.job.closedTitle");

  return (
    <section id="apply" aria-labelledby="apply-heading" className="scroll-mt-28 rounded-3xl bg-white p-6 text-ink shadow-lift sm:p-7">
      <h2 id="apply-heading" className="font-heading text-[1.2rem] leading-snug text-ink">
        {title}
      </h2>
      {/* Closed says so in the title; an open job says until when. */}
      {job.acceptingApplications ? (
        <p className="stock-signal mt-2" data-stock="in-stock">
          {closesLabel(job.closesOn, t, f)}
        </p>
      ) : null}

      {/* The salary first and on its own: it is the fact a candidate checks
          before any other, and a range with its period needs the width. */}
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-canvas px-4 py-3.5">
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-10 text-accent-strong">
          <WalletIcon size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] text-body">{t("careers.job.factSalary")}</p>
          {salary ? (
            <p className="mt-0.5 font-heading text-[15.5px] leading-snug font-semibold text-ink">{salary}</p>
          ) : (
            <p className="mt-0.5 text-[14px] text-body/80">{t("careers.card.salaryHidden")}</p>
          )}
        </div>
      </div>

      <dl className="mt-3 divide-y divide-line">
        {facts.map((fact) => (
          <div key={fact.label} className="flex items-start gap-3 py-3">
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

      <div className="mt-2 border-t border-line pt-5">
        {mine ? (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <ApplicationStatusBadge status={mine.status} t={t} />
            <span className="text-[13px] text-body/80">{t("careers.job.appliedOn", { date: f.date(mine.submittedAt) })}</span>
          </div>
        ) : !job.acceptingApplications ? (
          <p className="mb-4 text-[14px] leading-relaxed text-body">{t("careers.job.closedBody")}</p>
        ) : account && account.role !== "customer" ? (
          <p className="rounded-2xl bg-canvas px-4 py-3 text-[13.5px] leading-relaxed text-body">{t("careers.job.otherRole")}</p>
        ) : (
          <p className="mb-4 text-[14px] leading-relaxed text-body">{t("careers.job.applyLead")}</p>
        )}

        {action ? (
          <Link
            href={action.href}
            className={buttonClasses({ variant: mine || !job.acceptingApplications ? "outline" : "primary", size: "lg", className: "w-full" })}
          >
            {action.label}
          </Link>
        ) : null}

        {!account && job.acceptingApplications && !mine ? (
          <p className="mt-4 text-center text-[13.5px] text-body">
            {t("careers.job.noAccount")}{" "}
            <Link
              href={`${localePath(locale, "/sign-up")}?next=${encodeURIComponent(`/careers/jobs/${job.slug}`)}`}
              className="font-semibold text-primary-dark underline-offset-4 hover:underline"
            >
              {t("careers.job.createAccount")}
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ListBlock({
  id,
  title,
  items,
  tone = "green",
}: {
  id: string;
  title: string;
  items: readonly string[];
  tone?: "green" | "gold";
}) {
  return (
    <section aria-labelledby={id} className="mt-14">
      <h2 id={id} className="text-[1.6rem] leading-tight sm:text-[1.85rem]">
        {title}
      </h2>
      <Reveal stagger as="ul" className="mt-7 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          /* The whole item takes the direction of what the employer wrote, the
             tick included: a wrapped English line hanging off a tick on the
             right reads as broken, and it matches the description above. */
          <li key={item} dir="auto" className="flex items-start gap-3 rounded-2xl border border-line bg-canvas px-4 py-3.5">
            <span
              aria-hidden="true"
              className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                tone === "gold" ? "bg-accent text-deep" : "bg-primary text-on-primary"
              }`}
            >
              <CheckIcon size={12} />
            </span>
            <span className="text-[15px] leading-relaxed text-ink">{item}</span>
          </li>
        ))}
      </Reveal>
    </section>
  );
}

function SideCard({ icon, title, id, children }: { icon: ReactNode; title: string; id?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
      <h2 id={id} className="mb-3 flex items-center gap-2 font-sans text-[13px] font-semibold text-ink">
        <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-primary-05 text-primary">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
