import { resolveService } from "@/services";

import type { ContentService } from "./content.contract";
import { httpContentService } from "./content.http";
import { mockContentService } from "./content.mock";

export const contentService = resolveService<ContentService>("content", {
  mock: mockContentService,
  http: httpContentService,
});

export type { ContentService } from "./content.contract";
