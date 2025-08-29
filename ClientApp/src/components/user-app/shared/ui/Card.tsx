import React from 'react';
import { useThemeClasses } from '../../../../contexts/ThemeContext';

export interface CardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
    const themeClasses = useThemeClasses();

    return (
        <div className={`rounded-2xl border p-4 ${themeClasses.border.primary} ${themeClasses.bg.card} ${themeClasses.shadow.sm} ${className}`}>
            {title && (
                <div className={`mb-3 text-sm ${themeClasses.text.secondary}`}>{title}</div>
            )}
            {children}
        </div>
    );
}
