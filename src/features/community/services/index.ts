import { resolveService } from "@/services";

import type { CommunityService } from "./community.contract";
import { httpCommunityService } from "./community.http";
import { mockCommunityService } from "./community.mock";

export const communityService = resolveService<CommunityService>("community", {
  mock: mockCommunityService,
  http: httpCommunityService,
});

export type { CommunityService } from "./community.contract";
