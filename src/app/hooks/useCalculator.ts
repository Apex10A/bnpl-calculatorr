// app/hooks/useCalculator.ts
import { useState } from 'react';

interface LoanInputs {
  itemCost: number;
  downPayment: number;
  tenure: number;
  merchantFee: number; // percentage, e.g., 1.5 means 1.5%
  chargesMode: 'upfront' | 'repayment'; // how to handle charges when DP is exactly 30%
}

interface LoanResults {
  effectiveDownPayment: number;
  financedBalance: number;
  interestAmount: number;
  monthlyRepayment: number;
  totalRepayment: number;
  chargesAppliedUpfront: number; // how much of charges paid upfront
  chargesAddedToRepayment: number; // how much of charges added to repayment
}

// Determine interest rate: fixed 7.5% for 1–4 months
const getAutoInterestRate = (_financedBalance: number, tenure: number): number => {
  // Business rule: fixed 7.5% (total) for 1-4 months
  // We still accept tenure up to 4 (cap if needed by caller/UI)
  return 7.5;
};

export const useCalculator = () => {
  const [results, setResults] = useState<LoanResults>({
    effectiveDownPayment: 0,
    financedBalance: 0,
    interestAmount: 0,
    monthlyRepayment: 0,
    totalRepayment: 0,
    chargesAppliedUpfront: 0,
    chargesAddedToRepayment: 0,
  });
  const [isCalculated, setIsCalculated] = useState(false);
  const [errors, setErrors] = useState<{ downPayment?: string, tenure?: string, itemCost?: string, merchantFee?: string }>({});

  const calculateLoan = (inputs: LoanInputs) => {
    const { itemCost, downPayment, tenure, merchantFee, chargesMode } = inputs;

    // Validation
    const thirtyPercentOfItem = itemCost * 0.30;
    const epsilon = 0.5; // treat within 50 kobo as equal to handle rounding
    const isExactThirty = Math.abs(downPayment - thirtyPercentOfItem) <= epsilon;

    let errors: { downPayment?: string, tenure?: string, itemCost?: string, merchantFee?: string } = {};

    if (itemCost <= 0) {
      errors.itemCost = "Item cost must be greater than 0";
    }

    {
      const percentageFeeCheck = itemCost * (merchantFee / 100);
      const adjustmentFeeCheck = 6000;
      const totalChargesCheck = percentageFeeCheck + adjustmentFeeCheck;
      const minRequired = itemCost * 0.30;
      const netDP = downPayment - totalChargesCheck;
      if (!isExactThirty && netDP < minRequired) {
        errors.downPayment = "After fees, down payment must be at least 30% of item cost";
      }
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
    const adjustmentFee = 6000; // Fixed ₦6,000
    const totalFixedCharges = percentageFee + adjustmentFee;

    // Step 2: Effective down payment and charges handling
    // Two modes when DP is exactly 30%:
    // - 'upfront': fees (₦6,000 + merchant%) paid upfront with DP; financed balance stays 70% of item cost
    // - 'repayment': only 30% is paid now; fees are added to repayment (do not affect financed balance)
    let effectiveDownPayment: number;
    let chargesAppliedUpfront = 0;
    let chargesAddedToRepayment = 0;

    if (isExactThirty) {
      if (chargesMode === 'upfront') {
        effectiveDownPayment = thirtyPercentOfItem; // financed balance fixed at 70%
        chargesAppliedUpfront = totalFixedCharges;  // user pays charges now
        chargesAddedToRepayment = 0;
      } else {
        // repayment mode: user pays only 30% now; charges go into repayment
        effectiveDownPayment = thirtyPercentOfItem;
        chargesAppliedUpfront = 0;
        chargesAddedToRepayment = totalFixedCharges;
      }
    } else {
      // Default policy: fees are deducted from down payment for financing balance computation
      effectiveDownPayment = downPayment - totalFixedCharges;
      chargesAppliedUpfront = Math.min(totalFixedCharges, downPayment); // conceptually paid from DP
      chargesAddedToRepayment = 0;
    }

    // Step 3: Calculate financed balance (clamped at 0)
    let financedBalance = Math.max(0, itemCost - effectiveDownPayment);

    // Step 4: Determine interest rate (fixed 7.5%)
    const interestRate = getAutoInterestRate(financedBalance, tenure);

    // Step 5: Calculate base interest amount
    const interestAmount = (interestRate / 100) * financedBalance;

    // Step 6: Calculate monthly finance cost
    const monthlyFinanceCost = financedBalance / tenure;

    // Step 7: Calculate monthly repayment: finance + interest + any charges spread into repayment
    const monthlyRepayment = monthlyFinanceCost + interestAmount + (chargesAddedToRepayment / tenure);

    // Step 8: Calculate total repayment
    const totalRepayment = monthlyRepayment * tenure;

    // Update results
    setResults({
      effectiveDownPayment,
      financedBalance,
      interestAmount,
      monthlyRepayment,
      totalRepayment,
      chargesAppliedUpfront,
      chargesAddedToRepayment,
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