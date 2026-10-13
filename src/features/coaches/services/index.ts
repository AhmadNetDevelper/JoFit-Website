import { resolveService } from "@/services";

import type { CoachesService } from "./coaches.contract";
import { httpCoachesService } from "./coaches.http";
import { mockCoachesService } from "./coaches.mock";

export const coachesService = resolveService<CoachesService>("coaches", {
  mock: mockCoachesService,
  http: httpCoachesService,
});

export type { CoachesService } from "./coaches.contract";
