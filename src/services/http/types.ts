export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpRequestOptions {
  readonly method?: HttpMethod;
  readonly query?: Record<string, unknown>;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  /** Forward the signed-in visitor's API token. Also disables caching. */
  readonly auth?: boolean;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  /**
   * Passed straight through to Next.js `fetch`. Caching policy is a per-call
   * decision (a product page and a cart are not cached alike), so it is never
   * hardcoded inside the client.
   */
  readonly cache?: RequestCache;
  readonly revalidate?: number | false;
  readonly tags?: readonly string[];
}
