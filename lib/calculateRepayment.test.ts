import { describe, it, expect } from "vitest";
import { calculateRepayment, getMinimumDownPayment } from "./calculateRepayment";
import {
  DEFAULT_MERCHANT,
  MERCHANTS,
  getMerchant,
  validateMerchants,
  type MerchantConfig,
} from "../src/config/merchants";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Test-only merchant (5.5% / no fees / 30% minimum). Defined here so the tests
 * never depend on real merchant rates in src/config/merchants.ts.
 */
const TEST_MERCHANT: MerchantConfig = {
  slug: "test-merchant",
  name: "Test Merchant",
  monthlyRatePct: 5.5,
  managementFeePct: 0,
  fixedFee: 0,
  minDownPaymentPct: 30,
};

/** Lookup tests use whichever merchant is listed first in the real registry. */
const FIRST_SLUG = Object.keys(MERCHANTS)[0];
const firstMerchant = MERCHANTS[FIRST_SLUG];

/** Zero-fee merchant used for rounding-noise and edge-case tests. */
const zeroMerchant: MerchantConfig = {
  slug: "zero-test",
  name: "Zero Test",
  monthlyRatePct: 0,
  managementFeePct: 0,
  fixedFee: 0,
  minDownPaymentPct: 0,
};

// ─── getMerchant ──────────────────────────────────────────────────────────────

describe("getMerchant", () => {
  it("returns the first registered merchant for its exact slug", () => {
    expect(getMerchant(FIRST_SLUG)).toEqual(firstMerchant);
  });

  it("returns the first registered merchant for an upper-case, padded slug (trims + lowercases)", () => {
    expect(getMerchant(`  ${FIRST_SLUG.toUpperCase()} `)).toEqual(firstMerchant);
  });

  it('returns null for ""', () => {
    expect(getMerchant("")).toBeNull();
  });

  it('returns null for "unknown"', () => {
    expect(getMerchant("unknown")).toBeNull();
  });

  it('returns null for "constructor" (prototype-chain guard)', () => {
    expect(getMerchant("constructor")).toBeNull();
  });

  it('returns null for "toString" (prototype-chain guard)', () => {
    expect(getMerchant("toString")).toBeNull();
  });

  it('returns null for "__proto__" (prototype-chain guard)', () => {
    expect(getMerchant("__proto__")).toBeNull();
  });

  it('returns null for "hasOwnProperty" (prototype-chain guard)', () => {
    expect(getMerchant("hasOwnProperty")).toBeNull();
  });
});

// ─── validateMerchants ────────────────────────────────────────────────────────

describe("validateMerchants", () => {
  it("passes for the real MERCHANTS registry", () => {
    expect(() => validateMerchants()).not.toThrow();
  });

  it("throws for an uppercase slug", () => {
    expect(() =>
      validateMerchants({
        Uppercase: {
          slug: "Uppercase",
          name: "Uppercase",
          monthlyRatePct: 5,
          managementFeePct: 0,
          fixedFee: 0,
          minDownPaymentPct: 0,
        },
      })
    ).toThrow(/Uppercase/);
  });

  it('throws for a slug with a space ("my shop")', () => {
    expect(() =>
      validateMerchants({
        "my shop": {
          slug: "my shop",
          name: "My Shop",
          monthlyRatePct: 5,
          managementFeePct: 0,
          fixedFee: 0,
          minDownPaymentPct: 0,
        },
      })
    ).toThrow(/my shop/);
  });

  it('throws for reserved slug "offline"', () => {
    expect(() =>
      validateMerchants({
        offline: {
          slug: "offline",
          name: "Offline",
          monthlyRatePct: 5,
          managementFeePct: 0,
          fixedFee: 0,
          minDownPaymentPct: 0,
        },
      })
    ).toThrow(/offline/);
  });

  it("throws for a negative fixedFee", () => {
    expect(() =>
      validateMerchants({
        testmerchant: {
          slug: "testmerchant",
          name: "Test Merchant",
          monthlyRatePct: 5,
          managementFeePct: 0,
          fixedFee: -100,
          minDownPaymentPct: 0,
        },
      })
    ).toThrow(/testmerchant/);
  });

  it("throws for a NaN rate", () => {
    expect(() =>
      validateMerchants({
        testmerchant: {
          slug: "testmerchant",
          name: "Test Merchant",
          monthlyRatePct: NaN,
          managementFeePct: 0,
          fixedFee: 0,
          minDownPaymentPct: 0,
        },
      })
    ).toThrow(/testmerchant/);
  });

  it("throws when MERCHANTS key does not match slug field", () => {
    expect(() =>
      validateMerchants({
        wrongkey: {
          slug: "rightslug",
          name: "Mismatch",
          monthlyRatePct: 5,
          managementFeePct: 0,
          fixedFee: 0,
          minDownPaymentPct: 0,
        },
      })
    ).toThrow(/rightslug/);
  });
});

