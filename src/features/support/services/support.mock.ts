import { AppError } from "@/lib";
import {
  accountStore,
  nextReference,
  notify,
  touch,
  type RawConversation,
  type RawSupportMessage,
} from "@/mocks/accounts";
import { simulateLatency } from "@/mocks/runtime";

import type { SupportThread, SupportVisitor } from "../types";
import type { SupportService } from "./support.contract";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The visitor's most recent conversation: theirs by account, or by the guest token. */
function find(visitor: SupportVisitor): RawConversation | undefined {
  const match = (entry: RawConversation) =>
    visitor.accountId
      ? entry.accountId === visitor.accountId
      : Boolean(visitor.guestToken) && entry.guestToken === visitor.guestToken;
  return accountStore()
    .conversations.filter(match)
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))[0];
}

function toThread(conversation: RawConversation | undefined): SupportThread {
  if (!conversation) return { conversation: null, messages: [], unread: 0 };
  const messages = accountStore()
    .supportMessages.filter((message) => message.conversationId === conversation.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const seen = conversation.visitorReadAt ?? "";
  return {
    conversation: { id: conversation.id, reference: conversation.reference, status: conversation.status },
    messages: messages.map(({ id, author, authorName, body, createdAt }) => ({ id, author, authorName, body, createdAt })),
    unread: messages.filter((message) => message.author === "staff" && message.createdAt > seen).length,
  };
}

function replace(conversation: RawConversation): void {
  const { conversations } = accountStore();
  conversations[conversations.findIndex((entry) => entry.id === conversation.id)] = conversation;
}

function invalid(fieldErrors: Record<string, string>): never {
  throw new AppError("validation", "Some fields need attention.", { status: 422, details: { fieldErrors } });
}

export const mockSupportService: SupportService = {
  async getThread(visitor) {
    await simulateLatency();
    return toThread(find(visitor));
  },

  async send(visitor, input) {
    await simulateLatency();
    const body = input.body.trim();
    const fieldErrors: Record<string, string> = {};
    if (body.length < 2) fieldErrors.body = "Write a message first.";
    if (body.length > 2000) fieldErrors.body = "Keep it under 2,000 characters.";

    const store = accountStore();
    let conversation = find(visitor);
    let issuedToken: string | undefined;
    const now = new Date().toISOString();

    /* A closed conversation is finished; a new message opens a new one. */
    if (!conversation || conversation.status === "closed") {
      const name = (visitor.name ?? input.name ?? "").trim();
      const email = (visitor.email ?? input.email ?? "").trim().toLowerCase();
      if (!visitor.accountId) {
        if (name.length < 2) fieldErrors.name = "Tell us your name.";
        if (!EMAIL.test(email)) fieldErrors.email = "An email address we can reply to.";
      }
      if (Object.keys(fieldErrors).length > 0) invalid(fieldErrors);

      const guestToken = visitor.accountId ? undefined : (visitor.guestToken ?? crypto.randomUUID());
      if (guestToken !== visitor.guestToken) issuedToken = guestToken;
      const reference = nextReference("SC-9");
      conversation = {
        id: `conv-${reference.toLowerCase()}`,
        reference,
        accountId: visitor.accountId,
        customerId: visitor.customerId,
        name,
        email,
        guestToken,
        status: "open",
        createdAt: now,
        lastMessageAt: now,
        visitorReadAt: now,
        assigneeId: null,
      };
      store.conversations.push(conversation);
    } else if (Object.keys(fieldErrors).length > 0) {
      invalid(fieldErrors);
    }

    const message: RawSupportMessage = {
      id: nextReference("msg-w"),
      conversationId: conversation.id,
      author: "visitor",
      authorName: conversation.name,
      body,
      createdAt: now,
    };
    store.supportMessages.push(message);
    replace({ ...conversation, lastMessageAt: now, visitorReadAt: now, staffReadAt: undefined });

    /* One unread line per conversation in the staff bell, not one per message. */
    const href = `/support/${conversation.id}`;
    const pending = store.notifications.some(
      (entry) => entry.audience === "staff" && entry.href === href && !entry.readAt,
    );
    if (!pending) {
      notify({
        audience: "staff",
        kind: "support-message",
        title: { en: `New message from ${conversation.name}`, ar: `رسالة جديدة من ${conversation.name}` },
        body: { en: body.slice(0, 120), ar: body.slice(0, 120) },
        href,
      });
    }
    touch();

    return { thread: toThread(store.conversations.find((entry) => entry.id === conversation.id)), guestToken: issuedToken };
  },

  async markRead(visitor) {
    await simulateLatency();
    const conversation = find(visitor);
    if (!conversation) return;
    replace({ ...conversation, visitorReadAt: new Date().toISOString() });
    touch();
  },
};
