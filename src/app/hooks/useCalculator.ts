// app/hooks/useCalculator.ts
import { useState } from 'react';

interface LoanInputs {
  itemCost: number;
  downPayment: number;
  interestRate: number;
  tenure: number;
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

  const calculateLoan = (inputs: LoanInputs) => {
    const { itemCost, downPayment, interestRate, tenure } = inputs;

    // Step 1: Calculate fixed charges
    const percentageFee = itemCost * 0.015; // 1.5% of item cost
    const adjustmentFee = 6000; // Fixed ₦6,000
    const totalFixedCharges = percentageFee + adjustmentFee;

    // Step 2: Calculate effective down payment based on business rules
    const thirtyPercentOfItem = itemCost * 0.30;
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

    // Step 5: Calculate monthly finance cost
    const monthlyFinanceCost = financedBalance / tenure;

    // Step 6: Calculate monthly repayment
    const monthlyRepayment = monthlyFinanceCost + interestAmount;

    // Step 7: Calculate total repayment
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

  return {
    calculateLoan,
    results,
    isCalculated,
  };
};