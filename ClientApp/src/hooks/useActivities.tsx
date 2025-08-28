import { useState, useEffect } from 'react';
import { api, Transaction, User, Account } from '../services/api';

export interface Activity {
  id: string;
  type: 'user_created' | 'account_created' | 'account_deleted' | 'transaction' | 'component_created' | 'component_deleted';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  icon: string;
  color: string;
  metadata?: any;
}

export interface UseActivitiesReturn {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  refreshActivities: () => Promise<void>;
}

export function useActivities(userId?: string, timeFilter: string = 'week'): UseActivitiesReturn {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTimeFilterDate = (filter: string): Date => {
    const now = new Date();
    switch (filter) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  };

  const formatTransactionActivity = (transaction: Transaction): Activity => {
    let type: Activity['type'] = 'transaction';
    let title = '';
    let description = transaction.description;
    let color = 'text-blue-600';
    let icon = 'ArrowRight';

    if (transaction.sourceType === 0 && transaction.destinationType === 1) {
      title = 'Deposit';
      color = 'text-green-600';
      icon = 'TrendingUp';
    } else if (transaction.sourceType === 1 && transaction.destinationType === 0) {
      title = 'Withdrawal';
      color = 'text-red-600';
      icon = 'TrendingDown';
    } else {
      title = 'Transfer';
      color = 'text-blue-600';
      icon = 'ArrowRight';
    }

    return {
      id: transaction.id,
      type,
      title,
      description,
      timestamp: transaction.timestamp,
      amount: transaction.amount,
      icon,
      color,
      metadata: transaction
    };
  };

  const formatUserActivity = (user: User): Activity => {
    return {
      id: user.id,
      type: 'user_created',
      title: 'Account Created',
      description: `Welcome ${user.username}! Your Wallet account has been created.`,
      timestamp: user.createdAt,
      icon: 'UserPlus',
      color: 'text-purple-600',
      metadata: user
    };
  };

  const formatAccountActivity = (account: Account, isDeleted: boolean = false): Activity => {
    const accountName = account.coreDetails?.name || 'Account';
    
    return {
      id: account.id,
      type: isDeleted ? 'account_deleted' : 'account_created',
      title: isDeleted ? 'Account Deleted' : 'Account Created',
      description: isDeleted 
        ? `Account "${accountName}" was deleted`
        : `New account "${accountName}" was created`,
      timestamp: isDeleted ? (account.deletedAt || account.updatedAt) : account.createdAt,
      icon: isDeleted ? 'Trash2' : 'Plus',
      color: isDeleted ? 'text-red-600' : 'text-green-600',
      metadata: account
    };
  };

  const refreshActivities = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filterDate = getTimeFilterDate(timeFilter);
      const allActivities: Activity[] = [];

      // Fetch transactions
      try {
        const transactionsResponse = await api.transaction.getTransactions({ limit: 100 });
        const filteredTransactions = transactionsResponse.data.filter(t => 
          new Date(t.timestamp) >= filterDate
        );
        
        const transactionActivities = filteredTransactions.map(formatTransactionActivity);
        allActivities.push(...transactionActivities);
      } catch (err) {
        console.warn('Failed to fetch transactions:', err);
      }

      // Fetch user creation activity (if current user)
      if (userId) {
        try {
          const userResponse = await api.user.getUser(userId);
          if (new Date(userResponse.createdAt) >= filterDate) {
            allActivities.push(formatUserActivity(userResponse));
          }
        } catch (err) {
          console.warn('Failed to fetch user data:', err);
        }

        // Fetch account activities
        try {
          const accountsResponse = await api.account.getAccountsByUser(userId, { limit: 100 });
          const filteredAccounts = accountsResponse.data.filter(a => 
            new Date(a.createdAt) >= filterDate || 
            (a.deletedAt && new Date(a.deletedAt) >= filterDate)
          );

          const accountActivities = filteredAccounts.flatMap(account => {
            const activities: Activity[] = [];
            
            // Account creation
            if (new Date(account.createdAt) >= filterDate) {
              activities.push(formatAccountActivity(account, false));
            }
            
            // Account deletion
            if (account.deletedAt && new Date(account.deletedAt) >= filterDate) {
              activities.push(formatAccountActivity(account, true));
            }

            return activities;
          });

          allActivities.push(...accountActivities);
        } catch (err) {
          console.warn('Failed to fetch accounts:', err);
        }
      }

      // Sort activities by timestamp (most recent first)
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(allActivities);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities';
      setError(errorMessage);
      console.error('Error fetching activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshActivities();
  }, [userId, timeFilter]);

  return {
    activities,
    isLoading,
    error,
    refreshActivities,
  };
}
