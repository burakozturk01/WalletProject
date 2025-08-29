import React, { useState } from 'react';
import { Sidebar, HeaderBar } from './layout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AuthPage } from './auth';
import { useAuth } from '../../hooks/useAuth';
import { TransferPayPage } from './pages/transfer-pay/TransferPayPage';
import { TransactionsPage } from './pages/transactions/TransactionsPage';
import { AccountsPage } from './pages/accounts/AccountsPage';

export interface WalletAppProps {
    dark?: boolean;
}

export function WalletApp({ dark = true }: WalletAppProps) {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const [activeSection, setActiveSection] = useState('Dashboard');

    const handleNavigation = (section: string) => {
        setActiveSection(section);
    };

    const handleLogout = () => {
        logout();
    };

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Show auth page if not authenticated
    if (!isAuthenticated) {
        return <AuthPage />;
    }

    const renderContent = () => {
        switch (activeSection) {
            case 'Accounts':
                return <AccountsPage />;
            case 'Transactions':
                return <TransactionsPage />;
            case 'Transfer & Pay':
                return <TransferPayPage />;
            case 'Settings':
                return <SettingsPage />;
            default:
                return <></>;
        }
    };

    return (
        <div className="min-h-screen p-6 bg-gray-50 font-sans">
            <div className="flex h-full">
                <Sidebar
                    activeSection={activeSection}
                    userName={user?.username || 'User'}
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
