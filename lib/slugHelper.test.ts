import { describe, it, expect } from "vitest";
import { getLowercaseRedirectPath } from "./slugHelper";

describe("getLowercaseRedirectPath", () => {
  it('"/TestShop" → "/testshop" (redirects mixed-case slug)', () => {
    expect(getLowercaseRedirectPath("/TestShop")).toBe("/testshop");
  });

  it('"/testshop" → null (already canonical, no redirect)', () => {
    expect(getLowercaseRedirectPath("/testshop")).toBeNull();
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
