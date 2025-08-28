import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

export interface NavItemProps {
  icon: LucideIcon;
  label: string;
  to?: string;
  onClick?: () => void;
  className?: string;
}

export function NavItem({ icon: Icon, label, to, onClick, className = '' }: NavItemProps) {
  // If it's a navigation item with a route
  if (to) {
    return (
      <NavLink
        to={to}
        className={({ isActive }) => `
          flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-200 no-underline
          ${isActive 
            ? 'bg-blue-50 text-blue-600 font-semibold' 
            : 'text-gray-600 hover:bg-gray-100'
          }
          ${className}
        `}
      >
        <Icon size={18} />
        <span>{label}</span>
      </NavLink>
    );
  }

  // If it's an action item (like logout)
  return (
    <div 
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-200
        text-gray-600 hover:bg-gray-100
        ${className}
      `}
      onClick={onClick}
    >
      <Icon size={18} />
      <span>{label}</span>
    </div>
  );
}
