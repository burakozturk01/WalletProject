import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function NavItem({ icon: Icon, label, active = false, onClick, className = '' }: NavItemProps) {
  return (
    <div 
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-200
        ${active 
          ? 'bg-blue-50 text-blue-600 font-semibold' 
          : 'text-gray-600 hover:bg-gray-100'
        }
        ${className}
      `}
      onClick={onClick}
    >
      <Icon size={18} />
      <span>{label}</span>
    </div>
  );
}
