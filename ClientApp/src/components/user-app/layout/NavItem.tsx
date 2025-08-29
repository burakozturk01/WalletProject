import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { useThemeClasses } from '../../../contexts/ThemeContext';

export interface NavItemProps {
    icon: LucideIcon;
    label: string;
    to?: string;
    onClick?: () => void;
    className?: string;
}

export function NavItem({ icon: Icon, label, to, onClick, className = '' }: NavItemProps) {
    const themeClasses = useThemeClasses();

    if (to) {
        return (
            <NavLink
                to={to}
                className={({ isActive }) => `
          flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-200 no-underline
          ${isActive
                        ? 'bg-blue-50 text-blue-600 font-semibold dark:bg-blue-900/30 dark:text-blue-400'
                        : `${themeClasses.text.secondary} ${themeClasses.bg.hover}`
                    }
          ${className}
        `}
            >
                <Icon size={18} />
                <span>{label}</span>
            </NavLink>
        );
    }

    return (
        <div
            className={`
        flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-200
        ${themeClasses.text.secondary} ${themeClasses.bg.hover}
        ${className}
      `}
            onClick={onClick}
        >
            <Icon size={18} />
            <span>{label}</span>
        </div>
    );
}
