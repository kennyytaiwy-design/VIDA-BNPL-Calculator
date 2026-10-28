// ─────────────────────────────────────────────────────────────────────────────
// Merchant logo registry — client-side bundle only
//
// Logo data is intentionally separated from the main merchants.ts config so it
// can be imported into client components without pulling in validation logic.
// This also side-steps Next.js RSC serialisation dropping optional fields across
// the Server → Client boundary.
// ─────────────────────────────────────────────────────────────────────────────

export interface MerchantLogoData {
  /** Path relative to /public, e.g. "/logos/greenbay-logo.webp" */
  src: string;
  /** Intrinsic pixel width — used by next/image for layout + srcset generation. */
  width: number;
  /** Intrinsic pixel height — used by next/image for layout + srcset generation. */
  height: number;
}

/** Fallback logo shown for all merchants that have no custom branding. */
export const DEFAULT_LOGO: MerchantLogoData = {
  src: "/logo.png",
  width: 133,
  height: 40,
};

/**
 * Merchant-specific logo overrides keyed by slug.
 *
 * Add a new entry here whenever a merchant supplies their own lockup.
 * Width/height must match the actual pixel dimensions of the file
 * (or an explicit @2x representation of them) so next/image can
 * generate correct srcset entries and avoid layout shift.
 */
export const MERCHANT_LOGOS: Record<string, MerchantLogoData> = {
  greenbay: {
    src: "/logos/greenbay-logo.webp",
    // 502 × 106 px source → rendered at height 55 px (proportional width)
    // 502 / 106 × 55 = 260 px wide
    width: 260,
    height: 55,
  },
};

/**
 * Returns the logo data for a given merchant slug, or the DEFAULT_LOGO if no
 * custom branding is registered for that slug.
 */
export function getMerchantLogo(slug?: string): MerchantLogoData {
  if (!slug) return DEFAULT_LOGO;
  return MERCHANT_LOGOS[slug] ?? DEFAULT_LOGO;
}
