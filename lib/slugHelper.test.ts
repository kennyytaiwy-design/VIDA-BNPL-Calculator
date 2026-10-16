import { describe, it, expect } from "vitest";
import { getLowercaseRedirectPath } from "./slugHelper";

describe("getLowercaseRedirectPath", () => {
  it('"/GloWorld" → "/gloworld" (redirects mixed-case slug)', () => {
    expect(getLowercaseRedirectPath("/GloWorld")).toBe("/gloworld");
  });

  it('"/gloworld" → null (already canonical, no redirect)', () => {
    expect(getLowercaseRedirectPath("/gloworld")).toBeNull();
  });

  it('"/" → null (root path is never redirected)', () => {
    expect(getLowercaseRedirectPath("/")).toBeNull();
  });

  it('"/fonts/clash-display/fonts/ClashDisplay-Bold.woff2" → null (multi-segment path)', () => {
    expect(
      getLowercaseRedirectPath(
        "/fonts/clash-display/fonts/ClashDisplay-Bold.woff2"
      )
    ).toBeNull();
  });

  it('"/_next/static/chunks/Abc.js" → null (multi-segment Next.js internal)', () => {
    expect(
      getLowercaseRedirectPath("/_next/static/chunks/Abc.js")
    ).toBeNull();
  });

  it('"/manifest.json" → null (dotted file path)', () => {
    expect(getLowercaseRedirectPath("/manifest.json")).toBeNull();
  });

  it('"/Icons/x.png" → null (multi-segment path with dot)', () => {
    expect(getLowercaseRedirectPath("/Icons/x.png")).toBeNull();
  });
});
