import { NextResponse } from "next/server";

import { isAppError } from "@/lib";
import type { DownloadedFile } from "@/services";

/**
 * STREAMING A PRIVATE FILE — a CV — back to the one person allowed to have it.
 *
 * Shared by the candidate's route (`/api/careers/cv/[applicationId]`) and the
 * employer's (`/api/employer/cv/[applicationId]`): the two differ only in WHO
 * may ask and which service call proves it, so each route does its own
 * session check and hands the result to `privateFileResponse`, or its failure
 * to `privateFileError`.
 *
 * A CV is personal data. So the response is never cached anywhere
 * (`private, no-store`), never sniffed into something the browser would run
 * (`nosniff`), and always a download (`attachment`) rather than a page on this
 * origin. A file that is missing and a file that is not yours both answer 404:
 * telling the two apart would confirm to a stranger that the id exists.
 */
const HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
} as const;

/**
 * `Content-Disposition` with both spellings of the name: an ASCII fallback for
 * old clients, and the exact UTF-8 name (an Arabic file name survives) in
 * `filename*`.
 */
export function contentDisposition(fileName: string): string {
  const clean = fileName.replace(/[\r\n"\\/]/g, "").trim() || "cv";
  const ascii = clean.normalize("NFKD").replace(/[^\x20-\x7e]/g, "").replace(/\s+/g, "-") || "cv";
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(clean)}`;
}

export function privateFileResponse(file: DownloadedFile): NextResponse {
  return new NextResponse(file.bytes, {
    status: 200,
    headers: {
      ...HEADERS,
      "Content-Type": file.contentType || "application/octet-stream",
      "Content-Length": String(file.bytes.byteLength),
      "Content-Disposition": contentDisposition(file.fileName),
    },
  });
}

/** Nobody (or the wrong kind of account) is signed in. */
export function privateFileUnauthorized(): NextResponse {
  return NextResponse.json({ error: { code: "unauthorized" } }, { status: 401, headers: HEADERS });
}

/**
 * A service failure as a response: not found and not yours are both 404, an
 * expired session is 401, anything else is left to throw — it is a bug, and
 * Next reports it as one.
 */
export function privateFileError(error: unknown): NextResponse {
  if (isAppError(error)) {
    if (error.code === "unauthorized") return privateFileUnauthorized();
    if (error.code === "not-found" || error.code === "forbidden") {
      return NextResponse.json({ error: { code: "not-found" } }, { status: 404, headers: HEADERS });
    }
  }
  throw error;
}
