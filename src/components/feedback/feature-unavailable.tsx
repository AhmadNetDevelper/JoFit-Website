import { StateMessage } from "./state-message";

/**
 * Rendered where a domain is architecturally present but switched off in
 * `config/features.ts`. It keeps the route, its metadata and its types real
 * while making the incomplete state explicit rather than implied by an empty
 * page. Copy arrives translated from the caller.
 */
export function FeatureUnavailable({ title, description }: { title: string; description: string }) {
  return <StateMessage title={title} description={description} />;
}
