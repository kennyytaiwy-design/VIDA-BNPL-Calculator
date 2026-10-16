/**
 * Pure helper: given a URL pathname, decide whether a lowercase-canonical
 * redirect is needed.
 *
 * Returns the redirect-target pathname (e.g. "/gloworld") or null (no redirect).
 * The query string is NOT part of the pathname argument; callers must preserve it
 * themselves (e.g. by cloning request.nextUrl and changing only url.pathname).
 *
 * A redirect is issued only when ALL of the following hold:
 *   1. The path has exactly one segment (no "/" after the leading slash).
 *   2. The segment contains no "." (not a static file like /manifest.json).
 *   3. The segment differs from its trim().toLowerCase() form.
 *
 * Returns null (no redirect) for:
 *   "/"                                — root
 *   "/fonts/…", "/_next/…", "/api/…"  — multi-segment paths
 *   "/manifest.json", "/sw.js"         — dotted (file) paths
 *   "/gloworld"                        — already canonical
 */
export function getLowercaseRedirectPath(pathname: string): string | null {
  if (!pathname.startsWith("/")) return null;

  const raw = pathname.slice(1); // strip leading slash

  // Root
  if (raw === "") return null;

  // More than one segment (e.g. /fonts/foo, /_next/static/…, /Icons/x.png)
  if (raw.includes("/")) return null;

  // Static file — has an extension marker (e.g. /manifest.json, /favicon.ico)
  if (raw.includes(".")) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null; // malformed percent-encoding — let the router handle it
  }

  const canonical = decoded.trim().toLowerCase();

  // Already canonical, or empty after trimming
  if (canonical === "" || canonical === decoded) return null;

  return `/${canonical}`;
}
