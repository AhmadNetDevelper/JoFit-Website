import { resolveService } from "@/services";

import type { AuthService } from "./auth.contract";
import { httpAuthService } from "./auth.http";
import { mockAuthService } from "./auth.mock";

/**
 * Add `auth.http.ts`, register it as `http`, and every screen that signs a
 * shopper in switches over with no other change.
 */
export const authService = resolveService<AuthService>("auth", {
  mock: mockAuthService,
  http: httpAuthService,
});

export type { AuthService } from "./auth.contract";
export { FIXTURE_EMAIL, FIXTURE_PASSWORD } from "./auth.mock";
