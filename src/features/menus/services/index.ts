import { resolveService } from "@/services";

import type { MenusService } from "./menus.contract";
import { httpMenusService } from "./menus.http";
import { mockMenusService } from "./menus.mock";

export const menusService = resolveService<MenusService>("menus", {
  mock: mockMenusService,
  http: httpMenusService,
});

export type { MenusService } from "./menus.contract";
