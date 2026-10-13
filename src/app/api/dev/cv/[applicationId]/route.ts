import { NextResponse, type NextRequest } from "next/server";

import { apiConfig } from "@/config";
import { bridgeService } from "@/features/backoffice-bridge";
import { isAppError } from "@/lib";

/**
 * GET /api/dev/cv/:applicationId → the CV sent with that application, for the
 * admin's "Download CV" while both apps run on mock data.
 *
 * The admin mirrors applications through `api/dev/store` with the CV's
 * metadata only; the bytes never travel in a snapshot. This is where it fetches
 * them, one file at a time, when a member of staff asks.
 *
 * DEVELOPMENT ONLY, AND ONLY AGAINST MOCK DATA — the same guard as
 * `api/dev/store`, for the same reason: there is no staff identity to check
 * yet, so the route must not exist in a production build or once a real
 * backend is configured. Against the API the admin opens
 * `GET /v1/admin/job-applications/:id/cv`, which checks the staff session.
 *
 * Never cached, and always a download: a CV is the candidate's, the employer
 * they applied to and JoFit staff's, and nobody else's.
 */
const enabled = () => process.env.NODE_ENV !== "production" && apiConfig.dataSource === "mock";

function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Expose-Headers": "Content-Disposition",
        Vary: "Origin",
      }
    : {};
}

const notFound = () => new NextResponse(null, { status: 404 });

export function OPTIONS(request: NextRequest) {
  if (!enabled()) return notFound();
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: NextRequest, context: RouteContext<"/api/dev/cv/[applicationId]">) {
  if (!enabled()) return notFound();
  const { applicationId } = await context.params;
  const headers = corsHeaders(request);
  try {
    const file = bridgeService.cv(applicationId);
    return new NextResponse(file.bytes, {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": file.contentType,
        "Content-Length": String(file.bytes.byteLength),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const status = isAppError(error) ? (error.status ?? 404) : 500;
    const message = isAppError(error) ? error.message : "The CV could not be read.";
    return NextResponse.json({ ok: false, message }, { status, headers: { ...headers, "Cache-Control": "no-store" } });
  }
}
