import { resolveService } from "@/services";

import type { CoachRegistrationService } from "./coach-registration.contract";
import { httpCoachRegistrationService } from "./coach-registration.http";
import { mockCoachRegistrationService } from "./coach-registration.mock";

export const coachRegistrationService = resolveService<CoachRegistrationService>("coach-registration", {
  mock: mockCoachRegistrationService,
  http: httpCoachRegistrationService,
});

export type { CoachRegistrationService } from "./coach-registration.contract";