// ─── calculateRepayment — DEFAULT_MERCHANT ────────────────────────────────────

describe("calculateRepayment — DEFAULT_MERCHANT", () => {
  it("PRD verified: itemCost=1,000,000 / downPayment=400,000 / tenor=4 → 201,825", () => {
    const result = calculateRepayment(1_000_000, 400_000, 4, DEFAULT_MERCHANT);
    expect(result).toEqual({
      loanAmount: 621_000,
      monthlyRepayment: 201_825,
      downPayment: 400_000,
      tenor: 4,
    });
  });

  it("test case 2: itemCost=500,000 / downPayment=200,000 / tenor=6 → 75,763", () => {
    const result = calculateRepayment(500_000, 200_000, 6, DEFAULT_MERCHANT);
    expect(result).toEqual({
      loanAmount: 313_500,
      monthlyRepayment: 75_763,
      downPayment: 200_000,
      tenor: 6,
    });
  });

  it("test case 3: itemCost=250,000 / downPayment=75,000 / tenor=3 → 75,440", () => {
    const result = calculateRepayment(250_000, 75_000, 3, DEFAULT_MERCHANT);
    expect(result).toEqual({
      loanAmount: 184_750,
      monthlyRepayment: 75_440,
      downPayment: 75_000,
      tenor: 3,
    });
  });
});

// ─── calculateRepayment — TEST_MERCHANT ───────────────────────────────────────

describe("calculateRepayment — TEST_MERCHANT (5.5% / no fees)", () => {
  it("itemCost=1,000,000 / downPayment=400,000 / tenor=4 → 183,000", () => {
    // loanAmount = 1,000,000 - 400,000 = 600,000
    // raw = (600,000 + 0.055 × 600,000 × 4) / 4 = 732,000 / 4 = 183,000
    const result = calculateRepayment(1_000_000, 400_000, 4, TEST_MERCHANT);
    expect(result).toEqual({
      loanAmount: 600_000,
      monthlyRepayment: 183_000,
      downPayment: 400_000,
      tenor: 4,
    });
  });
});

// ─── calculateRepayment — rounding-noise cases (zero-fee merchant) ────────────

