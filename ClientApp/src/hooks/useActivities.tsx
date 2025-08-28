import { useState, useEffect } from 'react';
import { api, Transaction, User, Account } from '../services/api';
import { convertToUserTimezone, getUserTimezone } from '../utils/timezone';

export interface Activity {
  id: string;
  type: 'user_created' | 'account_created' | 'account_deleted' | 'transaction' | 'deposit' | 'withdrawal' | 'transfer' | 'component_created' | 'component_deleted';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  icon: string;
  color: string;
  metadata?: any;
  category: 'account' | 'transaction' | 'user' | 'system';
  priority: 'high' | 'medium' | 'low';
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
    // Use timezone-aware current time for filtering
    const now = convertToUserTimezone(new Date());
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
    let category: Activity['category'] = 'transaction';
    let priority: Activity['priority'] = 'medium';

    // Determine transaction type based on source and destination
    // SourceType: ACCOUNT (0), IBAN (1), SYSTEM (2)
    // DestinationType: ACCOUNT (0), IBAN (1), SPEND (2)
    
    if ((transaction.sourceType === 1 || transaction.sourceType === 2) && transaction.destinationType === 0) {
      // External (IBAN/SYSTEM) to Account = Deposit
      type = 'deposit';
      title = 'Money Deposited';
      color = 'text-green-600';
      icon = 'TrendingUp';
      priority = 'high';
      description = `Deposited $${transaction.amount.toLocaleString()} ${transaction.description ? `- ${transaction.description}` : ''}`;
    } else if (transaction.sourceType === 0 && (transaction.destinationType === 1 || transaction.destinationType === 2)) {
      // Account to External (IBAN/SPEND) = Withdrawal
      type = 'withdrawal';
      title = 'Money Withdrawn';
      color = 'text-red-600';
      icon = 'TrendingDown';
      priority = 'high';
      description = `Withdrew $${transaction.amount.toLocaleString()} ${transaction.description ? `- ${transaction.description}` : ''}`;
    } else if (transaction.sourceType === 0 && transaction.destinationType === 0) {
      // Account to Account = Transfer
      type = 'transfer';
      title = 'Money Transferred';
      color = 'text-blue-600';
      icon = 'ArrowRight';
      priority = 'medium';
      description = `Transferred $${transaction.amount.toLocaleString()} ${transaction.description ? `- ${transaction.description}` : ''}`;
    } else {
      // Other transaction types
      title = 'Transaction';
      description = `${transaction.description} - $${transaction.amount.toLocaleString()}`;
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
      category,
      priority,
      metadata: transaction
    };
  };

  const formatUserActivity = (user: User): Activity => {
    return {
      id: user.id,
      type: 'user_created',
      title: 'Wallet Account Created',
      description: `Welcome ${user.username}! Your Wallet account has been successfully created and is ready to use.`,
      timestamp: user.createdAt,
      icon: 'UserPlus',
      color: 'text-purple-600',
      category: 'user',
      priority: 'high',
      metadata: user
    };
  };

  const formatAccountActivity = (account: Account, isDeleted: boolean = false): Activity => {
    const accountName = account.coreDetails?.name || 'Account';
    const balance = account.coreDetails?.balance || 0;
    
    return {
      id: account.id,
      type: isDeleted ? 'account_deleted' : 'account_created',
      title: isDeleted ? 'Account Deleted' : 'New Account Created',
      description: isDeleted 
        ? `Account "${accountName}" was permanently deleted`
        : `New account "${accountName}" was created with initial balance of $${balance.toLocaleString()}`,
      timestamp: isDeleted ? (account.deletedAt || account.updatedAt) : account.createdAt,
      icon: isDeleted ? 'Trash2' : 'Plus',
      color: isDeleted ? 'text-red-600' : 'text-green-600',
      category: 'account',
      priority: isDeleted ? 'high' : 'medium',
      metadata: account
    };
  };

  const refreshActivities = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filterDate = getTimeFilterDate(timeFilter);
      const allActivities: Activity[] = [];

      // Fetch user-specific transactions
      if (userId) {
        try {
          // Get user's accounts first
          const accountsResponse = await api.account.getAccountsByUser(userId, { limit: 100 });
          const userAccountIds = accountsResponse.data.map(a => a.id);
          
          // Fetch transactions for all user accounts
          const transactionPromises = userAccountIds.map(accountId => 
            api.transaction.getTransactionsByAccount(accountId, { limit: 50 })
          );
          
          const transactionResponses = await Promise.all(transactionPromises);
          const allTransactions = transactionResponses.flatMap(response => response.data);
          
          const uniqueTransactions = allTransactions.filter((transaction, index, self) => 
            index === self.findIndex(t => t.id === transaction.id) &&
            convertToUserTimezone(new Date(transaction.timestamp)) >= filterDate
          );
          
          const transactionActivities = uniqueTransactions.map(formatTransactionActivity);
          allActivities.push(...transactionActivities);
        } catch (err) {
          console.warn('Failed to fetch transactions:', err);
        }
      }

      // Fetch user creation activity (if current user)
      if (userId) {
        try {
          const userResponse = await api.user.getUser(userId);
          if (convertToUserTimezone(new Date(userResponse.createdAt)) >= filterDate) {
            allActivities.push(formatUserActivity(userResponse));
          }
        } catch (err) {
          console.warn('Failed to fetch user data:', err);
        }

        // Fetch account activities
        try {
          const accountsResponse = await api.account.getAccountsByUser(userId, { limit: 100 });
          const filteredAccounts = accountsResponse.data.filter(a => 
            convertToUserTimezone(new Date(a.createdAt)) >= filterDate || 
            (a.deletedAt && convertToUserTimezone(new Date(a.deletedAt)) >= filterDate)
          );

          const accountActivities = filteredAccounts.flatMap(account => {
            const activities: Activity[] = [];
            
            // Account creation
            if (convertToUserTimezone(new Date(account.createdAt)) >= filterDate) {
              activities.push(formatAccountActivity(account, false));
            }
            
            // Account deletion
            if (account.deletedAt && convertToUserTimezone(new Date(account.deletedAt)) >= filterDate) {
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
