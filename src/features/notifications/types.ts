export type NotificationKind =
  | "order-placed"
  | "order-status"
  | "rental-status"
  | "session-requested"
  | "session-status"
  | "enrolment-requested"
  | "enrolment-status"
  | "review-submitted"
  | "review-moderated"
  | "quotation-received"
  | "support-message"
  | "employer-registered"
  | "employer-verification"
  | "job-submitted"
  | "job-moderated"
  | "job-application"
  | "application-status";

/** One line in a signed-in customer's, coach's or employer's bell, in their language. */
export interface Notification {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly title: string;
  readonly body: string;
  /** A site path without the locale. */
  readonly href: string;
  readonly createdAt: string;
  readonly isRead: boolean;
}

export interface NotificationFeed {
  /** Newest first, at most 30. */
  readonly items: readonly Notification[];
  readonly unreadCount: number;
}

/** Who is asking — taken from the session, never from the request. */
export interface NotificationReader {
  readonly role: "customer" | "coach" | "employer";
  readonly customerId?: string;
  readonly coachId?: string;
  readonly employerId?: string;
}
