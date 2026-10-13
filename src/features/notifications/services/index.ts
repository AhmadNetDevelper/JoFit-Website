import { resolveService } from "@/services";

import type { NotificationsService } from "./notifications.contract";
import { httpNotificationsService } from "./notifications.http";
import { mockNotificationsService } from "./notifications.mock";

export const notificationsService = resolveService<NotificationsService>("notifications", {
  mock: mockNotificationsService,
  http: httpNotificationsService,
});

export type { NotificationsService } from "./notifications.contract";