describe("calculateRepayment — floating-point rounding guard", () => {
  // All cases use: managementFeePct 0, fixedFee 0, minDownPaymentPct 0, downPayment 0
  // so loanAmount === itemCost.

  it("rate 1.1%, itemCost 500,000, tenor 10 → 55,500", () => {
    const m: MerchantConfig = { ...zeroMerchant, monthlyRatePct: 1.1 };
    expect(calculateRepayment(500_000, 0, 10, m).monthlyRepayment).toBe(55_500);
  });

  it("rate 2.3%, itemCost 1,000,000, tenor 5 → 223,000", () => {
    const m: MerchantConfig = { ...zeroMerchant, monthlyRatePct: 2.3 };
    expect(calculateRepayment(1_000_000, 0, 5, m).monthlyRepayment).toBe(223_000);
  });

  it("rate 0.7%, itemCost 1,000,000, tenor 10 → 107,000", () => {
    const m: MerchantConfig = { ...zeroMerchant, monthlyRatePct: 0.7 };
    expect(calculateRepayment(1_000_000, 0, 10, m).monthlyRepayment).toBe(107_000);
  });

  it("rate 3.3%, itemCost 1,000,000, tenor 5 → 233,000", () => {
    const m: MerchantConfig = { ...zeroMerchant, monthlyRatePct: 3.3 };
    expect(calculateRepayment(1_000_000, 0, 5, m).monthlyRepayment).toBe(233_000);
  });
});

// ─── calculateRepayment — zero-rate / zero-fee edge case ─────────────────────

describe("calculateRepayment — zero-rate, zero-fee merchant", () => {
  it("does not produce NaN or Infinity", () => {
    const result = calculateRepayment(500_000, 200_000, 6, zeroMerchant);
    expect(isNaN(result.monthlyRepayment)).toBe(false);
    expect(isFinite(result.monthlyRepayment)).toBe(true);
  });

  it("returns loanAmount = itemCost - downPayment when there are no fees", () => {
    // monthlyRepayment = ceil((300,000 + 0) / 6) = 50,000
    const result = calculateRepayment(500_000, 200_000, 6, zeroMerchant);
    expect(result.loanAmount).toBe(300_000);
    expect(result.monthlyRepayment).toBe(50_000);
  });
});

// ─── getMinimumDownPayment ────────────────────────────────────────────────────

describe("getMinimumDownPayment", () => {
  it("DEFAULT_MERCHANT, itemCost 1,000,000 → 300,000 (pct floor wins)", () => {
    // pctFloor = 30% × 1,000,000 = 300,000
    // totalFees = 1.5% × 1,000,000 + 6,000 = 15,000 + 6,000 = 21,000
    // max(300,000, 21,000) = 300,000
    expect(getMinimumDownPayment(1_000_000, DEFAULT_MERCHANT)).toBe(300_000);
  });

  it("DEFAULT_MERCHANT, itemCost 20,000 → 6,300 (fees win)", () => {
    // pctFloor = 30% × 20,000 = 6,000
    // totalFees = 1.5% × 20,000 + 6,000 = 300 + 6,000 = 6,300
    // max(6,000, 6,300) = 6,300
    expect(getMinimumDownPayment(20_000, DEFAULT_MERCHANT)).toBe(6_300);
  });

  it("merchant {managementFeePct 1.5, fixedFee 6000, minDownPaymentPct 0}, itemCost 100,000 → 7,500", () => {
    const m: MerchantConfig = {
      slug: "fee-only",
      name: "Fee Only",
      monthlyRatePct: 5,
      managementFeePct: 1.5,
      fixedFee: 6000,
      minDownPaymentPct: 0,
    };
    // pctFloor = 0% × 100,000 = 0
    // totalFees = 1.5% × 100,000 + 6,000 = 1,500 + 6,000 = 7,500
    // max(0, 7,500) = 7,500
    expect(getMinimumDownPayment(100_000, m)).toBe(7_500);
  });

  it("TEST_MERCHANT, itemCost 100,000 → 30,000 (pct floor wins, no fees)", () => {
    // pctFloor = 30% × 100,000 = 30,000
    // totalFees = 0
    // max(30,000, 0) = 30,000
    expect(getMinimumDownPayment(100_000, TEST_MERCHANT)).toBe(30_000);
  });

  it("all-zero merchant, any itemCost → 0", () => {
    expect(getMinimumDownPayment(1_000_000, zeroMerchant)).toBe(0);
    expect(getMinimumDownPayment(0, zeroMerchant)).toBe(0);
  });
});
