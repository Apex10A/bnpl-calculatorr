// app/components/InputField.tsx
import React, { useRef } from 'react';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  type?: string;
  step?: string;
  min?: number;
  max?: number;
  error?: string;
  onBlur?: () => void;
  readOnly?: boolean;
  formatThousands?: boolean; // formats numbers with commas as user types (for type="text")
}

const formatNumberStringPreserveDecimals = (value: string): string => {
  const trimmed = value.trim().replace(/,/g, '');
  if (trimmed === '') return '';
  // Allow only digits and optional single decimal point
  if (!/^[-]?\d*(\.\d+)?$/.test(trimmed)) return value; // if invalid, return original
  const [intPart, fracPart] = trimmed.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fracPart !== undefined ? `${withCommas}.${fracPart}` : withCommas;
};

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  type = "text",
  step,
  min,
  max,
  error,
  onBlur,
  readOnly = false,
  formatThousands = false,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (readOnly) return; // ignore edits when read-only

    if (formatThousands && type === 'text') {
      const formatted = formatNumberStringPreserveDecimals(raw);
      // Update parent with formatted value
      onChange(formatted);
      // Move caret to end (simple, reliable approach)
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (el) {
          const end = formatted.length;
          el.setSelectionRange(end, end);
        }
      });
      return;
    }

    onChange(raw);
  };

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
          ref={inputRef}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          readOnly={readOnly}
          className={`
            w-full px-3 md:px-4 py-3 border rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base md:text-lg
            ${prefix ? 'pl-10' : ''}
            ${suffix ? 'pr-16' : ''}
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${readOnly ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}
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