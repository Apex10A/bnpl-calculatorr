// app/components/InputField.tsx
import React from 'react';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  type?: string;
  step?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  type = "text",
  step,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 font-medium">{prefix}</span>
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          step={step}
          className={`
            w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg
            ${prefix ? 'pl-10' : ''}
            ${suffix ? 'pr-16' : ''}
          `}
        />
        
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 font-medium text-sm">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputField;