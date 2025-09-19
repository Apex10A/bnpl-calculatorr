// app/hooks/useCalculator.ts
import { useState } from 'react';

interface LoanInputs {
  itemCost: number;
  downPayment: number;
  tenure: number;
  interestRate: number;
  merchantFee: number; // percentage, e.g., 1.5 means 1.5%
}

interface LoanResults {
  effectiveDownPayment: number;
  financedBalance: number;
  interestAmount: number;
  monthlyRepayment: number;
  totalRepayment: number;
}

export const useCalculator = () => {
  const [results, setResults] = useState<LoanResults>({
    effectiveDownPayment: 0,
    financedBalance: 0,
    interestAmount: 0,
    monthlyRepayment: 0,
    totalRepayment: 0,
  });
  const [isCalculated, setIsCalculated] = useState(false);
  const [errors, setErrors] = useState<{ downPayment?: string, tenure?: string, itemCost?: string, interestRate?: string, merchantFee?: string }>({});



  const calculateLoan = (inputs: LoanInputs) => {
    const { itemCost, downPayment, tenure, interestRate, merchantFee } = inputs;

    // Validation
    const thirtyPercentOfItem = itemCost * 0.30;

    let errors: { downPayment?: string, tenure?: string, itemCost?: string, interestRate?: string, merchantFee?: string } = {};

    if (itemCost <= 0) {
      errors.itemCost = "Item cost must be greater than 0";
    }

    if (downPayment < thirtyPercentOfItem) {
      errors.downPayment = "Down payment cannot be less than 30%";
    }

    if (tenure <= 0) {
      errors.tenure = "Tenure must be greater than 0";
    }

    if (interestRate <= 0) {
      errors.interestRate = "Interest rate must be greater than 0";
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
    // const thirtyPercentOfItem = itemCost * 0.30;
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

    // Step 3: Calculate financed balance
    const financedBalance = itemCost - effectiveDownPayment;

    // Step 4: Calculate interest amount
    const interestAmount = (interestRate / 100) * financedBalance;

    // Step 6: Calculate monthly finance cost
    const monthlyFinanceCost = financedBalance / tenure;

    // Step 7: Calculate monthly repayment
    const monthlyRepayment = monthlyFinanceCost + interestAmount;

    // Step 8: Calculate total repayment
    const totalRepayment = downPayment + (monthlyRepayment * tenure);

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