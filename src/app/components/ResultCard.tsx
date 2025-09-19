// app/components/ResultCard.tsx
import React from 'react';

interface ResultCardProps {
  label: string;
  value: number;
  icon?: string;
  color?: string;
  highlight?: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({
  label,
  value,
  icon = "💰",
  color = "bg-gray-50 border-gray-200 text-gray-800",
  highlight = false,
}) => {
  const formatCurrency = (amount: number): string => {
    if (!isFinite(amount)) return '₦0';
    const negative = amount < 0;
    const abs = Math.abs(amount);
    const [intPart, fracPart] = abs.toString().split('.');
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatted = fracPart ? `${withCommas}.${fracPart}` : withCommas;
    return `${negative ? '-' : ''}₦${formatted}`;
  };

  return (
    <div
      className={`
        border-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md
        ${color}
        ${highlight ? 'ring-2 ring-offset-2 ring-blue-300 shadow-lg scale-105' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="font-medium text-sm opacity-80">{label}</p>
            <p
              className={`font-bold text-lg ${
                highlight ? 'text-2xl' : ''
              }`}
            >
              {formatCurrency(value)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;