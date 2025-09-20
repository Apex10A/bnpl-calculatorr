// app/hooks/useCalculator.ts
import { useState } from 'react';

interface LoanInputs {
  itemCost: number;
  downPayment: number;
  tenure: number;
  merchantFee: number; // percentage, e.g., 1.5 means 1.5%
}

interface LoanResults {
  effectiveDownPayment: number;
  financedBalance: number;
  interestAmount: number;
  monthlyRepayment: number;
  totalRepayment: number;
}

// Map tenure into buckets: 3/4, 6, 9, 12
const normalizeTenure = (tenure: number): 3 | 4 | 6 | 9 | 12 => {
  if (tenure <= 4) return tenure <= 3 ? 3 : 4; // 1-3 => 3, 4 => 4
  if (tenure <= 6) return 6;
  if (tenure <= 9) return 9;
  return 12; // 10-12+ => 12
};

// Determine interest rate based on financed balance and tenure bucket
const getAutoInterestRate = (financedBalance: number, tenure: number): number => {
  const t = normalizeTenure(tenure);
  const fb = financedBalance;

  // Choose tier by financed balance
  let tier: 'A' | 'B' | 'C' | 'D';
  if (fb >= 1_000_000) tier = 'D';
  else if (fb >= 500_000) tier = 'C';
  else if (fb >= 200_000) tier = 'B';
  else /* fb < 200,000 (incl. <100k) */ tier = 'A';

  // Rates per tier and tenure
  const rates: Record<typeof tier, Record<3 | 4 | 6 | 9 | 12, number>> = {
    A: { 3: 12, 4: 12, 6: 11, 9: 10, 12: 9.5 },
    B: { 3: 11.5, 4: 11.5, 6: 10.5, 9: 9.5, 12: 9 },
    C: { 3: 11, 4: 11, 6: 10, 9: 9, 12: 8.5 },
    D: { 3: 10, 4: 10, 6: 9, 9: 8, 12: 7.5 },
  } as const;

  return rates[tier][t];
};

export const useCalculator = () => {
  const [results, setResults] = useState<LoanResults>({
    effectiveDownPayment: 0,
    financedBalance: 0,
    interestAmount: 0,
    monthlyRepayment: 0,
    totalRepayment: 0,
  });
  const [isCalculated, setIsCalculated] = useState(false);
  const [errors, setErrors] = useState<{ downPayment?: string, tenure?: string, itemCost?: string, merchantFee?: string }>({});

  const calculateLoan = (inputs: LoanInputs) => {
    const { itemCost, downPayment, tenure, merchantFee } = inputs;

    // Validation
    const thirtyPercentOfItem = itemCost * 0.30;

    let errors: { downPayment?: string, tenure?: string, itemCost?: string, merchantFee?: string } = {};

    if (itemCost <= 0) {
      errors.itemCost = "Item cost must be greater than 0";
    }

    if (downPayment < thirtyPercentOfItem) {
      errors.downPayment = "Down payment cannot be less than 30%";
    }

    if (tenure <= 0) {
      errors.tenure = "Tenure must be greater than 0";
    }

    // merchant fee can be 0 or more
    if (merchantFee < 0) {
      errors.merchantFee = "Merchant fee cannot be negative";
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      setIsCalculated(false);
      return;
    } else {
      setErrors({});
    }

    // Step 1: Calculate charges
    const percentageFee = itemCost * (merchantFee / 100); // merchant fee % of item cost
    const adjustmentFee = 6000; // Fixed ₦6,000 (kept as-is)
    const totalFixedCharges = percentageFee + adjustmentFee;

    // Step 2: Calculate effective down payment based on business rules
    let effectiveDownPayment: number;
    if (downPayment > thirtyPercentOfItem) {
      // If down payment > 30%, subtract the fixed charges
      effectiveDownPayment = downPayment - totalFixedCharges;
    } else if (downPayment === thirtyPercentOfItem) {
      // If down payment = 30%, add the fixed charges
      effectiveDownPayment = downPayment + totalFixedCharges;
    } else {
      // If down payment < 30%, use as is (this case wasn't specified in docs)
      effectiveDownPayment = downPayment;
    }

    // Step 3: Calculate financed balance (clamped at 0)
    const financedBalance = Math.max(0, itemCost - effectiveDownPayment);

    // Step 4: Determine interest rate automatically
    const interestRate = getAutoInterestRate(financedBalance, tenure);

    // Step 5: Calculate interest amount
    const interestAmount = (interestRate / 100) * financedBalance;

    // Step 6: Calculate monthly finance cost
    const monthlyFinanceCost = financedBalance / tenure;

    // Step 7: Calculate monthly repayment
    const monthlyRepayment = monthlyFinanceCost + interestAmount;

    // Step 8: Calculate total repayment
    const totalRepayment = monthlyRepayment * tenure;

    // Update results
    setResults({
      effectiveDownPayment,
      financedBalance,
      interestAmount,
      monthlyRepayment,
      totalRepayment,
    });

    setIsCalculated(true);
  };

  const clearErrors = () => {
    setErrors({});
  };

  return {
    calculateLoan,
    results,
    isCalculated,
    errors,
    clearErrors,
  };
};