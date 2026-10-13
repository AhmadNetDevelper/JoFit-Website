import type { SupportMessageInput, SupportSendResult, SupportThread, SupportVisitor } from "../types";

export interface SupportService {
  /** The visitor's current conversation, empty when they have none. */
  getThread(visitor: SupportVisitor): Promise<SupportThread>;
  /** Sends a message, starting a conversation if there is none (or the last one was closed). */
  send(visitor: SupportVisitor, input: SupportMessageInput): Promise<SupportSendResult>;
  /** The visitor has seen every staff reply so far. */
  markRead(visitor: SupportVisitor): Promise<void>;
}
