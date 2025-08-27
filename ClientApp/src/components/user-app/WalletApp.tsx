import React, { useState } from 'react';
import { Sidebar, HeaderBar } from './layout';
import { Dashboard } from './pages/dashboard/Dashboard';

export interface WalletAppProps {
  userName?: string;
  dark?: boolean;
}

export function WalletApp({ userName = 'burakozturk', dark = false }: WalletAppProps) {
  const [activeSection, setActiveSection] = useState('Dashboard');

  const handleNavigation = (section: string) => {
    setActiveSection(section);
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    // TODO: Implement logout logic
  };

  const handleDeposit = () => {
    console.log('Deposit clicked');
    // TODO: Implement deposit logic
  };

  const handleWithdraw = () => {
    console.log('Withdraw clicked');
    // TODO: Implement withdraw logic
  };

  const handleTransfer = () => {
    console.log('Transfer clicked');
    // TODO: Implement transfer logic
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'Dashboard':
        return (
          <Dashboard
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onTransfer={handleTransfer}
          />
        );
      case 'Accounts':
        return <div className="p-4">Accounts page - Coming soon</div>;
      case 'Transactions':
        return <div className="p-4">Transactions page - Coming soon</div>;
      case 'Transfer & Pay':
        return <div className="p-4">Transfer & Pay page - Coming soon</div>;
      case 'Settings':
        return <div className="p-4">Settings page - Coming soon</div>;
      default:
        return (
          <Dashboard
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onTransfer={handleTransfer}
          />
        );
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 font-sans">
      <div className="flex h-full">
        <Sidebar
          activeSection={activeSection}
          userName={userName}
          dark={dark}
          onNavigate={handleNavigation}
          onLogout={handleLogout}
        />
        <main className="flex-1 bg-white">
          <HeaderBar title={activeSection} />
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default WalletApp;
