import { resolveText } from "@/i18n";
import { AppError } from "@/lib";
import { accountStore, nextReference, notifyStaff } from "@/mocks/accounts";
import { mockQuotationSubjects } from "@/mocks/quotations";
import { simulateLatency } from "@/mocks/runtime";

import type { QuotationsService } from "./quotations.contract";

/** Filed into the account store — the same inbox the admin reads. */
export const mockQuotationsService: QuotationsService = {
  async listSubjects(locale) {
    await simulateLatency();
    return mockQuotationSubjects.map((raw) => ({
      id: raw.id,
      kind: raw.kind,
      name: resolveText(raw.name, locale),
      description: resolveText(raw.description, locale),
    }));
  },

  async submitRequest(draft) {
    await simulateLatency();
    const fieldErrors: Record<string, string> = {};
    if (!mockQuotationSubjects.some((subject) => subject.kind === draft.subjectKind)) {
      fieldErrors.subjectKind = "Choose what the request is about.";
    }
    if (draft.organisationName.trim().length < 2) fieldErrors.organisationName = "The club, school or company name.";
    if (draft.contactName.trim().length < 2) fieldErrors.contactName = "Who should we talk to?";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) fieldErrors.email = "An email address we can reply to.";
    if (draft.preferredContact === "phone" && !draft.phone?.trim()) {
      fieldErrors.phone = "Add a number if you would like a call.";
    }
    if (draft.message.trim().length < 20) fieldErrors.message = "A few sentences on what you need.";
    if (Object.keys(fieldErrors).length > 0) {
      throw new AppError("validation", "Some fields need attention.", { status: 422, details: { fieldErrors } });
    }

    const reference = nextReference("QR-9");
    accountStore().quotations.push({
      id: `quot-${reference.toLowerCase()}`,
      reference,
      subjectKind: draft.subjectKind,
      organisationName: draft.organisationName.trim(),
      contactName: draft.contactName.trim(),
      email: draft.email.trim(),
      phone: draft.phone?.trim() || undefined,
      sportIds: draft.sportIds,
      quantityEstimate: draft.quantityEstimate,
      budgetRange: draft.budgetRange,
      message: draft.message.trim(),
      status: "new",
      assigneeId: null,
      submittedAt: new Date().toISOString(),
    });
    notifyStaff(
      "quotation-received",
      { en: `New quotation request ${reference}`, ar: `طلب عرض سعر جديد ${reference}` },
      { en: draft.organisationName.trim(), ar: draft.organisationName.trim() },
      `/quotations/quot-${reference.toLowerCase()}`,
    );
    return { reference };
  },
};
