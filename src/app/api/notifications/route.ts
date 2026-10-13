import { NextResponse, type NextRequest } from "next/server";

import { authService } from "@/features/auth";
import { notificationsService, type NotificationReader } from "@/features/notifications";
import { resolveLocale } from "@/i18n";

/**
 * GET  /api/notifications?locale=ar  → the signed-in visitor's bell
 * POST /api/notifications { ids? }   → mark read (all when `ids` is absent)
 *
 * The bell in the header is a client component that polls this. It exists so
 * the browser never holds the API token: this handler reads the session from
 * the httpOnly cookie and calls the service on the server, like every page.
 */
async function reader(): Promise<NotificationReader | null> {
  const session = await authService.getSession();
  if (!session) return null;
  const { role, customerId, coachId, employerId } = session.account;
  return { role, customerId, coachId, employerId };
}

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const who = await reader();
  if (!who) return NextResponse.json({ items: [], unreadCount: 0 }, { status: 401, headers: noStore });
  const locale = resolveLocale(request.nextUrl.searchParams.get("locale") ?? undefined);
  return NextResponse.json(await notificationsService.list(who, locale), { headers: noStore });
}

export async function POST(request: NextRequest) {
  const who = await reader();
  if (!who) return new NextResponse(null, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string") : undefined;
  await notificationsService.markRead(who, ids);
  return new NextResponse(null, { status: 204 });
}
