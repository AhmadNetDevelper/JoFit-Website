import { httpClient } from "@/services";

import type { QuotationSubject } from "../types";
import type { QuotationsService } from "./quotations.contract";

/** Live `QuotationSubjectDto` — just `{kind, label}`; no `id`, no `description` at all. */
interface LiveQuotationSubject {
  readonly kind: string;
  readonly label: string;
}

/** `GET /v1/quotation-subjects` · `POST /v1/quotation-requests` (no sign-in needed). */
export const httpQuotationsService: QuotationsService = {
  listSubjects: (locale) =>
    httpClient
      .get<LiveQuotationSubject[]>("/v1/quotation-subjects", {
        // Live param is `language`, not `locale`.
        query: { language: locale },
        revalidate: 3600,
      })
      .then((raw) =>
        raw.map(
          (subject): QuotationSubject => ({
            // No live `id` — `kind` is already the natural key and is only ever
            // used as a React key / form value (see the quotations page), so
            // reusing it directly is safe.
            id: subject.kind,
            kind: subject.kind as QuotationSubject["kind"],
            name: subject.label,
            // No live `description` — see `QuotationSubject.description`'s optionality.
          }),
        ),
      ),

  submitRequest: (draft) => {
    // Live `QuotationRequestBody` has no `sportIds` at all — the backend
    // doesn't accept it, so it is dropped rather than renamed.
    const { sportIds: _sportIds, quantityEstimate, budgetRange, ...rest } = draft;
    return httpClient.post<{ reference: string }>(
      "/v1/quotation-requests",
      {
        ...rest,
        // Live `quantityEstimate` is a plain string, not a number.
        quantityEstimate: quantityEstimate === undefined ? undefined : String(quantityEstimate),
        // Live `budgetRange` is free text, not a structured `{min,max}` object —
        // the API can't do anything with the structured min/max but display it,
        // so it is serialized to a human-readable string before sending.
        budgetRange: budgetRange
          ? `${budgetRange.min.amount} - ${budgetRange.max.amount} ${budgetRange.min.currency}`
          : undefined,
      },
      { cache: "no-store" },
    );
  },
};
