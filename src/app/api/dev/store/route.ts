import { NextResponse, type NextRequest } from "next/server";

import { apiConfig } from "@/config";
import { bridgeService, type BridgePatch } from "@/features/backoffice-bridge";
import { isAppError } from "@/lib";

/**
 * GET  /api/dev/store            → the account store the admin mirrors
 * GET  /api/dev/store?since=N    → `{ unchanged: true }` if nothing moved since N
 * POST /api/dev/store            → apply one `BridgePatch` from the admin
 *
 * DEVELOPMENT ONLY, AND ONLY AGAINST MOCK DATA. It is unauthenticated because
 * there is no staff identity to check yet, which is exactly why it answers 404
 * in a production build or once a real backend is configured: at that point
 * the admin talks to the backend, and this route must not exist.
 *
 * CORS is opened to localhost origins only, so the admin's dev server (another
 * port) can call it and nothing else can.
 */
const enabled = () => process.env.NODE_ENV !== "production" && apiConfig.dataSource === "mock";

function corsHeaders(request: NextRequest): HeadersInit {
  const origin = request.headers.get("origin") ?? "";
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
      }
    : {};
}

const notFound = () => new NextResponse(null, { status: 404 });

export function OPTIONS(request: NextRequest) {
  if (!enabled()) return notFound();
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export function GET(request: NextRequest) {
  if (!enabled()) return notFound();
  const since = Number(request.nextUrl.searchParams.get("since") ?? Number.NaN);
  const headers = { ...corsHeaders(request), "Cache-Control": "no-store" };
  if (since === bridgeService.version()) {
    return NextResponse.json({ unchanged: true, version: since }, { headers });
  }
  return NextResponse.json(bridgeService.snapshot(), { headers });
}

export async function POST(request: NextRequest) {
  if (!enabled()) return notFound();
  const headers = corsHeaders(request);
  try {
    const patch = (await request.json()) as BridgePatch;
    const version = bridgeService.apply(patch);
    return NextResponse.json({ ok: true, version }, { headers });
  } catch (error) {
    const status = isAppError(error) ? (error.status ?? 400) : 400;
    const message = isAppError(error) ? error.message : "Malformed patch.";
    return NextResponse.json({ ok: false, message }, { status, headers });
  }
}
