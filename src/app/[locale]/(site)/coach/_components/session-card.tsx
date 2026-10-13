import { revalidatePath } from "next/cache";

import { labelClasses, textareaClasses } from "@/components/ui";
import { requireAccount } from "@/features/auth";
import {
  coachPortalService,
  type CoachPortalSession,
  type CoachSessionStatus,
} from "@/features/coach-portal";
import { getFormatters, getTranslator, localePath, type Locale } from "@/i18n";

import { ActionForm, type FormState } from "../../_components/portal/action-form";
import { failed, succeeded } from "../../_components/portal/form-state";
import { StatusChip } from "../../_components/portal/portal-shell";
import { statusLabel } from "../../account/_components/account-frame";
import { CalendarIcon, MailIcon, PhoneIcon } from "./icons";

/**
 * One session as the coach meets it: who, when, what they want, and the moves
 * open from here. Confirming and marking delivered are one click; declining or
 * cancelling asks for a sentence first, because the customer reads it on their
 * account page.
 *
 * Shared by the dashboard's request queue and the full sessions list, so a
 * request is handled the same way wherever the coach sees it.
 */
export function SessionCard({ session, locale }: { session: CoachPortalSession; locale: Locale }) {
  const t = getTranslator(locale);
  const f = getFormatters(locale);
  const fallback = t("state.errorTitle");
  const done: Record<CoachSessionStatus, string> = {
    pending: "",
    confirmed: t("coach.confirmedMessage"),
    completed: t("coach.completedMessage"),
    cancelled: t("coach.cancelledMessage"),
  };

  const move = (status: CoachSessionStatus) =>
    async function (_state: FormState, formData: FormData): Promise<FormState> {
      "use server";
      const account = await requireAccount(locale, "coach", "/coach/sessions");
      try {
        await coachPortalService.setSessionStatus(
          account.coachId!,
          String(formData.get("sessionId") ?? ""),
          status,
          String(formData.get("note") ?? ""),
        );
        revalidatePath(localePath(locale, "/coach"));
        revalidatePath(localePath(locale, "/coach/sessions"));
        return succeeded(done[status]);
      } catch (error) {
        return failed(error, fallback);
      }
    };

  const actionLabel: Record<CoachSessionStatus, string> = {
    pending: "",
    confirmed: t("coach.confirm"),
    completed: t("coach.markDelivered"),
    cancelled: session.status === "pending" ? t("coach.decline") : t("coach.cancel"),
  };

  const initial = Array.from(session.athleteName.trim())[0] ?? "";
  const cancellable = session.next.includes("cancelled");
  /* The one-click moves; the cancel sits beside them, level with their buttons. */
  const hasMoves = session.next.some((status) => status !== "cancelled");

  return (
    <li className="rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-primary/25 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-05 font-heading text-[17px] font-bold text-primary-dark ring-1 ring-primary/15"
          >
            {initial}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-heading text-[17px] font-semibold text-ink" dir="auto">
                {session.athleteName}
              </span>
              <StatusChip status={session.status} label={statusLabel(t, session.status)} />
            </div>
            <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-ink">
              <span className="text-primary">
                <CalendarIcon size={15} />
              </span>
              {f.dateTime(session.startsAt)}
            </p>
            <p className="mt-1 text-[14px] text-body">
              {`${session.packageName} · ${t(session.mode === "online" ? "booking.packageOnline" : "booking.packageInPerson")}`}
              {/* No live sessionCount — `CoachPortalSessionDto2` prices one session at a time. */}
              {session.sessionCount !== undefined && session.sessionCount > 1
                ? ` · ${t("booking.packageSessions", { count: f.number(session.sessionCount) })}`
                : ""}
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-body/80">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <span className="text-body/60">
                  <MailIcon size={14} />
                </span>
                <span dir="ltr" className="break-all">
                  {session.athleteEmail}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-body/60">
                  <PhoneIcon size={14} />
                </span>
                <span dir="ltr" className="whitespace-nowrap">
                  {session.athletePhone}
                </span>
              </span>
            </p>
          </div>
        </div>
        <div className="text-end">
          <p className="font-heading text-[18px] leading-none font-bold text-primary-dark tabular-nums">
            <span dir="ltr">{f.money(session.total)}</span>
          </p>
          <p className="mt-2 inline-block rounded-full bg-canvas px-2.5 py-1 text-[12px] font-semibold text-body ring-1 ring-line">
            <span dir="ltr">{session.reference}</span>
          </p>
        </div>
      </div>

      {session.goal ? (
        <blockquote
          className="relative mt-4 rounded-2xl bg-canvas px-4 py-3 ps-5 text-[14px] leading-relaxed text-ink before:absolute before:inset-y-3 before:start-0 before:w-[3px] before:rounded-full before:bg-accent"
          dir="auto"
        >
          {session.goal}
        </blockquote>
      ) : null}
      {session.statusNote && session.status === "cancelled" ? (
        <p className="mt-3 rounded-2xl bg-danger-05 px-4 py-2.5 text-[13.5px] text-danger" dir="auto">
          {session.statusNote}
        </p>
      ) : null}

      {session.next.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-start gap-x-4 gap-y-2 border-t border-line pt-4">
          {session.next
            .filter((status) => status !== "cancelled")
            .map((status) => (
              <ActionForm key={status} action={move(status)} submitLabel={actionLabel[status]} pendingLabel={t("account.working")}>
                <input type="hidden" name="sessionId" value={session.id} />
              </ActionForm>
            ))}
          {cancellable ? (
            <details className={`min-w-[260px] flex-1 ${hasMoves ? "pt-5" : ""}`}>
              <summary className="w-fit cursor-pointer py-2.5 text-[14px] leading-6 font-semibold text-danger underline-offset-4 hover:underline">
                {actionLabel.cancelled}
              </summary>
              <ActionForm
                action={move("cancelled")}
                submitLabel={actionLabel.cancelled}
                pendingLabel={t("account.working")}
                tone="danger"
                className="mt-3 max-w-lg rounded-2xl border border-danger/20 bg-danger-05 p-4"
              >
                <input type="hidden" name="sessionId" value={session.id} />
                <label htmlFor={`note-${session.id}`} className={labelClasses}>
                  {t("coach.reasonForCustomer")}
                </label>
                <textarea
                  id={`note-${session.id}`}
                  name="note"
                  required
                  minLength={3}
                  rows={2}
                  dir="auto"
                  className={textareaClasses("min-h-24")}
                />
              </ActionForm>
            </details>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
