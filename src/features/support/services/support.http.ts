import { httpClient } from "@/services";

import type { ConversationStatus, SupportMessage, SupportSendResult, SupportThread, SupportVisitor } from "../types";
import type { SupportService } from "./support.contract";

/** Wire shapes from `docs/api-live/website.json` (`Support` tag). */
interface SupportMessageDtoWire {
  readonly id: number;
  readonly sender: string;
  readonly authorName: string;
  readonly body: string;
  readonly sentAt: string;
}

interface ConversationSummaryDtoWire {
  readonly id: number;
  readonly reference: string;
  readonly status: string;
}

interface SupportThreadDtoWire {
  /**
   * Documented as required and non-nullable live, but handled defensively
   * below anyway — per the audit this is likely just an OpenAPI
   * nullability-generation quirk, not a guarantee worth trusting blindly for
   * "no conversation yet".
   */
  readonly conversation?: ConversationSummaryDtoWire | null;
  readonly messages: readonly SupportMessageDtoWire[];
  readonly unread: number;
}

interface SupportSendResultDtoWire {
  readonly thread: SupportThreadDtoWire;
  readonly guestToken?: string | null;
}

/**
 * Live `sender` is a bare, undocumented string — the spec gives no enum of
 * actual values. Anything that isn't literally "staff" falls back to
 * "visitor", the safer default when rendering someone's own chat transcript.
 */
function toAuthor(sender: string): "visitor" | "staff" {
  return sender.trim().toLowerCase() === "staff" ? "staff" : "visitor";
}

/** Same defensiveness as `toAuthor`: live `status` is an undocumented string. */
function toConversationStatus(status: string): ConversationStatus {
  return status.trim().toLowerCase() === "closed" ? "closed" : "open";
}

function toMessage(dto: SupportMessageDtoWire): SupportMessage {
  return {
    id: String(dto.id),
    author: toAuthor(dto.sender),
    authorName: dto.authorName,
    body: dto.body,
    createdAt: dto.sentAt,
  };
}

function toThread(dto: SupportThreadDtoWire): SupportThread {
  return {
    conversation: dto.conversation
      ? { id: String(dto.conversation.id), reference: dto.conversation.reference, status: toConversationStatus(dto.conversation.status) }
      : null,
    messages: dto.messages.map(toMessage),
    unread: dto.unread,
  };
}

/**
 * Support chat over `/v1/support/conversation`. A signed-in visitor is the
 * bearer token's account (`auth: true` forwards it when there is one); a
 * guest is identified by the token the API issued with their first message,
 * sent back as `X-Support-Token`.
 *
 * THE HEADER, RE-CHECKED AGAINST THE LIVE SCHEMAS. None of the three Support
 * operations document this anywhere — not as a header, a query parameter, or
 * a request-body field. The send endpoint was checked directly:
 * `SupportSendRequest` has only `body`/`name`/`email` (no field to carry a
 * token back to the server), and `SupportSendResultDto.guestToken` IS a
 * response-body field, not a header — which `send` below already reads
 * correctly, straight off the mapped DTO. With no documented alternative on
 * any of the three calls, the header stays: the most plausible explanation is
 * a `[FromHeader]` binding the OpenAPI generator dropped, per the audit.
 */
const as = (visitor: SupportVisitor) => ({
  auth: true,
  cache: "no-store" as const,
  headers: visitor.guestToken ? { "X-Support-Token": visitor.guestToken } : undefined,
});

export const httpSupportService: SupportService = {
  getThread: (visitor) => httpClient.get<SupportThreadDtoWire>("/v1/support/conversation", as(visitor)).then(toThread),

  send: (visitor, input) =>
    httpClient
      .post<SupportSendResultDtoWire>("/v1/support/conversation/messages", input, as(visitor))
      .then((dto): SupportSendResult => ({ thread: toThread(dto.thread), guestToken: dto.guestToken ?? undefined })),

  markRead: async (visitor) => {
    await httpClient.post<void>("/v1/support/conversation/read", undefined, as(visitor));
  },
};
