"use client";

import { useState } from "react";

import { ArrowIcon, buttonClasses, Field as FormField, inputClasses, textareaClasses } from "@/components/ui";

import { CalendarIcon, CheckIcon, ClockIcon, GlobeIcon, UserIcon } from "../_components/icons";

/**
 * THE BOOKING WIZARD.
 *
 * Five questions, one at a time, in the order a person actually decides them:
 * what, which day, which hour, who for, and is that right. Putting all five on
 * one screen was the alternative and it is worse here — the hours depend on the
 * day, so half of a single-screen form would be empty or wrong until the top of
 * it was filled in.
 *
 * Each of the first three steps has exactly ONE answer, so choosing an answer
 * advances. There is no Continue button to press after a choice that could not
 * be ambiguous; Back is always there, and every line of the summary jumps
 * straight to the step that wrote it.
 *
 * WHAT IT IS GIVEN. Everything here arrives pre-formatted: the prices, the
 * times, the weekday names, every string. This is a Client Component, and the
 * dictionary, the money helpers and `Intl` all stay on the server — which also
 * means the clock face rendered on the server is byte-for-byte the one the
 * browser hydrates with, rather than whatever zone the visitor's machine is in.
 *
 * Beside the gallery's lightbox and the scroll reveal, it is the only
 * JavaScript this route ships. Its look is the kit's: pills for the actions,
 * `Field` + `inputClasses` for the contact step, numbered seals on the rail.
 */

export interface BookingPackageView {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceLabel: string;
  readonly compareAtLabel?: string;
  readonly perSessionLabel?: string;
  readonly durationLabel: string;
  readonly sessionsLabel?: string;
  readonly modeLabel: string;
  readonly isOnline: boolean;
}

export interface BookingSlotView {
  readonly id: string;
  readonly timeLabel: string;
  readonly isBooked: boolean;
}

export interface BookingDayView {
  readonly date: string;
  readonly weekday: string;
  readonly dayNumber: string;
  /**
   * "3 free", "Full" or "Closed" — chosen on the server, where the dictionary
   * is. A day with no published hours and a day whose hours are all taken look
   * the same to a visitor but are not the same fact, and the difference is the
   * server's to name.
   */
  readonly statusLabel: string;
  readonly isDisabled: boolean;
  readonly slots: readonly BookingSlotView[];
}

export interface BookingCopy {
  readonly title: string;
  readonly lead: string;
  /*
   * Both are ARRAYS, one entry per step, already interpolated.
   *
   * The obvious shape for `stepOf` is a function taking the number — but a
   * function is not serialisable, and passing one from this page's Server
   * Component would throw "Functions cannot be passed directly to Client
   * Components". Five finished strings cost nothing and cross cleanly.
   */
  readonly stepOf: readonly [string, string, string, string, string];
  readonly steps: readonly [string, string, string, string, string];
  readonly back: string;
  readonly next: string;
  readonly change: string;
  readonly confirm: string;
  readonly confirming: string;

  readonly packageTitle: string;
  readonly dateTitle: string;
  readonly dateLead: string;
  readonly timeTitle: string;
  readonly timeLead: string;
  readonly timeTaken: string;
  readonly timeNone: string;

  readonly detailsTitle: string;
  readonly detailsLead: string;
  readonly name: string;
  readonly namePlaceholder: string;
  readonly email: string;
  readonly emailPlaceholder: string;
  readonly phone: string;
  readonly phonePlaceholder: string;
  readonly goal: string;
  readonly goalOptional: string;
  readonly goalPlaceholder: string;

  readonly reviewTitle: string;
  readonly reviewCoach: string;
  readonly reviewSession: string;
  readonly reviewWhen: string;
  readonly reviewWho: string;
  readonly reviewGoal: string;
  readonly reviewTotal: string;
  readonly payLater: string;

  readonly doneTitle: string;
  readonly doneBody: string;
  readonly reference: string;
  readonly doneAnother: string;
  readonly doneBrowse: string;

  readonly errorRequired: string;
  readonly errorEmail: string;
  readonly errorPhone: string;
  readonly errorGeneric: string;
}

export interface BookingSubmitted {
  readonly reference: string;
  readonly whenLabel: string;
  readonly totalLabel: string;
  readonly packageName: string;
}

export type BookingAction = (input: {
  packageId: string;
  slotId: string;
  name: string;
  email: string;
  phone: string;
  goal: string;
}) => Promise<{ ok: true; booking: BookingSubmitted } | { ok: false; message: string }>;

