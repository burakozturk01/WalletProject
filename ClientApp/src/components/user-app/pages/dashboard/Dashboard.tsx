import React from 'react';
import { Plus, ArrowUpRight, ArrowRight } from 'lucide-react';
import { Card, Button } from '../../shared/ui';
import { Sparkline } from '../../shared/charts';

export interface DashboardProps {
  totalBalance?: number;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onTransfer?: () => void;
  className?: string;
}

export function Dashboard({ 
  totalBalance = 15432.55, 
  onDeposit,
  onWithdraw,
  onTransfer,
  className = '' 
}: DashboardProps) {
  return (
    <div className={`p-4 grid grid-cols-2 gap-4 ${className}`}>
      <Card title="Total Balance">
        <div className="text-3xl font-extrabold text-green-600">
          ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
