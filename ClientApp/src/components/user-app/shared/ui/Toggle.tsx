import React from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

export interface ToggleProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: number;
  className?: string;
}

export function Toggle({ checked, onChange, disabled = false, size = 20, className = '' }: ToggleProps) {
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div 
      className={`cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={handleClick}
    >
      {checked ? (
        <ToggleRight size={size} color="#007bff" />
      ) : (
        <ToggleLeft size={size} className="text-gray-400" />
      )}
    </div>
  );
}
