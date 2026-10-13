import { revalidatePath } from "next/cache";

import { inputClasses, labelClasses } from "@/components/ui";
import { accountService } from "@/features/account";
import { requireAccount } from "@/features/auth";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { ActionForm, type FormState } from "../../_components/portal/action-form";
import { failed, succeeded } from "../../_components/portal/form-state";
import { PortalIcon } from "../../_components/portal/portal-icons";
import { EmptyNote, Panel, PortalShell } from "../../_components/portal/portal-shell";
import { accountFrame } from "../_components/account-frame";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/addresses">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/account/addresses", title: getTranslator(locale)("account.addresses"), noIndex: true });
}

/** Where things are delivered. Checkout offers exactly this list. */
export default async function AccountAddressesPage({ params }: PageProps<"/[locale]/account/addresses">) {
  const locale = resolveLocale((await params).locale);
  const { customerId, t, shell } = await accountFrame(locale, "/account/addresses");
  const addresses = await accountService.listAddresses(customerId);

  const fallback = t("state.errorTitle");
  const saved = t("account.addressSaved");
  const path = localePath(locale, "/account/addresses");

  async function add(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const account = await requireAccount(locale, "customer", "/account/addresses");
    try {
      await accountService.addAddress(account.customerId!, {
        label: String(formData.get("label") ?? ""),
        recipientName: String(formData.get("recipientName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        line1: String(formData.get("line1") ?? ""),
        city: String(formData.get("city") ?? ""),
      });
      revalidatePath(path);
      return succeeded(saved);
    } catch (error) {
      return failed(error, fallback);
    }
  }

  async function remove(formData: FormData) {
    "use server";
    const account = await requireAccount(locale, "customer", "/account/addresses");
    await accountService.removeAddress(account.customerId!, String(formData.get("addressId") ?? ""));
    revalidatePath(path);
  }

  const fields = [
    { name: "label", label: t("account.addressLabel"), optional: true, autoComplete: "off" },
    { name: "recipientName", label: t("account.addressName"), autoComplete: "name" },
    { name: "phone", label: t("booking.phone"), autoComplete: "tel", dir: "ltr" as const },
    { name: "line1", label: t("account.addressLine"), autoComplete: "address-line1" },
    { name: "city", label: t("account.addressCity"), autoComplete: "address-level2" },
  ];

  return (
    <PortalShell {...shell} active="/account/addresses" title={t("account.addresses")} lead={t("account.addressesLead")}>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <section aria-label={t("account.addresses")}>
          {addresses.length === 0 ? (
            <EmptyNote icon="addresses" text={t("account.noAddresses")} />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {addresses.map((address) => (
                <li key={address.id} className="flex">
                  <article className="flex w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        aria-hidden="true"
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
                      >
                        <PortalIcon name="addresses" />
                      </span>
                      {address.label ? (
                        <span className="min-w-0 truncate rounded-full bg-primary-05 px-2.5 py-1 text-[12px] font-semibold text-primary-dark" dir="auto">
                          {address.label}
                        </span>
                      ) : null}
                    </div>
                    {/* One block in the direction the person wrote it in, so the
                        name, the street and the phone line up together. */}
                    <div dir="auto" className="mt-4">
                      <p className="font-heading text-[15.5px] font-semibold text-ink">{address.recipientName}</p>
                      <p className="mt-1 text-[14px] leading-relaxed text-body">
                        {address.line1}
                        <br />
                        {address.city}
                      </p>
                      <p className="mt-1 text-[14px] text-body">
                        <span dir="ltr">{address.phone}</span>
                      </p>
                    </div>
                    <form action={remove} className="mt-auto border-t border-line pt-4">
                      <input type="hidden" name="addressId" value={address.id} />
                      <button
                        type="submit"
                        className="mt-1 cursor-pointer text-[13.5px] font-semibold text-danger underline-offset-4 hover:underline"
                      >
                        {t("account.removeAddress")}
                      </button>
                    </form>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Panel id="add-address" title={t("account.addAddress")} className="lg:sticky lg:top-28">
          <ActionForm
            action={add}
            submitLabel={t("account.saveAddress")}
            pendingLabel={t("account.working")}
            resetOnSuccess
            className="grid gap-4"
            submitClassName="w-full"
          >
            {fields.map((field) => (
              <div key={field.name}>
                <label htmlFor={`address-${field.name}`} className={labelClasses}>
                  {field.label}
                  {field.optional ? <span className="ms-1 font-normal text-body/70">{t("booking.goalOptional")}</span> : null}
                </label>
                <input
                  id={`address-${field.name}`}
                  name={field.name}
                  required={!field.optional}
                  autoComplete={field.autoComplete}
                  dir={field.dir ?? "auto"}
                  className={inputClasses()}
                />
              </div>
            ))}
          </ActionForm>
        </Panel>
      </div>
    </PortalShell>
  );
}
