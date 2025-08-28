import React, { useState } from 'react';
import { Plus, ArrowUpRight, ArrowRight, Clock, TrendingUp, TrendingDown, UserPlus, Trash2 } from 'lucide-react';
import { Card, Button, Dropdown } from '../../shared/ui';
import { Sparkline } from '../../shared/charts';
import { useAuth } from '../../../../hooks/useAuth';
import { useUserData } from '../../../../hooks/useUserData';
import { useActivities } from '../../../../hooks/useActivities';

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
  const [timeFilter, setTimeFilter] = useState('week');
  const { activities, isLoading: activitiesLoading, error: activitiesError } = useActivities(user?.id, timeFilter);

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

  const timeFilterOptions = [
    { value: 'hour', label: 'Last Hour' },
    { value: 'day', label: 'Last Day' },
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'year', label: 'Last Year' }
  ];

  const getActivityIcon = (iconName: string) => {
    const iconProps = { size: 16 };
    switch (iconName) {
      case 'TrendingUp':
        return <TrendingUp {...iconProps} />;
      case 'TrendingDown':
        return <TrendingDown {...iconProps} />;
      case 'ArrowRight':
        return <ArrowRight {...iconProps} />;
      case 'UserPlus':
        return <UserPlus {...iconProps} />;
      case 'Plus':
        return <Plus {...iconProps} />;
      case 'Trash2':
        return <Trash2 {...iconProps} />;
      default:
        return <Clock {...iconProps} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className={`p-4 space-y-4 ${className}`}>
      {/* Top row with Total Balance and Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Recent Activities section spanning full width */}
      <Card title="Recent Activities" className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Filter activities by time period
          </div>
          <Dropdown
            options={timeFilterOptions}
            value={timeFilter}
            onChange={setTimeFilter}
            className="w-40"
          />
        </div>

        {activitiesLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-3 text-gray-300 animate-spin" />
            <p>Loading activities...</p>
          </div>
        ) : activitiesError ? (
          <div className="text-center py-8 text-red-500">
            <p>Error loading activities: {activitiesError}</p>
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm">
                    <div className={activity.color}>
                      {getActivityIcon(activity.icon)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{activity.title}</div>
                    <div className="text-sm text-gray-500">{activity.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  {activity.amount && (
                    <div className={`font-semibold ${activity.color}`}>
                      ${activity.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                  <div className="text-sm text-gray-500 flex items-center justify-end">
                    <Clock size={12} className="mr-1" />
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No recent activities</p>
            <p className="text-sm">Your activities will appear here when you start using your Wallet</p>
          </div>
        )}
      </Card>
    </div>
  );
}
