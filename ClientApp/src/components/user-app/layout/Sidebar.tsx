import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  ReceiptText,
  SendHorizonal,
  Settings,
  LogOut,
  Wallet,
} from 'lucide-react';
import { NavItem } from './NavItem';
import { Avatar } from '../shared/ui';
import { useThemeClasses } from '../../../contexts/ThemeContext';

export interface SidebarProps {
  userName?: string;
  dark?: boolean;
  onLogout?: () => void;
  className?: string;
}

export function Sidebar({ 
  userName = 'User', 
  dark = false, 
  onLogout,
  className = '' 
}: SidebarProps) {
  const themeClasses = useThemeClasses();

  return (
    <aside 
      className={`flex h-full w-60 flex-col justify-between border-r ${themeClasses.border.primary} ${themeClasses.bg.card} ${className}`}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-blue-500 text-white">
            <Wallet size={18} />
          </div>
          <div className={`font-bold ${themeClasses.text.primary}`}>Wallet</div>
        </div>
        
        <nav className="flex flex-col gap-1">
          <NavItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            to="/dashboard"
          />
          <NavItem 
            icon={CreditCard} 
            label="Accounts" 
            to="/accounts"
          />
          <NavItem 
            icon={ReceiptText} 
            label="Transactions" 
            to="/transactions"
          />
          <NavItem 
            icon={SendHorizonal} 
            label="Transfer & Pay" 
            to="/transfer-pay"
          />
        </nav>
        
        <div className={`my-4 border-t ${themeClasses.border.primary}`} />
        
        <nav className="flex flex-col gap-1">
          <NavItem 
            icon={Settings} 
            label="Settings"
            to="/settings"
          />
          <NavItem 
            icon={LogOut} 
            label="Logout"
            onClick={onLogout}
          />
        </nav>
      </div>
      
      <div className="p-4">
        <Avatar name={userName} />
      </div>
    </aside>
  );
}
