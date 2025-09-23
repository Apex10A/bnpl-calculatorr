// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import InputField from './components/InputField';
import ResultCard from './components/ResultCard';
import { useCalculator } from './hooks/useCalculator';

const formatNumberStringPreserveDecimals = (value: string): string => {
  const trimmed = value.trim().replace(/,/g, '');
  if (trimmed === '') return '';
  // Allow optional decimal part; if invalid, return as-is
  if (!/^[-+]?\d*(\.\d+)?$/.test(trimmed)) return value;
  const [intPart, fracPart] = trimmed.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fracPart !== undefined ? `${withCommas}.${fracPart}` : withCommas;
};

export default function LoanCalculator() {
  const [itemCost, setItemCost] = useState<string>('');
  const [downPayment, setDownPayment] = useState<string>('');
  const [tenure, setTenure] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>(''); // auto-computed; read-only
  const [merchantFee, setMerchantFee] = useState<string>('0');

  const { calculateLoan, results, isCalculated, errors, clearErrors } = useCalculator();

  const handleItemCostBlur = () => {
    setItemCost(formatNumberStringPreserveDecimals(itemCost));
  };

  const handleDownPaymentBlur = () => {
    setDownPayment(formatNumberStringPreserveDecimals(downPayment));
  };

  // Helpers to mirror hook logic for auto interest rate
  const normalizeTenure = (t: number): 3 | 4 | 6 | 9 | 12 => {
    if (t <= 4) return t <= 3 ? 3 : 4;
    if (t <= 6) return 6;
    if (t <= 9) return 9;
    return 12;
  };
  const getAutoInterestRate = (financedBalance: number, tenureNum: number): number => {
    const t = normalizeTenure(tenureNum);
    const fb = financedBalance;
    let tier: 'A' | 'B' | 'C' | 'D';
    if (fb >= 1_000_000) tier = 'D';
    else if (fb >= 500_000) tier = 'C';
    else if (fb >= 200_000) tier = 'B';
    else tier = 'A';
    const rates: Record<'A' | 'B' | 'C' | 'D', Record<3 | 4 | 6 | 9 | 12, number>> = {
      A: { 3: 12, 4: 12, 6: 11, 9: 10, 12: 9.5 },
      B: { 3: 11.5, 4: 11.5, 6: 10.5, 9: 9.5, 12: 9 },
      C: { 3: 11, 4: 11, 6: 10, 9: 9, 12: 8.5 },
      D: { 3: 10, 4: 10, 6: 9, 9: 8, 12: 7.5 },
    } as const;
    return rates[tier][t];
  };

  useEffect(() => {
    // Clear errors when inputs change
    clearErrors();

    // Auto-compute interest rate when enough inputs are present
    const ic = parseFloat(itemCost.replace(/,/g, '').trim());
    const dp = parseFloat(downPayment.replace(/,/g, '').trim());
    const tn = parseInt(tenure.trim());
    const mf = parseFloat(merchantFee.trim());

    if (!isNaN(ic) && ic > 0 && !isNaN(dp) && !isNaN(tn) && tn > 0 && !isNaN(mf) && mf >= 0) {
      const percentageFee = ic * (mf / 100);
      const adjustmentFee = 6000;
      const totalFixedCharges = percentageFee + adjustmentFee;
      const epsilon = 0.5; // treat within 50 kobo as equal
      const isExactThirty = Math.abs(dp - ic * 0.30) <= epsilon;
      const effectiveDownPayment = isExactThirty ? (ic * 0.30) : (dp - totalFixedCharges);
      const financedBalance = Math.max(0, ic - effectiveDownPayment);
      const rate = getAutoInterestRate(financedBalance, tn);
      setInterestRate(String(rate));
    } else {
      setInterestRate('');
    }
  }, [itemCost, downPayment, tenure, merchantFee, clearErrors]);

  const handleCalculate = () => {
    const inputs = {
      itemCost: parseFloat(itemCost.replace(/,/g, '').trim()) || 0,
      downPayment: parseFloat(downPayment.replace(/,/g, '').trim()) || 0,
      tenure: parseInt(tenure.trim()) || 1,
      merchantFee: parseFloat(merchantFee.trim()) || 0,
    };

    calculateLoan(inputs);
  };

  const isFormValid = itemCost.trim() && downPayment.trim() && tenure.trim() && merchantFee.trim() !== '';

  // Inline live error based on net down payment after fees
  const dpInlineError = (() => {
    const ic = parseFloat(itemCost.replace(/,/g, '').trim());
    const dp = parseFloat(downPayment.replace(/,/g, '').trim());
    const mf = parseFloat(merchantFee.trim());
    if (isNaN(ic) || ic <= 0 || isNaN(dp) || isNaN(mf) || mf < 0) return '';

    // Special case: exactly 30% (±epsilon) should NOT show an error
    const epsilon = 0.5;
    const isExactThirty = Math.abs(dp - ic * 0.30) <= epsilon;
    if (isExactThirty) return '';

    const percentageFee = ic * (mf / 100);
    const adjustmentFee = 6000;
    const netDp = dp - (percentageFee + adjustmentFee);
    const minNet = ic * 0.3;
    return netDp < minNet ? 'After fees, down payment must be at least 30% of item cost' : '';
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            BNPL Loan Calculator
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            Calculate your Buy Now Pay Later repayment plan
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
              Loan Details
            </h2>
            
            <div className="space-y-6">
              <InputField
                label="Item Cost"
                value={itemCost}
                onChange={setItemCost}
                onBlur={handleItemCostBlur}
                placeholder="Enter item cost"
                prefix=""
                type="text"
                error={errors.itemCost}
                formatThousands
              />

              <InputField
                label="Down Payment"
                value={downPayment}
                onChange={setDownPayment}
                onBlur={handleDownPaymentBlur}
                placeholder="Enter down payment"
                prefix=""
                type="text"
                error={errors.downPayment || dpInlineError}
                formatThousands
              />

              <InputField
                label="Loan Tenure"
                value={tenure}
                onChange={setTenure}
                placeholder="Enter tenure in months"
                suffix="months"
                type="number"
                error={errors.tenure}
              />

              <InputField
                label="Interest Rate (auto)"
                value={interestRate}
                onChange={setInterestRate}
                placeholder="Auto-calculated from financed balance and tenure"
                suffix="%"
                type="number"
                step="any"
                readOnly
              />

              <InputField
                label="Merchant Fee"
                value={merchantFee}
                onChange={setMerchantFee}
                placeholder="Enter merchant fee (%) — set 0 if none"
                suffix="%"
                type="number"
                step="any"
                error={errors.merchantFee}
              />

              <button
                onClick={handleCalculate}
                disabled={!isFormValid}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 md:py-4 px-5 md:px-6 rounded-sm font-semibold text-base md:text-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Calculate Loan
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
              Repayment Summary
            </h2>
            
            {isCalculated ? (
              <div className="space-y-4">
                <ResultCard
                  label="Down Payment"
                  value={(function(){
                    const ic = parseFloat(itemCost.replace(/,/g, '').trim()) || 0;
                    const dp = parseFloat(downPayment.replace(/,/g, '').trim()) || 0;
                    const mf = parseFloat(merchantFee.trim()) || 0;
                    const epsilon = 0.5;
                    const isExactThirty = Math.abs(dp - ic * 0.30) <= epsilon;
                    if (isExactThirty) {
                      // Show 30% + charges for display when exactly 30% entered
                      const percentageFee = ic * (mf / 100);
                      const adjustmentFee = 6000;
                      return ic * 0.30 + percentageFee + adjustmentFee;
                    }
                    return dp;
                  })()}
                  icon="💰"
                  color="bg-green-50 border-green-200 text-green-800"
                />

                <ResultCard
                  label="Financed Balance"
                  value={results.financedBalance}
                  icon="🏦"
                  color="bg-green-50 border-green-200 text-green-800"
                />

                <ResultCard
                  label="Interest Amount"
                  value={results.interestAmount}
                  icon="📈"
                  color="bg-green-50 border-green-200 text-green-800"
                />

                <ResultCard
                  label="Monthly Repayment"
                  value={results.monthlyRepayment}
                  icon="📅"
                  color="bg-green-50 border-green-200 text-green-800"
                  // highlight
                />

                <ResultCard
                  label="Total Repayment"
                  value={results.totalRepayment}
                  icon="💳"
                  color="bg-green-50 border-green-200 text-green-800"
                  // highlight
                />
              </div>
            ) : (
              <div className="text-center py-12">
                {/* <div className="text-6xl mb-4">🧮</div> */}
                <p className="text-gray-500 text-lg">
                  Enter your loan details and click calculate to see your repayment summary
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {/* <div className="text-center mt-8 text-gray-600">
          <p>Built with Next.js, TypeScript & TailwindCSS</p>
        </div> */}
      </div>
    </div>
  );
}
