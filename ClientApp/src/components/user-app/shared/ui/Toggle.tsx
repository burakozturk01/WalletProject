import React from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { useThemeClasses } from '../../../../contexts/ThemeContext';

export interface ToggleProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: number;
  className?: string;
}

export function Toggle({ checked, onChange, disabled = false, size = 20, className = '' }: ToggleProps) {
  const themeClasses = useThemeClasses();

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div 
      className={`cursor-pointer transition-opacity ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={handleClick}
    >
      {checked ? (
        <ToggleRight size={size} color="#007bff" className="transition-colors" />
      ) : (
        <ToggleLeft size={size} className={`${themeClasses.text.muted} transition-colors`} />
      )}
    </div>
  );
}
