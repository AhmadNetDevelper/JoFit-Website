import { mockBridgeService } from "./bridge.mock";

/**
 * Mock only, by design, so it is not registered with `resolveService` (which
 * throws at import when a data source has no adapter): against a real backend
 * the admin and the storefront share the API itself and there is nothing to
 * bridge. The route that exposes it checks the data source before using it.
 */
export const bridgeService = mockBridgeService;

export type { BridgeService } from "./bridge.mock";
