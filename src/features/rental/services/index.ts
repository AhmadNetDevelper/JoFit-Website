import { resolveService } from "@/services";

import type { RentalService } from "./rental.contract";
import { httpRentalService } from "./rental.http";
import { mockRentalService } from "./rental.mock";

export const rentalService = resolveService<RentalService>("rental", {
  mock: mockRentalService,
  http: httpRentalService,
});

export type { RentalService } from "./rental.contract";
