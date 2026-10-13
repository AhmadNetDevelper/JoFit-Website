import { resolveService } from "@/services";

import type { EducationService } from "./education.contract";
import { httpEducationService } from "./education.http";
import { mockEducationService } from "./education.mock";

export const educationService = resolveService<EducationService>("education", {
  mock: mockEducationService,
  http: httpEducationService,
});

export type { EducationService } from "./education.contract";
