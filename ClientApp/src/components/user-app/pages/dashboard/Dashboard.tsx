import React from 'react';
import { Plus, ArrowUpRight, ArrowRight } from 'lucide-react';
import { Card, Button } from '../../shared/ui';
import { Sparkline } from '../../shared/charts';
import { useAuth } from '../../../../hooks/useAuth';
import { useUserData } from '../../../../hooks/useUserData';
import { useRecentTransactions } from '../../../../hooks/useTransactions';

export interface DashboardProps {
  totalBalance?: number;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onTransfer?: () => void;
  className?: string;
}

export function Dashboard({ 
  onDeposit,
  onWithdraw,
  onTransfer,
  className = '' 
}: DashboardProps) {
  const { user } = useAuth();
  const { totalBalance, accounts, isLoading, error } = useUserData(user?.id);
  const { recentTransactions } = useRecentTransactions(undefined, 5);

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
    );
  }

  const displayBalance = totalBalance?.totalBalance || 0;

  return (
    <div className={`p-4 grid grid-cols-2 gap-4 ${className}`}>
      <Card title="Total Balance">
        <div className="text-3xl font-extrabold text-green-600">
          ${displayBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          {totalBalance?.activeAccountCount || 0} active accounts
        </div>
        <Sparkline color="#28a745" />
      </Card>
      
      <Card title="Quick Actions">
        <div className="grid grid-cols-3 gap-3">
          <Button 
            variant="success" 
            icon={<Plus size={16} />}
            onClick={onDeposit}
          >
            Deposit
          </Button>
          <Button 
            variant="primary" 
            icon={<ArrowUpRight size={16} />}
            onClick={onWithdraw}
          >
            Withdraw
          </Button>
          <Button 
            variant="teal" 
            icon={<ArrowRight size={16} />}
            onClick={onTransfer}
          >
            Transfer
          </Button>
        </div>
      </Card>
    </div>
  );
}
