import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLowercaseRedirectPath } from "./lib/slugHelper";

/**
 * Canonicalise merchant URLs BEFORE Next.js routes or renders them:
 *   /GloWorld                  → 308 → /gloworld
 *   /GloWorld?utm_source=test  → 308 → /gloworld?utm_source=test
 *
 * Why here and not only in app/[merchant]/page.tsx:
 * /[merchant] is prerendered (generateStaticParams) with dynamicParams = true,
 * so Next caches every rendered slug on disk by path. If "/GloWorld" were
 * rendered by the page, its 308 response would be cached as "GloWorld.html".
 * On a case-insensitive filesystem (macOS default) that is the SAME file as the
 * real "gloworld.html", so the redirect overwrote the Gloworld page and
 * "/gloworld" started redirecting to itself. Redirecting in the proxy means
 * non-canonical slugs never reach the page or the cache.
 *
 * The decision logic lives entirely in getLowercaseRedirectPath (lib/slugHelper.ts)
 * so it can be unit-tested without a Next.js request context.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const redirectPath = getLowercaseRedirectPath(pathname);

  if (redirectPath === null) {
    return NextResponse.next();
  }

  // Clone preserves the full URL (query string, protocol, host).
  // We only change the pathname — query string is kept automatically.
  const url = request.nextUrl.clone();
  url.pathname = redirectPath;
  return NextResponse.redirect(url, 308);
}

export const config = {
  // One segment, not Next internals. File paths are filtered in getLowercaseRedirectPath.
  matcher: ["/((?!_next/|api/)[^/]+)"],
};
