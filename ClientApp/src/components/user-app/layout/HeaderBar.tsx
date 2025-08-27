import React from 'react';

export interface HeaderBarProps {
  title: string;
  className?: string;
}

export function HeaderBar({ title, className = '' }: HeaderBarProps) {
  return (
    <div className={`h-12 flex items-center px-4 border-b border-gray-200 text-sm font-semibold ${className}`}>
      {title}
    </div>
  );
}
