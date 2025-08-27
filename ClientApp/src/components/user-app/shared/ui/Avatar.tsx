import React from 'react';

export interface AvatarProps {
  name: string;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  className?: string;
}

export function Avatar({ name, size = 'medium', showName = true, className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'h-6 w-6 text-xs';
      case 'large':
        return 'h-10 w-10 text-lg';
      default:
        return 'h-7 w-7 text-xs';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`rounded-full flex items-center justify-center font-bold bg-blue-500 text-white ${getSizeStyles()}`}>
        {initials}
      </div>
      {showName && (
        <div className="text-sm font-medium">{name}</div>
      )}
    </div>
  );
}
