/** Editorial lifecycle shared by content, courses and community posts. */
export type PublishStatus = "draft" | "published" | "archived";

/** The generic shape of a remote resource as the UI experiences it. */
export type LoadState = "idle" | "loading" | "success" | "empty" | "error";
