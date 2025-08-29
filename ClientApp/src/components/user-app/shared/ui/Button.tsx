import React from 'react';
import { useThemeClasses } from '../../../../contexts/ThemeContext';

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
    const themeClasses = useThemeClasses();

    const getVariantStyles = () => {
        switch (variant) {
            case 'success':
                return themeClasses.button.success;
            case 'danger':
                return themeClasses.button.danger;
            case 'teal':
                return themeClasses.button.teal;
            case 'secondary':
                return themeClasses.button.secondary;
            default:
                return themeClasses.button.primary;
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
