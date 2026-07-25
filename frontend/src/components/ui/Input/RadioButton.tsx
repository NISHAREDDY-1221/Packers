// @ts-nocheck
import type { InputHTMLAttributes } from 'react';

export interface RadioButtonProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: string;
  checked?: boolean;
  error?: string;
}

const RadioButton = ({ label, value, checked, error, className = '', ...props }: RadioButtonProps) => {
  return (
    <div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          value={value}
          checked={checked}
          className={`w-4 h-4 text-green-600 dark:text-green-400 border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400 focus:ring-2 bg-white dark:bg-gray-700 ${className}`}
          {...props}
        />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </label>
      {error && (
        <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">{error}</p>
      )}
    </div>
  );
};

export default RadioButton;

