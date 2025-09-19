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
  error?: string;
  onBlur?: () => void;
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
  error,
  onBlur,
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
          onBlur={onBlur}
          placeholder={placeholder}
          step={step}
          className={`
            w-full px-3 md:px-4 py-3 border rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base md:text-lg
            ${prefix ? 'pl-10' : ''}
            ${suffix ? 'pr-16' : ''}
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
        />
        
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 font-medium text-sm">{suffix}</span>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default InputField;