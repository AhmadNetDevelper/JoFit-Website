export type ConversationStatus = "open" | "closed";

export interface SupportMessage {
  readonly id: string;
  /** `visitor` is the customer, coach or guest; `staff` is JoFit. */
  readonly author: "visitor" | "staff";
  readonly authorName: string;
  readonly body: string;
  readonly createdAt: string;
}

export interface SupportThread {
  /** Null until the visitor sends a first message. */
  readonly conversation: {
    readonly id: string;
    readonly reference: string;
    readonly status: ConversationStatus;
  } | null;
  readonly messages: readonly SupportMessage[];
  /** Staff replies the visitor has not seen yet. */
  readonly unread: number;
}

/**
 * Who is chatting. A signed-in visitor is known by their account (from the
 * session, never from the request); a guest by the secret token their browser
 * was given with their first message.
 */
export interface SupportVisitor {
  readonly accountId?: string;
  readonly customerId?: string;
  readonly name?: string;
  readonly email?: string;
  readonly guestToken?: string;
}

export interface SupportMessageInput {
  readonly body: string;
  /** Required for a guest's first message; ignored once signed in. */
  readonly name?: string;
  readonly email?: string;
}

export interface SupportSendResult {
  readonly thread: SupportThread;
  /** Issued when a guest starts a conversation; the caller keeps it in an httpOnly cookie. */
  readonly guestToken?: string;
}
