import React, { useState } from 'react';
import { Plus, ArrowUpRight, ArrowRight, Clock, TrendingUp, TrendingDown, UserPlus, Trash2, Filter, RefreshCw } from 'lucide-react';
import { Card, Button, Dropdown } from '../../shared/ui';
import { Sparkline } from '../../shared/charts';
import { useAuth } from '../../../../hooks/useAuth';
import { useUserData } from '../../../../hooks/useUserData';
import { useActivities, Activity } from '../../../../hooks/useActivities';

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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { activities, isLoading: activitiesLoading, error: activitiesError, refreshActivities } = useActivities(user?.id, timeFilter);

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

  const categoryFilterOptions = [
    { value: 'all', label: 'All Activities' },
    { value: 'transaction', label: 'Transactions' },
    { value: 'account', label: 'Accounts' },
    { value: 'user', label: 'User Actions' },
    { value: 'system', label: 'System' }
  ];

  // Filter activities by category
  const filteredActivities = categoryFilter === 'all' 
    ? activities 
    : activities.filter(activity => activity.category === categoryFilter);

  // Group activities by priority for better display
  const groupedActivities = {
    high: filteredActivities.filter(a => a.priority === 'high'),
    medium: filteredActivities.filter(a => a.priority === 'medium'),
    low: filteredActivities.filter(a => a.priority === 'low')
  };

  const getActivityStats = () => {
    const stats = {
      deposits: activities.filter(a => a.type === 'deposit').length,
      withdrawals: activities.filter(a => a.type === 'withdrawal').length,
      transfers: activities.filter(a => a.type === 'transfer').length,
      accountActions: activities.filter(a => a.category === 'account').length,
      totalAmount: activities
        .filter(a => a.amount)
        .reduce((sum, a) => sum + (a.amount || 0), 0)
    };
    return stats;
  };

  const stats = getActivityStats();

  const getActivityIcon = (iconName: string, priority: string = 'medium') => {
    const iconProps = { size: priority === 'high' ? 18 : 16 };
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

  const getPriorityBadge = (priority: string) => {
    const badges = {
      high: 'bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full',
      medium: 'bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full',
      low: 'bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full'
    };
    return badges[priority as keyof typeof badges] || badges.medium;
  };

  const renderActivityItem = (activity: Activity) => (
    <div key={activity.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
      activity.priority === 'high' ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-400' :
      activity.priority === 'medium' ? 'bg-gray-50 hover:bg-gray-100' :
      'bg-gray-25 hover:bg-gray-50'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`flex items-center justify-center rounded-full shadow-sm ${
          activity.priority === 'high' ? 'w-12 h-12 bg-white' : 'w-10 h-10 bg-white'
        }`}>
          <div className={activity.color}>
            {getActivityIcon(activity.icon, activity.priority)}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className="font-medium text-gray-900">{activity.title}</div>
            <span className={getPriorityBadge(activity.priority)}>
              {activity.priority}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">{activity.description}</div>
        </div>
      </div>
      <div className="text-right">
        {activity.amount && (
          <div className={`font-semibold ${activity.color} ${activity.priority === 'high' ? 'text-lg' : ''}`}>
            ${activity.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        <div className="text-sm text-gray-500 flex items-center justify-end mt-1">
          <Clock size={12} className="mr-1" />
          {formatDate(activity.timestamp)}
        </div>
      </div>
    </div>
  );

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

      {/* Activity Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Deposits" className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.deposits}</div>
          <div className="text-sm text-gray-500">This period</div>
        </Card>
        <Card title="Withdrawals" className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.withdrawals}</div>
          <div className="text-sm text-gray-500">This period</div>
        </Card>
        <Card title="Transfers" className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.transfers}</div>
          <div className="text-sm text-gray-500">This period</div>
        </Card>
        <Card title="Account Actions" className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.accountActions}</div>
          <div className="text-sm text-gray-500">This period</div>
        </Card>
      </div>

      {/* Recent Activities section spanning full width */}
      <Card title="Recent Activities" className="w-full">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Filter activities
            </div>
            <Button
              variant="secondary"
              icon={<RefreshCw size={14} />}
              onClick={refreshActivities}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Dropdown
              options={categoryFilterOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="w-40"
            />
            <Dropdown
              options={timeFilterOptions}
              value={timeFilter}
              onChange={setTimeFilter}
              className="w-40"
            />
          </div>
        </div>

        {activitiesLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-3 text-gray-300 animate-spin" />
            <p>Loading activities...</p>
          </div>
        ) : activitiesError ? (
          <div className="text-center py-8 text-red-500">
            <p>Error loading activities: {activitiesError}</p>
            <Button
              variant="secondary"
              onClick={refreshActivities}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        ) : filteredActivities && filteredActivities.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* High Priority Activities */}
            {groupedActivities.high.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  High Priority ({groupedActivities.high.length})
                </h4>
                <div className="space-y-2">
                  {groupedActivities.high.map(renderActivityItem)}
                </div>
              </div>
            )}

            {/* Medium Priority Activities */}
            {groupedActivities.medium.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  Recent Activities ({groupedActivities.medium.length})
                </h4>
                <div className="space-y-2">
                  {groupedActivities.medium.map(renderActivityItem)}
                </div>
              </div>
            )}

            {/* Low Priority Activities */}
            {groupedActivities.low.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  Other Activities ({groupedActivities.low.length})
                </h4>
                <div className="space-y-2">
                  {groupedActivities.low.map(renderActivityItem)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No activities found</p>
            <p className="text-sm">
              {categoryFilter === 'all' 
                ? 'Your activities will appear here when you start using your Wallet'
                : `No ${categoryFilter} activities found for the selected time period`
              }
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
