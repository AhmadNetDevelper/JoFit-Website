import Link from "next/link";
import type { ReactNode } from "react";

import {
  buttonClasses,
  Card,
  Field,
  inputClasses,
  labelClasses,
  PageHero,
  Reveal,
  Rosette,
  Section,
  SectionHead,
  selectClasses,
  textareaClasses,
} from "@/components/ui";
import { quotationsService, type QuotationSubjectKind } from "@/features/quotations";
import { getFormatters, getTranslator, localePath, resolveLocale, type TranslationKey } from "@/i18n";
import { buildMetadata } from "@/lib";

import { ActionForm, type FormState } from "../_components/portal/action-form";
import { failed, succeeded } from "../_components/portal/form-state";
import { BoxIcon, BuildingIcon, LayersIcon, MailIcon, StackIcon, UsersIcon, WhatsappIcon } from "./_components/icons";

export async function generateMetadata({ params }: PageProps<"/[locale]/quotations">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/quotations",
    title: t("quotations.title"),
    description: t("quotations.description"),
  });
}

/** A subject's glyph. Keyed by `kind`, which is a closed union the service owns. */
const SUBJECT_ICONS: Readonly<Record<QuotationSubjectKind, ReactNode>> = {
  "gym-equipment": <StackIcon size={24} />,
  facility: <BuildingIcon size={24} />,
  "bulk-order": <BoxIcon size={24} />,
  "custom-equipment": <LayersIcon size={24} />,
  corporate: <UsersIcon size={24} />,
};

/**
 * REQUESTING A QUOTATION — the formal design's form page.
 *
 *   PageHero   who it is for, and the two ways in: the form, or WhatsApp
 *   subjects   what a quote can cover, each with a pre-addressed e-mail
 *   needs      the three things that turn an enquiry into a price, numbered —
 *              genuinely a sequence: you cannot be quoted before you have said
 *              what for
 *   form       the request form in a card, beside a deep panel with the
 *              direct channels (e-mail, WhatsApp, the number written out)
 *
 * ---------------------------------------------------------------------------
 * THE FORM FILES INTO A REAL INBOX: the admin's quotations inbox, where staff
 * assign, quote and close each request, and it hands back a reference. The
 * e-mail and WhatsApp routes stay beside it, because a quotation is a business
 * decision and plenty of people would rather talk than type.
 *
 * What happens after a quote is sent (approvals, SLAs, turning a won quote into
 * an order) remains an OPEN BUSINESS DECISION — see `features/quotations`.
 */
