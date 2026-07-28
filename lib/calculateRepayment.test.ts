import { describe, it, expect } from "vitest";
import { calculateRepayment } from "./calculateRepayment";

describe("calculateRepayment", () => {
  it("calculates correct monthly repayment for verified PRD test case (1,000,000 / 400,000 / 4 months)", () => {
    const result = calculateRepayment(1000000, 400000, 4);
    expect(result).toEqual({
      loanAmount: 621000,
      monthlyRepayment: 201825,
      downPayment: 400000,
      tenor: 4,
    });
  });

  it("calculates correct monthly repayment for test case 2 (500,000 / 200,000 / 6 months)", () => {
    const result = calculateRepayment(500000, 200000, 6);
    expect(result).toEqual({
      loanAmount: 313500,
      monthlyRepayment: 75763,
      downPayment: 200000,
      tenor: 6,
    });
  });

  it("calculates correct monthly repayment for test case 3 (250,000 / 75,000 / 3 months)", () => {
    const result = calculateRepayment(250000, 75000, 3);
    expect(result).toEqual({
      loanAmount: 184750,
      monthlyRepayment: 75440,
      downPayment: 75000,
      tenor: 3,
    });
  });
});