type Fields = { name: string; email: string; phone: string; goal: string };

export function BookingFlow({
  coachName,
  coachHref,
  browseHref,
  packages,
  days,
  copy,
  action,
  contactDefaults,
  accountLink,
}: {
  coachName: string;
  coachHref: string;
  browseHref: string;
  packages: readonly BookingPackageView[];
  days: readonly BookingDayView[];
  copy: BookingCopy;
  action: BookingAction;
  /**
   * The signed-in customer's details, so they are not typed again. Still
   * editable: a session is often booked for a child or a teammate.
   */
  contactDefaults?: { readonly name: string; readonly email: string; readonly phone: string };
  /** Where a signed-in customer finds the booking afterwards. */
  accountLink?: { readonly href: string; readonly label: string };
}) {
  const [step, setStep] = useState(0);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [fields, setFields] = useState<Fields>({
    name: contactDefaults?.name ?? "",
    email: contactDefaults?.email ?? "",
    phone: contactDefaults?.phone ?? "",
    goal: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingSubmitted | null>(null);

  const chosenPackage = packages.find((entry) => entry.id === packageId) ?? null;
  const chosenDay = days.find((entry) => entry.date === date) ?? null;
  const chosenSlot = chosenDay?.slots.find((entry) => entry.id === slotId) ?? null;

  /* Backwards only. A step you have not answered yet is not a place you can
     jump to, so the rail never offers a link into an empty question. */
  const furthest = chosenSlot ? 3 : chosenDay ? 2 : chosenPackage ? 1 : 0;

  function validate(): boolean {
    const found: Partial<Record<keyof Fields, string>> = {};
    if (!fields.name.trim()) found.name = copy.errorRequired;
    if (!fields.email.trim()) found.email = copy.errorRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) found.email = copy.errorEmail;
    if (!fields.phone.trim()) found.phone = copy.errorRequired;
    else if (fields.phone.replace(/\D/g, "").length < 7) found.phone = copy.errorPhone;
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  async function submit() {
    if (!chosenPackage || !chosenSlot) return;
    setPending(true);
    setFailure(null);
    const outcome = await action({
      packageId: chosenPackage.id,
      slotId: chosenSlot.id,
      name: fields.name.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      goal: fields.goal.trim(),
    });
    setPending(false);
    if (outcome.ok) setBooking(outcome.booking);
    else setFailure(outcome.message);
  }

  /* ----------------------------------------------------------------------- */
  /* Confirmation. A finished booking replaces the wizard rather than sitting
     under it — there is nothing left to edit, and leaving the form on screen
     invites a second submission of the same slot.                            */
  /* ----------------------------------------------------------------------- */
  if (booking) {
    return (
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
        <div className="border-b border-line bg-primary-05 px-6 py-10 text-center sm:px-10">
          <span
            aria-hidden="true"
            className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-primary text-on-primary ring-1 ring-primary/30 ring-offset-4 ring-offset-surface"
          >
            <CheckIcon size={26} />
          </span>
          <h3 className="text-[1.6rem] leading-snug">{copy.doneTitle}</h3>
          <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-relaxed text-body">{copy.doneBody}</p>
        </div>

        <div className="px-6 py-8 sm:px-10">
          <dl className="grid gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-3">
            <div className="bg-surface p-5">
              <dt className="text-[12.5px] font-medium text-body/70">{copy.reference}</dt>
              <dd className="mt-1.5 font-heading text-[17px] font-bold text-primary-dark">
                <span dir="ltr">{booking.reference}</span>
              </dd>
            </div>
            <div className="bg-surface p-5">
              <dt className="text-[12.5px] font-medium text-body/70">{copy.reviewSession}</dt>
              <dd className="mt-1.5 text-[15px] font-semibold text-ink">{booking.packageName}</dd>
            </div>
            <div className="bg-surface p-5">
              <dt className="text-[12.5px] font-medium text-body/70">{copy.reviewWhen}</dt>
              <dd className="mt-1.5 text-[15px] font-semibold text-ink">{booking.whenLabel}</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            {accountLink ? (
              <a href={accountLink.href} className={buttonClasses()}>
                {accountLink.label}
              </a>
            ) : null}
            <a href={coachHref} className={buttonClasses({ variant: accountLink ? "outline" : "primary" })}>
              {copy.doneAnother}
            </a>
            <a
              href={browseHref}
              className="text-[14px] font-semibold text-primary-dark underline-offset-4 hover:underline"
            >
              {copy.doneBrowse}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
      {/*
        THE RAIL.

        A list, not a progress bar: each entry names the question it stands for,
        and an answered one is a button back to it. The markers are the site's
        numbered seals at their smallest — deep green with a gold tick once a
        step is answered, the action green for the step you are on.
      */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 border-b border-line bg-canvas px-5 py-4 sm:px-8">
        {copy.steps.map((label, index) => {
          const done = index < step;
          const current = index === step;
          const reachable = index <= furthest && index !== step;

          const marker = (
            <>
              <span
                className={[
                  "grid size-8 shrink-0 place-items-center rounded-full text-[12.5px] font-bold transition-colors duration-200",
                  current
                    ? "bg-primary text-on-primary shadow-[0_8px_18px_-10px_var(--color-primary)]"
                    : done
                      ? "bg-deep text-accent"
                      : "bg-surface text-body/55 ring-1 ring-line",
                ].join(" ")}
              >
                {done ? <CheckIcon size={13} /> : <span dir="ltr">{index + 1}</span>}
              </span>
              <span
                className={[
                  "text-[13.5px] transition-colors duration-200",
                  current ? "font-semibold text-ink" : done ? "font-medium text-body" : "text-body/55",
                ].join(" ")}
              >
                {label}
              </span>
            </>
          );

          return (
            <li key={label} className="flex items-center gap-2">
              {reachable ? (
                <button
                  type="button"
                  onClick={() => setStep(index)}
                  className="flex cursor-pointer items-center gap-2 rounded-full pe-1 hover:[&>span:last-child]:text-primary-dark"
                >
                  {marker}
                </button>
              ) : (
                <span aria-current={current ? "step" : undefined} className="flex items-center gap-2">
                  {marker}
                </span>
              )}
              {index < copy.steps.length - 1 ? (
                <span aria-hidden="true" className="mx-1 h-px w-5 bg-line max-sm:hidden" />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="px-5 py-8 sm:px-8 sm:py-10">
        <p className="eyebrow mb-4">{copy.stepOf[step]}</p>

        {/* --- 1. What --------------------------------------------------- */}
        {step === 0 ? (
          <section aria-labelledby="booking-step-package">
            <h3 id="booking-step-package" className="text-[1.4rem] leading-snug">
              {copy.packageTitle}
            </h3>

            <ul className="mt-6 space-y-3">
              {packages.map((entry) => {
                const active = entry.id === packageId;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setPackageId(entry.id);
                        setStep(1);
                      }}
                      className={[
                        "flex w-full cursor-pointer flex-wrap items-start justify-between gap-x-6 gap-y-4 rounded-2xl border p-5 text-start transition-[border-color,background-color,box-shadow] duration-200",
                        active
                          ? "border-primary bg-primary-05 ring-4 ring-primary/10"
                          : "border-line bg-surface hover:border-primary/50 hover:bg-primary-05",
                      ].join(" ")}
                    >
                      <span className="min-w-0 flex-1 basis-64">
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span className="font-heading text-[16.5px] font-semibold text-ink">{entry.name}</span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-[11.5px] font-semibold text-body ring-1 ring-line">
                            {entry.isOnline ? <GlobeIcon size={12} /> : <UserIcon size={12} />}
                            {entry.modeLabel}
                          </span>
                        </span>

                        <span className="mt-2 block max-w-[58ch] text-[14px] leading-relaxed text-body">
                          {entry.description}
                        </span>

                        <span className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-body">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-primary">
                              <ClockIcon size={14} />
                            </span>
                            {entry.durationLabel}
                          </span>
                          {entry.sessionsLabel ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="text-primary">
                                <CalendarIcon size={14} />
                              </span>
                              {entry.sessionsLabel}
                            </span>
                          ) : null}
                        </span>
                      </span>

                      <span className="sm:text-end">
                        <span className="block font-heading text-[1.3rem] leading-tight font-bold text-ink">
                          <span dir="ltr">{entry.priceLabel}</span>
                        </span>
                        {entry.compareAtLabel ? (
                          <span className="mt-1 block text-[13px] text-body/55 line-through">
                            <span dir="ltr">{entry.compareAtLabel}</span>
                          </span>
                        ) : null}
                        {entry.perSessionLabel ? (
                          <span className="mt-1 block text-[12px] text-body/70">
                            <span dir="ltr">{entry.perSessionLabel}</span>
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* --- 2. Which day ---------------------------------------------- */}
        {step === 1 ? (
          <section aria-labelledby="booking-step-date">
            <h3 id="booking-step-date" className="text-[1.4rem] leading-snug">
              {copy.dateTitle}
            </h3>
            <p className="mt-2 text-[14px] text-body">{copy.dateLead}</p>

            {/*
              A scroller, not a month grid. Fourteen days is what the coach has
              published, and a calendar would draw thirty cells to show it —
              sixteen of them dead. The strip also fits a phone without
              shrinking the targets.
            */}
            <ul className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8">
              {days.map((day) => {
                const active = day.date === date;
                return (
                  <li key={day.date} className="shrink-0">
                    <button
                      type="button"
                      disabled={day.isDisabled}
                      aria-pressed={active}
                      onClick={() => {
                        setDate(day.date);
                        setSlotId(null);
                        setStep(2);
                      }}
                      className={[
                        "flex w-[86px] cursor-pointer flex-col items-center gap-1 rounded-2xl border px-2 py-4 transition-colors duration-200",
                        day.isDisabled
                          ? "cursor-not-allowed border-line bg-canvas text-body/35"
                          : active
                            ? "border-primary bg-primary text-on-primary"
                            : "border-line bg-surface text-ink hover:border-primary/50 hover:bg-primary-05",
                      ].join(" ")}
                    >
                      <span className="text-[12px] font-medium opacity-80">{day.weekday}</span>
                      <span className="font-heading text-[22px] leading-none font-bold" dir="ltr">
                        {day.dayNumber}
                      </span>
                      <span className="mt-1 text-[11px] leading-tight opacity-85">{day.statusLabel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* --- 3. Which hour --------------------------------------------- */}
        {step === 2 && chosenDay ? (
          <section aria-labelledby="booking-step-time">
            <h3 id="booking-step-time" className="text-[1.4rem] leading-snug">
              {copy.timeTitle}
            </h3>
            <p className="mt-2 text-[14px] text-body">{copy.timeLead}</p>

            {chosenDay.slots.every((slot) => slot.isBooked) ? (
              <p className="mt-6 rounded-2xl border border-line bg-canvas px-5 py-8 text-center text-[15px] text-body">
                {copy.timeNone}
              </p>
            ) : (
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {chosenDay.slots.map((slot) => {
                  const active = slot.id === slotId;
                  return (
                    <li key={slot.id}>
                      <button
                        type="button"
                        disabled={slot.isBooked}
                        aria-pressed={active}
                        onClick={() => {
                          setSlotId(slot.id);
                          setStep(3);
                        }}
                        className={[
                          "flex w-full cursor-pointer flex-col items-center gap-1 rounded-2xl border px-3 py-3.5 transition-colors duration-200",
                          slot.isBooked
                            ? "cursor-not-allowed border-line bg-canvas text-body/35"
                            : active
                              ? "border-primary bg-primary text-on-primary"
                              : "border-line bg-surface text-ink hover:border-primary/50 hover:bg-primary-05",
                        ].join(" ")}
                      >
                        <span className="font-heading text-[16px] font-bold" dir="ltr">
                          {slot.timeLabel}
                        </span>
                        {slot.isBooked ? <span className="text-[11px]">{copy.timeTaken}</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}

        {/* --- 4. Who for ------------------------------------------------- */}
        {step === 3 ? (
          <section aria-labelledby="booking-step-details">
            <h3 id="booking-step-details" className="text-[1.4rem] leading-snug">
              {copy.detailsTitle}
            </h3>
            <p className="mt-2 max-w-[60ch] text-[14px] text-body">{copy.detailsLead}</p>

            {/* The kit's fields: the one field style on the site, with the
                error state driven by the same `aria-invalid` a screen reader
                reads. */}
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <ContactField
                id="booking-name"
                label={copy.name}
                placeholder={copy.namePlaceholder}
                autoComplete="name"
                value={fields.name}
                error={errors.name}
                onChange={(value) => setFields((prev) => ({ ...prev, name: value }))}
              />
              <ContactField
                id="booking-phone"
                label={copy.phone}
                placeholder={copy.phonePlaceholder}
                type="tel"
                autoComplete="tel"
                value={fields.phone}
                error={errors.phone}
                onChange={(value) => setFields((prev) => ({ ...prev, phone: value }))}
              />
              <div className="sm:col-span-2">
                <ContactField
                  id="booking-email"
                  label={copy.email}
                  placeholder={copy.emailPlaceholder}
                  type="email"
                  autoComplete="email"
                  value={fields.email}
                  error={errors.email}
                  onChange={(value) => setFields((prev) => ({ ...prev, email: value }))}
                />
              </div>

              <FormField
                htmlFor="booking-goal"
                className="sm:col-span-2"
                label={
                  <>
                    {copy.goal}
                    <span className="ms-2 text-[12.5px] font-normal text-body/60">{copy.goalOptional}</span>
                  </>
                }
              >
                <textarea
                  id="booking-goal"
                  rows={3}
                  value={fields.goal}
                  onChange={(event) => setFields((prev) => ({ ...prev, goal: event.target.value }))}
                  placeholder={copy.goalPlaceholder}
                  className={textareaClasses("resize-y")}
                />
              </FormField>
            </div>
          </section>
        ) : null}

        {/* --- 5. Is that right ------------------------------------------- */}
        {step === 4 && chosenPackage && chosenSlot && chosenDay ? (
          <section aria-labelledby="booking-step-review">
            <h3 id="booking-step-review" className="text-[1.4rem] leading-snug">
              {copy.reviewTitle}
            </h3>

            <dl className="mt-6 divide-y divide-line rounded-2xl border border-line px-5">
              <Row label={copy.reviewCoach} value={coachName} />
              <Row
                label={copy.reviewSession}
                value={`${chosenPackage.name} — ${chosenPackage.durationLabel}`}
                onChange={() => setStep(0)}
                changeLabel={copy.change}
              />
              <Row
                label={copy.reviewWhen}
                value={`${chosenDay.weekday} ${chosenDay.dayNumber}, ${chosenSlot.timeLabel}`}
                onChange={() => setStep(1)}
                changeLabel={copy.change}
              />
              <Row
                label={copy.reviewWho}
                value={fields.name}
                detail={fields.email}
                onChange={() => setStep(3)}
                changeLabel={copy.change}
              />
              {fields.goal ? <Row label={copy.reviewGoal} value={fields.goal} /> : null}
            </dl>

            {/* The total, on the one deep surface in the flow. */}
            <div className="relative isolate mt-6 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl bg-deep px-6 py-5 text-white/80">
              <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/5" />
              <span className="text-[14px] font-semibold">{copy.reviewTotal}</span>
              <span className="font-heading text-[1.7rem] leading-none font-bold text-accent" dir="ltr">
                {chosenPackage.priceLabel}
              </span>
            </div>

            <p className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-body/80">{copy.payLater}</p>

            {failure ? (
              <p
                role="alert"
                className="mt-5 rounded-2xl border border-danger/20 bg-danger-05 px-4 py-3 text-[14px] text-danger"
              >
                {failure}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* The only two buttons in the flow that are not themselves answers.
            Step 1 has neither — the packages ARE the buttons — so the rule
            that separates them is not drawn there either. */}
        {step > 0 ? (
          <div className="mt-9 flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <button
              type="button"
              onClick={() => setStep((current) => current - 1)}
              className={buttonClasses({ variant: "outline", className: "max-sm:w-full" })}
            >
              <span className="-scale-x-100">
                <ArrowIcon size={15} />
              </span>
              {copy.back}
            </button>

            {step === 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (validate()) setStep(4);
                }}
                className={buttonClasses({ size: "lg", className: "ms-auto max-sm:order-first max-sm:w-full" })}
              >
                {copy.next}
                <ArrowIcon size={15} />
              </button>
            ) : null}

            {step === 4 ? (
              <button
                type="button"
                disabled={pending}
                onClick={submit}
                className={buttonClasses({ size: "lg", className: "ms-auto max-sm:order-first max-sm:w-full" })}
              >
                {pending ? copy.confirming : copy.confirm}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** A labelled contact input, drawn with the kit's field. */
function ContactField({
  id,
  label,
  placeholder,
  value,
  error,
  onChange,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <FormField label={label} htmlFor={id} required error={error}>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClasses()}
      />
    </FormField>
  );
}

function Row({
  label,
  value,
  detail,
  onChange,
  changeLabel,
}: {
  label: string;
  value: string;
  /** A second line under the value, where two facts share one row. */
  detail?: string;
  onChange?: () => void;
  changeLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
      <dt className="w-full shrink-0 text-[13px] font-medium text-body/70 sm:w-32">{label}</dt>
      <dd className="min-w-0 flex-1 text-[15px] text-ink" dir="auto">
        {value}
        {detail ? <span className="mt-0.5 block text-[13px] text-body/75">{detail}</span> : null}
      </dd>
      {onChange && changeLabel ? (
        <button
          type="button"
          onClick={onChange}
          className="cursor-pointer text-[13px] font-semibold text-primary-dark underline-offset-4 hover:underline"
        >
          {changeLabel}
        </button>
      ) : null}
    </div>
  );
}
