import { resolveService } from "@/services";

import type { CoachPortalService } from "./coach-portal.contract";
import { httpCoachPortalService } from "./coach-portal.http";
import { mockCoachPortalService } from "./coach-portal.mock";

export const coachPortalService = resolveService<CoachPortalService>("coach-portal", {
  mock: mockCoachPortalService,
  http: httpCoachPortalService,
});

export type { CoachPortalService } from "./coach-portal.contract";
