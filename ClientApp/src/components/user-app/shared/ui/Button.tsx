import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'teal';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-600 text-white hover:bg-green-700';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700';
      case 'teal':
        return 'bg-teal-500 text-white hover:bg-teal-600';
      case 'secondary':
        return 'bg-gray-600 text-white hover:bg-gray-700';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-1 text-xs';
      case 'large':
        return 'px-6 py-4 text-lg';
      default:
        return 'px-3 py-3 text-sm';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        rounded-2xl font-semibold flex items-center justify-center gap-2 shadow
        transition-colors duration-200
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {icon && icon}
      {children}
    </button>
  );
}
