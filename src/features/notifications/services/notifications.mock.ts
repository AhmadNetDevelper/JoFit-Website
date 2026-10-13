import { resolveText } from "@/i18n";
import { accountStore, touch, type RawNotification } from "@/mocks/accounts";
import { simulateLatency } from "@/mocks/runtime";

import type { NotificationReader } from "../types";
import type { NotificationsService } from "./notifications.contract";

function mine(reader: NotificationReader) {
  const recipientId =
    reader.role === "coach" ? reader.coachId : reader.role === "employer" ? reader.employerId : reader.customerId;
  return (entry: RawNotification) => entry.audience === reader.role && entry.recipientId === recipientId;
}

export const mockNotificationsService: NotificationsService = {
  async list(reader, locale) {
    await simulateLatency();
    const all = accountStore().notifications.filter(mine(reader));
    return {
      items: all.slice(0, 30).map((entry) => ({
        id: entry.id,
        kind: entry.kind,
        title: resolveText(entry.title, locale),
        body: resolveText(entry.body, locale),
        href: entry.href,
        createdAt: entry.createdAt,
        isRead: Boolean(entry.readAt),
      })),
      unreadCount: all.filter((entry) => !entry.readAt).length,
    };
  },

  async markRead(reader, ids) {
    await simulateLatency();
    const store = accountStore();
    const now = new Date().toISOString();
    const isMine = mine(reader);
    let changed = false;
    store.notifications.forEach((entry, index) => {
      if (!isMine(entry) || entry.readAt || (ids && !ids.includes(entry.id))) return;
      store.notifications[index] = { ...entry, readAt: now };
      changed = true;
    });
    if (changed) touch();
  },
};
