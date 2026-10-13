import type { NextRequest } from "next/server";

import { authService } from "@/features/auth";
import { careersService } from "@/features/careers";

import { privateFileError, privateFileResponse, privateFileUnauthorized } from "../../_lib/private-file";

/**
 * GET /api/careers/cv/:applicationId → the CV the signed-in CUSTOMER sent with
 * that application.
 *
 * The customer is the session's, never a parameter: `downloadMyCv` is asked
 * for this customer's application, so somebody else's id simply is not found.
 * The browser never holds the API token — this handler reads the httpOnly
 * session and calls the service on the server, like every page.
 */
export async function GET(_request: NextRequest, context: RouteContext<"/api/careers/cv/[applicationId]">) {
  const session = await authService.getSession();
  const customerId = session?.account.role === "customer" ? session.account.customerId : undefined;
  if (!customerId) return privateFileUnauthorized();

  const { applicationId } = await context.params;
  try {
    return privateFileResponse(await careersService.downloadMyCv(customerId, applicationId));
  } catch (error) {
    return privateFileError(error);
  }
}
