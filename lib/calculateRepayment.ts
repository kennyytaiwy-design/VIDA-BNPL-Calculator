import type { MerchantConfig } from "@/src/config/merchants";

export interface RepaymentResult {
  loanAmount: number;
  monthlyRepayment: number;
  downPayment: number;
  tenor: number;
}

/**
 * Returns the total fees deducted from the down payment for this merchant and item cost.
 *   totalFees = (managementFeePct / 100) × itemCost + fixedFee
 *
 * This is the single source of truth for the fee formula — used by
 * calculateRepayment, getMinimumDownPayment, and LoanDetailsForm.
 */
export function getTotalFees(itemCost: number, merchant: MerchantConfig): number {
  return (merchant.managementFeePct / 100) * itemCost + merchant.fixedFee;
}

/**
 * Calculates the monthly BNPL repayment amount for a given merchant's fee structure.
 *
 * Formula (fixed — do not alter):
 *   totalFees            = getTotalFees(itemCost, merchant)
 *   effectiveDownPayment = downPayment − totalFees
 *   loanAmount           = itemCost − effectiveDownPayment
 *   raw                  = (loanAmount + (monthlyRatePct / 100) × loanAmount × tenor) / tenor
 *   monthlyRepayment     = ceil(round(raw, 6 decimal places))
 *
 * The toFixed(6) step eliminates IEEE-754 floating-point noise before ceiling,
 * e.g. 55499.9999999 → "55500.000000" → 55500 rather than 55501.
 *
 * Verified test cases:
 *   DEFAULT_MERCHANT: 1,000,000 / 400,000 / 4 → 201,825
 *   Gloworld:         1,000,000 / 400,000 / 4 → 183,000
 */
export function calculateRepayment(
  itemCost: number,
  downPayment: number,
  tenor: number,
  merchant: MerchantConfig
): RepaymentResult {
  const totalFees = getTotalFees(itemCost, merchant);
  const effectiveDownPayment = downPayment - totalFees;
  const loanAmount = itemCost - effectiveDownPayment;
  const raw = (loanAmount + (merchant.monthlyRatePct / 100) * loanAmount * tenor) / tenor;
  const monthlyRepayment = Math.ceil(Number(raw.toFixed(6)));

  return {
    loanAmount,
    monthlyRepayment,
    downPayment,
    tenor,
  };
}

/**
 * Returns the minimum down payment the borrower must provide for this merchant and item cost.
 *
 * The minimum is the ceiling of whichever is greater:
 *   (a) the percentage-based floor  = (minDownPaymentPct / 100) × itemCost
 *   (b) the total fees               = getTotalFees(itemCost, merchant)
 *
 * Because the down payment must be large enough to cover the fees that are
 * deducted from it, neither constraint can be waived independently.
 * A down payment exactly equal to the returned value is valid.
 */
export function getMinimumDownPayment(itemCost: number, merchant: MerchantConfig): number {
  const pctFloor = (merchant.minDownPaymentPct / 100) * itemCost;
  const totalFees = getTotalFees(itemCost, merchant);
  return Math.ceil(Number(Math.max(pctFloor, totalFees).toFixed(6)));
}
