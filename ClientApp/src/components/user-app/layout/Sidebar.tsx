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

export interface SidebarProps {
  activeSection: string;
  userName?: string;
  dark?: boolean;
  onNavigate?: (section: string) => void;
  onLogout?: () => void;
  className?: string;
}

export function Sidebar({ 
  activeSection, 
  userName = 'User', 
  dark = false, 
  onNavigate,
  onLogout,
  className = '' 
}: SidebarProps) {
  const backgroundColor = dark ? '#212529' : '#f8f9fa';

  const handleNavigation = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  return (
    <aside 
      className={`flex h-full w-60 flex-col justify-between border-r border-gray-200 ${className}`}
      style={{ backgroundColor }}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-blue-500 text-white">
            <Wallet size={18} />
          </div>
          <div className="font-bold">Wallet</div>
        </div>
        
        <nav className="flex flex-col gap-1">
          <NavItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeSection === 'Dashboard'}
            onClick={() => handleNavigation('Dashboard')}
          />
          <NavItem 
            icon={CreditCard} 
            label="Accounts" 
            active={activeSection === 'Accounts'}
            onClick={() => handleNavigation('Accounts')}
          />
          <NavItem 
            icon={ReceiptText} 
            label="Transactions" 
            active={activeSection === 'Transactions'}
            onClick={() => handleNavigation('Transactions')}
          />
          <NavItem 
            icon={SendHorizonal} 
            label="Transfer & Pay" 
            active={activeSection === 'Transfer & Pay'}
            onClick={() => handleNavigation('Transfer & Pay')}
          />
        </nav>
        
        <div className="my-4 border-t border-gray-200" />
        
        <nav className="flex flex-col gap-1">
          <NavItem 
            icon={Settings} 
            label="Settings"
            active={activeSection === 'Settings'}
            onClick={() => handleNavigation('Settings')}
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
