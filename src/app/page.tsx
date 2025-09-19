// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import InputField from './components/InputField';
import ResultCard from './components/ResultCard';
import { useCalculator } from './hooks/useCalculator';

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

export default function LoanCalculator() {
  const [itemCost, setItemCost] = useState<string>('');
  const [downPayment, setDownPayment] = useState<string>('');
  const [tenure, setTenure] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');

  const { calculateLoan, results, isCalculated, errors, clearErrors } = useCalculator();

  const handleItemCostBlur = () => {
    const num = parseFloat(itemCost.replace(/,/g, '').trim()) || 0;
    setItemCost(formatNumber(num));
  };

  const handleDownPaymentBlur = () => {
    const num = parseFloat(downPayment.replace(/,/g, '').trim()) || 0;
    setDownPayment(formatNumber(num));
  };

  useEffect(() => {
    // Clear errors when inputs change
    clearErrors();
  }, [itemCost, downPayment, tenure, interestRate, clearErrors]);

  const handleCalculate = () => {
    const inputs = {
      itemCost: parseFloat(itemCost.replace(/,/g, '').trim()) || 0,
      downPayment: parseFloat(downPayment.replace(/,/g, '').trim()) || 0,
      tenure: parseInt(tenure.trim()) || 1,
      interestRate: parseFloat(interestRate.trim()) || 0,
    };

    calculateLoan(inputs);
  };

  const isFormValid = itemCost.trim() && downPayment.trim() && tenure.trim() && interestRate.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            BNPL Loan Calculator
          </h1>
          <p className="text-gray-600 text-lg">
            Calculate your Buy Now Pay Later repayment plan
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Loan Details
            </h2>
            
            <div className="space-y-6">
              <InputField
                label="Item Cost"
                value={itemCost}
                onChange={setItemCost}
                onBlur={handleItemCostBlur}
                placeholder="Enter item cost"
                prefix="₦"
                type="text"
                error={errors.itemCost}
              />

              <InputField
                label="Down Payment"
                value={downPayment}
                onChange={setDownPayment}
                onBlur={handleDownPaymentBlur}
                placeholder="Enter down payment"
                prefix="₦"
                type="text"
                error={errors.downPayment}
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
                label="Interest Rate"
                value={interestRate}
                onChange={setInterestRate}
                placeholder="Enter interest rate (%)"
                suffix="%"
                type="number"
                error={errors.interestRate}
              />

              <button
                onClick={handleCalculate}
                disabled={!isFormValid}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
              >
                Calculate Loan
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Repayment Summary
            </h2>
            
            {isCalculated ? (
              <div className="space-y-4">
                <ResultCard
                  label="Effective Down Payment"
                  value={results.effectiveDownPayment}
                  icon="💰"
                  color="bg-green-50 border-green-200 text-green-800"
                />

                <ResultCard
                  label="Financed Balance"
                  value={results.financedBalance}
                  icon="🏦"
                  color="bg-blue-50 border-blue-200 text-blue-800"
                />

                <ResultCard
                  label="Interest Amount"
                  value={results.interestAmount}
                  icon="📈"
                  color="bg-yellow-50 border-yellow-200 text-yellow-800"
                />

                <ResultCard
                  label="Monthly Repayment"
                  value={results.monthlyRepayment}
                  icon="📅"
                  color="bg-purple-50 border-purple-200 text-purple-800"
                  highlight
                />

                <ResultCard
                  label="Total Repayment"
                  value={results.totalRepayment}
                  icon="💳"
                  color="bg-red-50 border-red-200 text-red-800"
                  highlight
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🧮</div>
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