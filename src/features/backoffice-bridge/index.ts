/** SERVER ONLY — used by `app/api/dev/store`, in development, against mock data. */
export { bridgeService, type BridgeService } from "./services";
export type {
  BridgeKind,
  BridgePatch,
  BridgeSnapshot,
  CatalogueImagePatch,
  CatalogueImageRecord,
} from "./types";
