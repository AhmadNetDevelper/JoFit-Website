/**
 * Where domain services read their data from.
 *
 * `mock`  – bundled fixtures under `src/mocks` (the only adapter that exists today)
 * `http`  – a real backend over `services/http`; register the adapters, flip this flag.
 */
export type DataSource = "mock" | "http";

function readDataSource(): DataSource {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "http" ? "http" : "mock";
}

export const apiConfig = {
  dataSource: readDataSource(),
  /** Only meaningful once `dataSource` is `http`. */
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  timeoutMs: 15_000,
  /**
   * Artificial delay applied by the mock adapters so loading states are
   * reachable during development. Keep at 0 in CI and production builds.
   */
  mockLatencyMs: Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? 0),
} as const;
