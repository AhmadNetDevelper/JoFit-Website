import { resolveService } from "@/services";

import type { CheckoutService } from "./checkout.contract";
import { httpCheckoutService } from "./checkout.http";
import { mockCheckoutService } from "./checkout.mock";

export const checkoutService = resolveService<CheckoutService>("checkout", {
  mock: mockCheckoutService,
  http: httpCheckoutService,
});

export type { CheckoutService } from "./checkout.contract";
