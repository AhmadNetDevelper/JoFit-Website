import { resolveService } from "@/services";

import type { AccountService } from "./account.contract";
import { httpAccountService } from "./account.http";
import { mockAccountService } from "./account.mock";

export const accountService = resolveService<AccountService>("account", {
  mock: mockAccountService,
  http: httpAccountService,
});

export type { AccountService } from "./account.contract";
