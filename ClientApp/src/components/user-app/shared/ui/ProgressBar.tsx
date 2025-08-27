import React from 'react';

export interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  backgroundColor?: string;
  height?: string;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  color = '#17a2b8', 
  backgroundColor = '#e5e7eb',
  height = '8px',
  className = '',
  showLabel = false
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div 
        className="w-full rounded-full overflow-hidden" 
        style={{ height, backgroundColor }}
      >
        <div 
          className="h-full transition-all duration-300 ease-out" 
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: color 
          }} 
        />
      </div>
    </div>
  );
}
