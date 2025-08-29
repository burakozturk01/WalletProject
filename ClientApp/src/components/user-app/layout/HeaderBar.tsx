import React from 'react';
import { useThemeClasses } from '../../../contexts/ThemeContext';

export interface HeaderBarProps {
  title: string;
  className?: string;
}

export function HeaderBar({ title, className = '' }: HeaderBarProps) {
  const themeClasses = useThemeClasses();

  return (
    <div className={`h-12 flex items-center px-4 border-b text-sm font-semibold ${themeClasses.border.primary} ${themeClasses.text.primary} ${className}`}>
      {title}
    </div>
  );
}
