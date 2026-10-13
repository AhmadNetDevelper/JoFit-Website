import { NextResponse, type NextRequest } from "next/server";

import { authService } from "@/features/auth";
import { employerPortalService } from "@/features/employer-portal";
import { isAppError } from "@/lib";

/**
 * GET /api/employer/cv/:applicationId → the CV attached to one application.
 *
 * A CV is private: the candidate's, the employer they applied to, and JoFit
 * staff's — nobody else's. So this answers only the signed-in EMPLOYER, and
 * only for an application to its own jobs; the service scopes every read to
 * the employer the session names, so another company's application is
 * "not found", never "forbidden", and an id cannot be probed.
 *
 *   401  nobody is signed in
 *   403  signed in, but not as an employer
 *   404  no such application for this employer (or its file is gone)
 *
 * The file is streamed as an attachment with `private, no-store`: no shared
 * cache, proxy or back button may keep a copy.
 */
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

function refuse(status: 401 | 403 | 404) {
  return new NextResponse(null, { status, headers: privateHeaders });
}

/** `filename=` must be plain ASCII; the real name travels in `filename*`. */
function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_") || "cv";
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(_request: NextRequest, context: RouteContext<"/api/employer/cv/[applicationId]">) {
  const session = await authService.getSession();
  if (!session) return refuse(401);
  const { role, employerId } = session.account;
  if (role !== "employer" || !employerId) return refuse(403);

  const { applicationId } = await context.params;
  try {
    const file = await employerPortalService.downloadCv(employerId, applicationId);
    return new NextResponse(file.bytes, {
      status: 200,
      headers: {
        ...privateHeaders,
        "Content-Type": file.contentType,
        "Content-Length": String(file.bytes.byteLength),
        "Content-Disposition": contentDisposition(file.fileName),
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      if (error.code === "unauthorized") return refuse(401);
      if (error.code === "forbidden") return refuse(403);
      if (error.code === "not-found") return refuse(404);
    }
    throw error;
  }
}
