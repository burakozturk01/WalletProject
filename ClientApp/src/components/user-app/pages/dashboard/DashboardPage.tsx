import React from 'react';
import { Dashboard } from './Dashboard';

export function DashboardPage() {
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

    return (
        <Dashboard
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onTransfer={handleTransfer}
        />
    );
}
