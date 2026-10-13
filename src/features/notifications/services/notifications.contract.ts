import type { Locale } from "@/i18n";

import type { NotificationFeed, NotificationReader } from "../types";

export interface NotificationsService {
  list(reader: NotificationReader, locale: Locale): Promise<NotificationFeed>;
  /** Marks these as read, or every one of the reader's when `ids` is omitted. */
  markRead(reader: NotificationReader, ids?: readonly string[]): Promise<void>;
}
