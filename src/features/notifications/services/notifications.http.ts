import { httpClient } from "@/services";

import type { NotificationFeed, NotificationKind } from "../types";
import type { NotificationsService } from "./notifications.contract";

/** `NotificationFeedDto` — item ids are int64. */
interface LiveNotificationFeed {
  readonly items: readonly {
    readonly id: number;
    readonly kind: string;
    readonly title: string;
    readonly body: string;
    readonly href: string;
    readonly createdAt: string;
    readonly isRead: boolean;
  }[];
  readonly unreadCount: number;
}

function toFeed(dto: LiveNotificationFeed): NotificationFeed {
  return {
    items: dto.items.map((item) => ({ ...item, id: String(item.id), kind: item.kind as NotificationKind })),
    unreadCount: dto.unreadCount,
  };
}

/**
 * The signed-in visitor's bell over `/v1/notifications`. The reader is whoever
 * the bearer token belongs to (customer or coach); the argument is the mock's
 * need. Never cached: it is the one thing on the page that must be current.
 */
export const httpNotificationsService: NotificationsService = {
  list: (_reader, locale) =>
    // Live param is `language`, not `locale` — the wrong name silently falls
    // back to the API's own default language instead of the caller's.
    httpClient
      .get<LiveNotificationFeed>("/v1/notifications", { query: { language: locale }, auth: true, cache: "no-store" })
      .then(toFeed),
  markRead: async (_reader, ids) => {
    // Live `MarkReadRequest.ids` is `integer[int64][]`; a quoted string id in
    // the JSON body would fail strict deserialization against a real `long`.
    await httpClient.post<void>("/v1/notifications/read", ids ? { ids: ids.map(Number) } : {}, { auth: true });
  },
};
