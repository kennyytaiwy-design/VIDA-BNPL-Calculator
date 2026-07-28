export interface RepaymentResult {
  loanAmount: number;
  monthlyRepayment: number;
  downPayment: number;
  tenor: number;
}

export function calculateRepayment(
  itemCost: number,
  downPayment: number,
  tenor: number
): RepaymentResult {
  const managementFee = 0.015 * itemCost;
  const totalFees = managementFee + 6000;
  const effectiveDownPayment = downPayment - totalFees;
  const loanAmount = itemCost - effectiveDownPayment;
  const monthlyInterest = 0.075 * loanAmount;
  const totalInterest = monthlyInterest * tenor;
  const totalRepayable = loanAmount + totalInterest;
  const monthlyRepayment = Math.ceil(totalRepayable / tenor);

  return {
    loanAmount,
    monthlyRepayment,
    downPayment,
    tenor,
  };
}
