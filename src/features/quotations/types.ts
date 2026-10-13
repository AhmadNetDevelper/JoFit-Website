import type { SportId } from "@/features/sports";
import type { MoneyRange } from "@/types";

/**
 * FEATURE BOUNDARY ONLY — the quotation workflow is not implemented.
 *
 * What exists: the vocabulary of a business request and the list of subjects the
 * platform accepts requests for. What does not exist, and is an OPEN BUSINESS
 * DECISION in every case: submission handling, routing to a sales owner, SLAs,
 * approval steps, pricing, and whether a quotation can convert into an order.
 */
export type QuotationSubjectKind =
  | "gym-equipment"
  | "facility"
  | "bulk-order"
  | "custom-equipment"
  | "corporate";

export interface QuotationSubject {
  readonly id: string;
  readonly kind: QuotationSubjectKind;
  readonly name: string;
  /** Live `QuotationSubjectDto` has no per-subject description at all — optional for that reason. */
  readonly description?: string;
}

export type QuotationContactMethod = "email" | "phone";

/** What a future form would collect. No submission endpoint exists. */
export interface QuotationRequestDraft {
  readonly subjectKind: QuotationSubjectKind;
  readonly organisationName: string;
  readonly contactName: string;
  readonly email: string;
  readonly phone?: string;
  readonly preferredContact: QuotationContactMethod;
  readonly sportIds: readonly SportId[];
  readonly quantityEstimate?: number;
  readonly budgetRange?: MoneyRange;
  readonly message: string;
}

export type QuotationStatus = "draft" | "submitted" | "in-review" | "quoted" | "closed";

export interface QuotationRequest extends QuotationRequestDraft {
  readonly id: string;
  readonly reference: string;
  readonly status: QuotationStatus;
  readonly submittedAt: string;
}
