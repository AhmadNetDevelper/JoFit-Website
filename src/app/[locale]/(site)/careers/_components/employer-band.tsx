import Link from "next/link";

import { buttonClasses, Reveal, Section, SectionHead } from "@/components/ui";
import { getFormatters, localePath, type Locale, type Translate } from "@/i18n";

/**
 * FOR EMPLOYERS — the other half of the board, on the deep band.
 *
 * What an employer gets, then the three steps from sign-up to a live job on a
 * gold line with numbered seals. A sequence because it genuinely is one: no
 * job carries a company's name before JoFit has verified the company. The
 * copy is the join page's own, so the board and the sign-up tell it the same
 * way.
 */
export function EmployerBand({ locale, t }: { locale: Locale; t: Translate }) {
  const { number } = getFormatters(locale);
  const steps = [
    { title: t("careers.join.step1"), body: t("careers.join.step1Body") },
    { title: t("careers.join.step2"), body: t("careers.join.step2Body") },
    { title: t("careers.join.step3"), body: t("careers.join.step3Body") },
  ];
  const signInHref = `${localePath(locale, "/sign-in/employer")}?next=${encodeURIComponent("/employer")}`;

  return (
    <Section tone="deep" labelledBy="careers-employers-band">
      <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
        <div>
          <SectionHead
            id="careers-employers-band"
            tone="dark"
            eyebrow={t("careers.join.eyebrow")}
            title={t("careers.board.ctaTitle")}
            lead={t("careers.board.ctaBody")}
          />
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link href={localePath(locale, "/careers/employers/join")} className={buttonClasses({ variant: "gold", size: "lg" })}>
              {t("careers.board.ctaAction")}
            </Link>
            <Link
              href={signInHref}
              className="text-[14px] font-semibold text-white/85 underline decoration-white/35 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
            >
              {t("careers.board.ctaSignIn")}
            </Link>
          </div>
        </div>

        <Reveal stagger as="ol" className="relative space-y-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative flex items-start gap-5 rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10 sm:p-6"
            >
              <span
                className="grid size-12 shrink-0 place-items-center rounded-full bg-deep-2 font-heading text-[15px] font-bold text-accent ring-1 ring-accent/50 ring-offset-4 ring-offset-deep"
                dir="ltr"
              >
                {number(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 pt-1">
                <span className="block font-heading text-[1.1rem] leading-snug font-semibold text-white">{step.title}</span>
                <span className="mt-1.5 block text-[14.5px] leading-relaxed text-white/65">{step.body}</span>
              </span>
            </li>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
