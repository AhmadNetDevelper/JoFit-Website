import type { Locale } from "@/i18n";

import type { QuotationRequestDraft, QuotationSubject } from "../types";

/**
 * The storefront's side of the quotations workflow.
 *
 * `submitRequest` delivers a request into the admin's quotations inbox, where
 * staff assign it, quote it and record the outcome (new → in review → quoted →
 * won / lost). What happens after "quoted" — approvals, SLAs, converting a won
 * quote into an order — is still an OPEN BUSINESS DECISION, and none of it is
 * the storefront's concern: it only has to hand the request over intact.
 */
export interface QuotationsService {
  listSubjects(locale: Locale): Promise<readonly QuotationSubject[]>;
  /** Validates and files the request; resolves the reference quoted back to the sender. */
  submitRequest(draft: QuotationRequestDraft): Promise<{ readonly reference: string }>;
}
