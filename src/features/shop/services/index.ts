import { resolveService } from "@/services";

import type { ShopService } from "./shop.contract";
import { httpShopService } from "./shop.http";
import { mockShopService } from "./shop.mock";

export const shopService = resolveService<ShopService>("shop", {
  mock: mockShopService,
  http: httpShopService,
});

export type { ShopService } from "./shop.contract";
