// ─────────────────────────────────────────────────────────────────────────────
// Merchant configuration registry
// Each merchant overrides the BNPL calculation constants.
// ─────────────────────────────────────────────────────────────────────────────

export type MerchantConfig = {
  /** Lowercase, URL-safe, unique identifier. Must not be a reserved slug. */
  slug: string;
  /** Display name — used in PostHog events and not-found messaging. */
  name: string;
  /** Monthly interest rate expressed as a percentage, e.g. 7.5 means 7.5 % per month. */
  monthlyRatePct: number;
  /** Management fee expressed as a percentage of itemCost, e.g. 1.5 means 1.5 %. */
  managementFeePct: number;
  /** Fixed platform fee in Naira added on top of the management fee. Use 0 to waive. */
  fixedFee: number;
  /** Minimum down payment as a percentage of itemCost, e.g. 30. Use 0 to disable the minimum. */
  minDownPaymentPct: number;
};

// ─── Default merchant (platform baseline) ─────────────────────────────────────
// DEFAULT_MERCHANT is intentionally NOT in MERCHANTS — it is not routable and
// cannot be returned by getMerchant().

export const DEFAULT_MERCHANT: MerchantConfig = {
  slug: "default",
  name: "Default",
  monthlyRatePct: 7.5,
  managementFeePct: 1.5,
  fixedFee: 6000,
  minDownPaymentPct: 30,
};

// ─── Merchant registry ─────────────────────────────────────────────────────────
// Add one entry per merchant partner. The key must equal the slug field.

export const MERCHANTS: Record<string, MerchantConfig> = {
  gloworld: {
    slug: "gloworld",
    name: "Gloworld",
    monthlyRatePct: 5.5,
    managementFeePct: 0,
    fixedFee: 0,
    minDownPaymentPct: 30,
  },
};

// ─── Reserved slugs ────────────────────────────────────────────────────────────
// These slugs must never be used as merchant identifiers.

export const RESERVED_SLUGS: ReadonlyArray<string> = [
  "api",
  "_next",
  "manifest.webmanifest",
  "manifest.json",
  "sw.js",
  "offline",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "default",
  // Top-level folders in public/ (these would otherwise pass SLUG_PATTERN).
  "icons",
  "fonts",
];

// Valid slug pattern: lowercase alphanumeric segments separated by single hyphens.
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ─── Registry validation ───────────────────────────────────────────────────────
// Runs unconditionally (in every environment) so bad entries fail the build.

export function validateMerchants(registry: Record<string, MerchantConfig> = MERCHANTS): void {
  const seenSlugs = new Set<string>();

  for (const [key, config] of Object.entries(registry)) {
    const { slug } = config;

    // Key must equal slug field.
    if (key !== slug) {
      throw new Error(
        `[merchants] "${slug}": MERCHANTS key "${key}" does not match slug "${slug}".`
      );
    }

    // Slug format: must match pattern (also catches uppercase, spaces, special chars).
    if (!SLUG_PATTERN.test(slug)) {
      throw new Error(
        `[merchants] "${slug}": slug must match /^[a-z0-9]+(-[a-z0-9]+)*$/ (lowercase, no leading/trailing spaces, no special characters).`
      );
    }

    // Reserved check.
    if (RESERVED_SLUGS.includes(slug)) {
      throw new Error(
        `[merchants] "${slug}": slug is reserved and cannot be used.`
      );
    }

    // Duplicate check.
    if (seenSlugs.has(slug)) {
      throw new Error(
        `[merchants] "${slug}": duplicate slug detected.`
      );
    }

    // Numeric field checks.
    const numericFields = [
      ["monthlyRatePct", config.monthlyRatePct],
      ["managementFeePct", config.managementFeePct],
      ["fixedFee", config.fixedFee],
      ["minDownPaymentPct", config.minDownPaymentPct],
    ] as const;

    for (const [field, value] of numericFields) {
      if (typeof value !== "number" || !isFinite(value) || isNaN(value)) {
        throw new Error(
          `[merchants] "${slug}": ${field} must be a finite number (got ${value}).`
        );
      }
      if (value < 0) {
        throw new Error(
          `[merchants] "${slug}": ${field} must be >= 0 (got ${value}).`
        );
      }
    }

    if (config.monthlyRatePct > 100) {
      throw new Error(
        `[merchants] "${slug}": monthlyRatePct must be <= 100 (got ${config.monthlyRatePct}).`
      );
    }
    if (config.managementFeePct > 100) {
      throw new Error(
        `[merchants] "${slug}": managementFeePct must be <= 100 (got ${config.managementFeePct}).`
      );
    }
    if (config.minDownPaymentPct >= 100) {
      throw new Error(
        `[merchants] "${slug}": minDownPaymentPct must be < 100 (got ${config.minDownPaymentPct}).`
      );
    }

    seenSlugs.add(slug);
  }
}

// Run unconditionally at module load — fails the build if any entry is invalid.
validateMerchants();

// ─── Internal Map — prototype-chain-safe lookup ───────────────────────────────
// Prevents "constructor", "toString", "__proto__" etc. from being returned.

const _merchantMap = new Map<string, MerchantConfig>(Object.entries(MERCHANTS));

// ─── Lookup helper ────────────────────────────────────────────────────────────

/**
 * Returns the MerchantConfig for the given slug, or null if not found.
 *
 * The lookup is performed against a Map — not a plain object — so prototype
 * property names ("constructor", "toString", "__proto__", etc.) always return
 * null rather than a built-in function.
 *
 * Intentionally does NOT fall back to DEFAULT_MERCHANT for unknown slugs.
 * Callers must decide what to do when the merchant is not found.
 */
export function getMerchant(slug: string): MerchantConfig | null {
  const normalised = slug.trim().toLowerCase();
  if (normalised === "") return null;
  return _merchantMap.get(normalised) ?? null;
}
