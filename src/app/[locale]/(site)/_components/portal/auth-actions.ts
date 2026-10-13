"use server";

import { redirect } from "next/navigation";

import { authService } from "@/features/auth";
import { localePath, resolveLocale } from "@/i18n";

/**
 * Signing out, as a Server Action so the cookies are cleared by the server
 * that set them. A form posts it, which means it works before any JavaScript
 * has loaded — the one button on a shared computer that must never fail.
 */
export async function signOutAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  await authService.signOut();
  redirect(localePath(locale, "/"));
}
