import Link from "next/link";
import { revalidatePath } from "next/cache";

import { labelClasses, textareaClasses } from "@/components/ui";
import { accountService } from "@/features/account";
import { requireAccount } from "@/features/auth";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { ActionForm, type FormState } from "../../_components/portal/action-form";
import { failed, succeeded } from "../../_components/portal/form-state";
import { PortalIcon } from "../../_components/portal/portal-icons";
import { EmptyNote, PortalShell, PortalSubhead, StatusChip } from "../../_components/portal/portal-shell";
import { accountFrame, statusLabel } from "../_components/account-frame";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/bookings">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/account/bookings", title: getTranslator(locale)("account.bookings"), noIndex: true });
}

/**
 * Coaching sessions. A booking starts `pending` and the COACH moves it on —
 * confirmed, then delivered — from the coach area; this page is where the
 * customer watches that happen, and the one place they can cancel a session
 * still to come. Cancelling needs a sentence, because the coach reads it.
 */
export default async function AccountBookingsPage({ params }: PageProps<"/[locale]/account/bookings">) {
  const locale = resolveLocale((await params).locale);
  const { customerId, t, f, shell } = await accountFrame(locale, "/account/bookings");
  const sessions = await accountService.listSessions(customerId, locale);
  const now = new Date().toISOString();
  const upcoming = sessions.filter((row) => row.startsAt >= now).reverse();
  const past = sessions.filter((row) => row.startsAt < now);

  const fallback = t("state.errorTitle");
  const cancelledMessage = t("account.sessionCancelled");

  async function cancel(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    // An action is a public endpoint: the caller is re-checked, not trusted.
    const account = await requireAccount(locale, "customer", "/account/bookings");
    try {
      await accountService.cancelSession(
        account.customerId!,
        String(formData.get("sessionId") ?? ""),
        String(formData.get("reason") ?? ""),
      );
      revalidatePath(localePath(locale, "/account/bookings"));
      return succeeded(cancelledMessage);
    } catch (error) {
      return failed(error, fallback);
    }
  }

  const row = (session: (typeof sessions)[number]) => (
    <li key={session.id} className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
          >
            <PortalIcon name="sessions" size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 className="font-heading text-[17px] leading-snug font-semibold">
                <Link
                  href={localePath(locale, session.coachHref)}
                  className="text-ink underline-offset-4 hover:text-primary-dark hover:underline"
                >
                  {session.coachName}
                </Link>
              </h3>
              <StatusChip status={session.status} label={statusLabel(t, session.status)} />
            </div>
            <p className="mt-2 text-[14.5px] font-semibold text-ink">{f.dateTime(session.startsAt)}</p>
            <p className="mt-1 text-[14px] text-body">
              {`${session.packageName} · ${t(session.mode === "online" ? "booking.packageOnline" : "booking.packageInPerson")}`}
            </p>
            {session.sessionCount !== undefined && session.sessionCount > 1 ? (
              <p className="mt-1 text-[13px] text-body/80">{t("account.blockNote", { count: f.number(session.sessionCount) })}</p>
            ) : null}
            {session.status === "pending" ? (
              <p className="mt-3 inline-flex rounded-xl bg-accent-10 px-3 py-2 text-[13px] text-ink">{t("account.awaitingCoach")}</p>
            ) : null}
            {session.statusNote && session.status === "cancelled" ? (
              <p className="mt-3 rounded-xl bg-danger-05 px-3 py-2 text-[13px] text-danger" dir="auto">
                {session.statusNote}
              </p>
            ) : null}
          </div>
        </div>
        <div className="ms-auto text-end">
          <p className="font-heading text-[18px] leading-none font-bold text-primary-dark">
            <span dir="ltr" className="tabular-nums">
              {f.money(session.total)}
            </span>
          </p>
          <p className="mt-2 text-[12.5px] text-body/70">
            <span dir="ltr">{session.reference}</span>
          </p>
        </div>
      </div>

      {session.canCancel ? (
        <details className="group mt-5 border-t border-line pt-4">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-[14px] font-semibold text-danger [&::-webkit-details-marker]:hidden">
            {t("account.cancelSession")}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="transition-transform group-open:rotate-180">
              <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <ActionForm
            action={cancel}
            submitLabel={t("account.confirmCancel")}
            pendingLabel={t("account.working")}
            tone="danger"
            className="mt-4 max-w-lg"
          >
            <input type="hidden" name="sessionId" value={session.id} />
            <label className={labelClasses} htmlFor={`reason-${session.id}`}>
              {t("account.cancelReason")}
            </label>
            <textarea
              id={`reason-${session.id}`}
              name="reason"
              required
              minLength={3}
              rows={2}
              dir="auto"
              className={textareaClasses("min-h-24")}
            />
          </ActionForm>
        </details>
      ) : null}
    </li>
  );

  return (
    <PortalShell {...shell} active="/account/bookings" title={t("account.bookings")} lead={t("account.bookingsLead")}>
      {sessions.length === 0 ? (
        <EmptyNote icon="sessions" text={t("account.noSessions")} href={localePath(locale, "/coaches")} action={t("account.findCoach")} />
      ) : (
        <div className="space-y-10">
          <section aria-labelledby="upcoming-sessions">
            <PortalSubhead id="upcoming-sessions" title={t("account.upcoming")} aside={<Count value={f.number(upcoming.length)} />} />
            {upcoming.length === 0 ? (
              <p className="mt-5 rounded-3xl border border-dashed border-line bg-surface px-6 py-8 text-[14.5px] text-body">
                {t("account.nothingUpcoming")}
              </p>
            ) : (
              <ul className="mt-5 grid gap-4">{upcoming.map(row)}</ul>
            )}
          </section>
          {past.length > 0 ? (
            <section aria-labelledby="past-sessions">
              <PortalSubhead id="past-sessions" title={t("account.past")} aside={<Count value={f.number(past.length)} />} />
              <ul className="mt-5 grid gap-4">{past.map(row)}</ul>
            </section>
          ) : null}
        </div>
      )}
    </PortalShell>
  );
}

/** A bare figure beside a group heading. */
function Count({ value }: { value: string }) {
  return (
    <span className="grid h-7 min-w-7 place-items-center rounded-full bg-surface px-2 text-[13px] font-semibold text-body ring-1 ring-line">
      <span dir="ltr">{value}</span>
    </span>
  );
}
