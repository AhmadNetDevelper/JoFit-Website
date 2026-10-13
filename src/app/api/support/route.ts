import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { authService } from "@/features/auth";
import { supportService, type SupportVisitor } from "@/features/support";
import { isAppError } from "@/lib";

/**
 * GET  /api/support          → the visitor's conversation (`?read=1` marks staff replies seen)
 * POST /api/support { body, name?, email? } → send a message (starts a conversation)
 *
 * The chat bubble is a client component that talks to this. A signed-in
 * visitor is recognised from their session; a guest by `jofit.support`, an
 * httpOnly cookie holding the token issued with their first message — so a
 * guest's conversation is theirs alone, and no script on the page can read it.
 */
const GUEST_COOKIE = "jofit.support";
const noStore = { "Cache-Control": "no-store" };

async function visitor(): Promise<SupportVisitor> {
  const session = await authService.getSession();
  if (session) {
    const { id, customerId, name, email } = session.account;
    return { accountId: id, customerId, name, email };
  }
  return { guestToken: (await cookies()).get(GUEST_COOKIE)?.value };
}

export async function GET(request: NextRequest) {
  const who = await visitor();
  if (request.nextUrl.searchParams.get("read") === "1") await supportService.markRead(who);
  return NextResponse.json(await supportService.getThread(who), { headers: noStore });
}

export async function POST(request: NextRequest) {
  const who = await visitor();
  const input = (await request.json().catch(() => ({}))) as { body?: unknown; name?: unknown; email?: unknown };
  const text = (value: unknown) => (typeof value === "string" ? value : undefined);
  try {
    const { thread, guestToken } = await supportService.send(who, {
      body: text(input.body) ?? "",
      name: text(input.name),
      email: text(input.email),
    });
    if (guestToken) {
      (await cookies()).set(GUEST_COOKIE, guestToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
      });
    }
    return NextResponse.json(thread, { headers: noStore });
  } catch (error) {
    if (!isAppError(error)) throw error;
    const details = error.details as { fieldErrors?: Record<string, string> } | undefined;
    return NextResponse.json(
      { error: { code: error.code, message: error.message, fieldErrors: details?.fieldErrors } },
      { status: error.status ?? 400, headers: noStore },
    );
  }
}
