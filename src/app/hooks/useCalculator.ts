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

// Determine interest rate: fixed 7.5% per month for 1–4 months
const getAutoInterestRate = (_financedBalance: number, tenure: number): number => {
  // Business rule: fixed 7.5% per month (applied each month) for 1–4 months
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
      const minRequired = itemCost * 0.30;
      if (downPayment + epsilon < minRequired) {
        errors.downPayment = "Down payment must be at least 30% of item cost";
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
    // New policy: fee handling is selectable regardless of whether DP is exactly 30%
    // - 'upfront': fees (₦6,000 + merchant%) paid upfront with DP; financed balance uses DP + fees
    // - 'repayment': only DP is paid now; fees are added to repayment and do not affect financed balance
    let effectiveDownPayment: number;
    let chargesAppliedUpfront = 0;
    let chargesAddedToRepayment = 0;

    if (chargesMode === 'upfront') {
      // Customer pays fees now in addition to their down payment; financed balance reduces by DP only
      // For financing math: fees do not reduce balance further; they are just paid now
      effectiveDownPayment = downPayment; // balance reduced by DP amount
      chargesAppliedUpfront = totalFixedCharges; // paid now
      chargesAddedToRepayment = 0;
    } else {
      // Fees are capitalized into the loan; financed balance will include fees
      effectiveDownPayment = downPayment;
      chargesAppliedUpfront = 0;
      chargesAddedToRepayment = 0; // no separate spreading; included in principal
    }

    // Step 3: Calculate financed balance (clamped at 0)
    // If fees are spread (repayment mode), capitalize fees into financed balance
    let financedBalance = Math.max(0, (itemCost - effectiveDownPayment) + (chargesMode === 'repayment' ? totalFixedCharges : 0));

    // Step 4: Determine interest rate (fixed 7.5%)
    const interestRate = getAutoInterestRate(financedBalance, tenure);

    // Step 5: Calculate monthly interest and monthly finance cost
    const monthlyInterest = (interestRate / 100) * financedBalance; // 7.5% of loan amount per month
    const monthlyFinanceCost = financedBalance / tenure;

    // Step 6: Monthly repayment = principal portion + monthly interest + any charges spread into repayment
    const monthlyRepayment = monthlyFinanceCost + monthlyInterest + (chargesAddedToRepayment / tenure);

    // Step 7: Total repayment across tenor
    const totalRepayment = monthlyRepayment * tenure;

    // Update results
    setResults({
      effectiveDownPayment,
      financedBalance,
      interestAmount: monthlyInterest, // monthly interest value used in monthly repayment
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