export default async function QuotationsPage({ params }: PageProps<"/[locale]/quotations">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const subjects = await quotationsService.listSubjects(locale);

  /* The real channels. Both are verified client details; neither is a
     placeholder, which is the whole reason the page can lean on them. */
  const email = t("site.contactEmail");
  const phoneDigits = t("site.contactPhone").replace(/[^+\d]/g, "");
  const whatsapp = `https://wa.me/${phoneDigits.replace(/^\+/, "")}`;

  const mailFor = (subjectName: string) =>
    `mailto:${email}?subject=${encodeURIComponent(t("quotations.mailSubject", { subject: subjectName }))}`;

  const fallback = t("state.errorTitle");
  const received = t("quotations.formReceived", { reference: "{reference}" });

  async function submit(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const quantity = Number(formData.get("quantityEstimate") ?? "");
    try {
      const { reference } = await quotationsService.submitRequest({
        subjectKind: String(formData.get("subjectKind") ?? "") as QuotationSubjectKind,
        organisationName: String(formData.get("organisationName") ?? ""),
        contactName: String(formData.get("contactName") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? "") || undefined,
        preferredContact: formData.get("preferredContact") === "phone" ? "phone" : "email",
        sportIds: [],
        quantityEstimate: Number.isFinite(quantity) && quantity > 0 ? quantity : undefined,
        message: String(formData.get("message") ?? ""),
      });
      return succeeded(received.replace("{reference}", reference));
    } catch (error) {
      return failed(error, fallback);
    }
  }

  const optional = <span className="ms-1.5 text-[13px] font-normal text-body/60">{t("booking.goalOptional")}</span>;

  const formFields = [
    { name: "organisationName", label: t("quotations.formOrganisation"), type: "text", required: true, autoComplete: "organization", wide: true },
    { name: "contactName", label: t("quotations.formName"), type: "text", required: true, autoComplete: "name" },
    { name: "email", label: t("signIn.email"), type: "email", required: true, autoComplete: "email", dir: "ltr" as const },
    { name: "phone", label: t("booking.phone"), type: "tel", required: false, autoComplete: "tel", dir: "ltr" as const },
    { name: "quantityEstimate", label: t("quotations.formQuantity"), type: "number", required: false, autoComplete: "off", dir: "ltr" as const },
  ];

  const needs: { key: TranslationKey; body: TranslationKey }[] = [
    { key: "quotations.need1", body: "quotations.need1Body" },
    { key: "quotations.need2", body: "quotations.need2Body" },
    { key: "quotations.need3", body: "quotations.need3Body" },
  ];

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("nav.quotations") }]}
        eyebrow={t("quotations.eyebrow")}
        title={t("quotations.heroTitle")}
        lead={t("quotations.heroLead")}
        actions={
          <>
            <Link href="#quotation-form" className={buttonClasses({ variant: "gold", size: "lg" })}>
              {t("quotations.formTitle")}
            </Link>
            <a href={whatsapp} target="_blank" rel="noreferrer" className={buttonClasses({ variant: "ghostDark", size: "lg" })}>
              <WhatsappIcon size={17} />
              {t("quotations.whatsappAction")}
            </a>
          </>
        }
      />

      <Section labelledBy="quotations-subjects">
        <SectionHead id="quotations-subjects" title={t("quotations.prompt")} lead={t("quotations.description")} />

        <Reveal stagger as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <li key={subject.id} className="flex">
              <article className="flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-7 shadow-soft">
                <span
                  aria-hidden="true"
                  className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15 ring-offset-4 ring-offset-surface"
                >
                  {SUBJECT_ICONS[subject.kind]}
                </span>
                <h3 className="mt-6 text-[1.15rem] leading-snug">{subject.name}</h3>
                <p className="mt-2 min-h-[3.5rem] text-[14.5px] leading-relaxed text-body">{subject.description}</p>

                {/* A real mailto with this subject already in the line, so the
                    request arrives sorted without anybody having built a router
                    for it. */}
                <a href={mailFor(subject.name)} className={buttonClasses({ variant: "soft", size: "sm", className: "mt-auto self-start" })}>
                  <MailIcon size={14} />
                  {t("quotations.askAbout")}
                </a>
              </article>
            </li>
          ))}
        </Reveal>
      </Section>

      <Section tone="muted" labelledBy="quotations-needs">
        <SectionHead id="quotations-needs" title={t("quotations.needsTitle")} lead={t("quotations.needsLead")} />

        {/* Numbered seals on a gold line: the order is real. */}
        <Reveal stagger as="ol" className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {needs.map((need, index) => (
            <li key={need.key} className="relative">
              {index < needs.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute start-16 top-7 hidden h-px w-[calc(100%-3rem)] bg-linear-to-r from-accent/70 to-accent/15 md:block rtl:bg-linear-to-l"
                />
              ) : null}
              <span
                className="relative grid size-14 place-items-center rounded-full bg-deep font-heading text-lg font-bold text-accent ring-1 ring-accent/50 ring-offset-4 ring-offset-canvas"
                dir="ltr"
              >
                {number(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 text-[1.2rem]">{t(need.key)}</h3>
              <p className="mt-2.5 max-w-[36ch] text-[14.5px] leading-relaxed text-body">{t(need.body)}</p>
            </li>
          ))}
        </Reveal>
      </Section>

      <Section id="quotation-form" labelledBy="quotations-form">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-10">
          <Card className="p-6 sm:p-8 lg:p-10">
            <h2 id="quotations-form" className="text-[1.75rem] leading-tight sm:text-[2rem]">
              {t("quotations.formTitle")}
            </h2>
            <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-body">{t("quotations.formLead")}</p>

            <ActionForm
              action={submit}
              submitLabel={t("quotations.formSubmit")}
              pendingLabel={t("account.working")}
              resetOnSuccess
              className="mt-8"
              submitSize="lg" submitClassName="mt-7 w-full"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t("quotations.formSubject")} htmlFor="quote-subject" required className="sm:col-span-2">
                  <select id="quote-subject" name="subjectKind" required className={selectClasses()}>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.kind}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </Field>

                {formFields.map((field) => (
                  <Field
                    key={field.name}
                    label={
                      <>
                        {field.label}
                        {field.required ? null : optional}
                      </>
                    }
                    htmlFor={`quote-${field.name}`}
                    required={field.required}
                    className={field.wide ? "sm:col-span-2" : undefined}
                  >
                    <input
                      id={`quote-${field.name}`}
                      name={field.name}
                      type={field.type}
                      required={field.required}
                      min={field.type === "number" ? 1 : undefined}
                      autoComplete={field.autoComplete}
                      dir={field.dir ?? "auto"}
                      className={inputClasses()}
                    />
                  </Field>
                ))}

                <fieldset className="sm:col-span-2">
                  <legend className={labelClasses}>{t("quotations.formContactBy")}</legend>
                  <div className="flex flex-wrap gap-3">
                    {(["email", "phone"] as const).map((method) => (
                      <label key={method} className="cursor-pointer">
                        <input
                          type="radio"
                          name="preferredContact"
                          value={method}
                          defaultChecked={method === "email"}
                          className="peer sr-only"
                        />
                        <span className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-6 text-[14px] font-semibold text-ink transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20 hover:border-primary/40">
                          {t(method === "email" ? "signIn.email" : "booking.phone")}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <Field label={t("quotations.formMessage")} htmlFor="quote-message" required className="sm:col-span-2">
                  <textarea
                    id="quote-message"
                    name="message"
                    required
                    minLength={20}
                    rows={5}
                    dir="auto"
                    className={textareaClasses()}
                  />
                </Field>
              </div>
            </ActionForm>
          </Card>

          {/* THE DIRECT CHANNELS. A quotation is a business decision and the
              person making it often wants to ring rather than click, so the
              number is written out as well as linked. */}
          <aside
            aria-labelledby="quotations-direct"
            className="relative isolate overflow-hidden rounded-[2rem] bg-deep p-8 text-white/75 sm:p-10 lg:sticky lg:top-28"
          >
            <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.04]" />
            <span aria-hidden="true" className="absolute -end-28 -bottom-28 -z-10 size-80 text-accent/15">
              <Rosette className="spin-slow size-full" />
            </span>

            <h2 id="quotations-direct" className="text-[1.5rem] leading-snug text-white">
              {t("quotations.ctaTitle")}
            </h2>
            <span aria-hidden="true" className="mt-5 block h-px w-14 bg-accent" />
            <p className="mt-5 text-[15px] leading-relaxed">{t("quotations.ctaBody")}</p>

            <div className="mt-8 grid gap-3">
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(t("quotations.mailSubjectGeneral"))}`}
                className={buttonClasses({ variant: "gold", className: "w-full" })}
              >
                <MailIcon size={16} />
                {t("quotations.emailAction")}
              </a>
              <a href={whatsapp} target="_blank" rel="noreferrer" className={buttonClasses({ variant: "ghostDark", className: "w-full" })}>
                <WhatsappIcon size={16} />
                {t("quotations.whatsappAction")}
              </a>
            </div>

            <dl className="mt-8 space-y-4 border-t border-white/15 pt-7 text-[14px]">
              <div>
                <dt className="text-[12.5px] text-white/55">{t("contact.phoneLabel")}</dt>
                <dd className="mt-1 font-heading text-[1.1rem] font-semibold text-white">
                  <span dir="ltr">{t("site.contactPhone")}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[12.5px] text-white/55">{t("contact.emailLabel")}</dt>
                <dd className="mt-1 font-semibold wrap-break-word text-white">
                  <span dir="ltr">{email}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[12.5px] text-white/55">{t("contact.hoursLabel")}</dt>
                <dd className="mt-1 font-semibold text-white">{t("site.openingHours")}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </Section>
    </>
  );
}
