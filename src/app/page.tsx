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
  const [chargesMode, setChargesMode] = useState<'upfront' | 'repayment'>('upfront'); // whether fees are paid now or spread over repayment

  const { calculateLoan, results, isCalculated, errors, clearErrors } = useCalculator();

  const handleItemCostBlur = () => {
    setItemCost(formatNumberStringPreserveDecimals(itemCost));
  };

  const handleDownPaymentBlur = () => {
    setDownPayment(formatNumberStringPreserveDecimals(downPayment));
  };

  // Interest rate is fixed at 7.5% for 1–4 months (see hook for calculations)

  useEffect(() => {
    // Clear errors when inputs change
    clearErrors();

    // Interest rate is fixed at 7.5% for valid inputs
    const ic = parseFloat(itemCost.replace(/,/g, '').trim());
    const tn = parseInt(tenure.trim());
    const mf = parseFloat(merchantFee.trim());

    if (!isNaN(ic) && ic > 0 && !isNaN(tn) && tn > 0 && !isNaN(mf) && mf >= 0) {
      setInterestRate('7.5');
    } else {
      setInterestRate('');
    }
  }, [itemCost, tenure, merchantFee, clearErrors]);

  const handleCalculate = () => {
    const inputs = {
      itemCost: parseFloat(itemCost.replace(/,/g, '').trim()) || 0,
      downPayment: parseFloat(downPayment.replace(/,/g, '').trim()) || 0,
      tenure: Math.min(Math.max(parseInt(tenure.trim()) || 1, 1), 4), // clamp to 1–4
      merchantFee: parseFloat(merchantFee.trim()) || 0,
      chargesMode,
    };

    calculateLoan(inputs);
  };

  const isFormValid = itemCost.trim() && downPayment.trim() && tenure.trim() && merchantFee.trim() !== '';

  // Inline live error: DP must be at least 30% of item cost
  const dpInlineError = (() => {
    const ic = parseFloat(itemCost.replace(/,/g, '').trim());
    const dp = parseFloat(downPayment.replace(/,/g, '').trim());
    if (isNaN(ic) || ic <= 0 || isNaN(dp)) return '';

    const epsilon = 0.5; // treat within 50 kobo as equal
    const minDp = ic * 0.30;
    return dp + epsilon < minDp ? 'Down payment must be at least 30% of item cost' : '';
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
                placeholder="Enter tenure (1–4 months)"
                suffix="months"
                type="number"
                error={errors.tenure}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Fee Handling</label>
                <select
                  value={chargesMode}
                  onChange={(e) => setChargesMode(e.target.value as 'upfront' | 'repayment')}
                  className="w-full px-3 md:px-4 py-3 border rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base md:text-lg border-gray-300"
                >
                  <option value="upfront">Pay fees now </option>
                  <option value="repayment">Spread fees across months</option>
                </select>
              </div>

              <InputField
                label="Interest Rate (auto)"
                value={interestRate}
                onChange={setInterestRate}
                placeholder="Fixed at 7.5% for 1–4 months"
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
                    const percentageFee = ic * (mf / 100);
                    const adjustmentFee = 6000;
                    const totalCharges = percentageFee + adjustmentFee;
                    // Show DP plus fees if paying now; otherwise show DP only
                    return chargesMode === 'upfront' ? dp + totalCharges : dp;
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
