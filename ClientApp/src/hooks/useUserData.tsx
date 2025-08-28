import { useState, useEffect } from 'react';
import { api, User, UserTotalBalance, Account } from '../services/api';

export interface UseUserDataReturn {
  user: User | null;
  accounts: Account[];
  totalBalance: UserTotalBalance | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useUserData(userId?: string): UseUserDataReturn {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState<UserTotalBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch user data, accounts, and total balance in parallel
      const [userResponse, accountsResponse, balanceResponse] = await Promise.all([
        api.user.getUser(userId),
        api.account.getAccountsByUser(userId),
        api.user.getUserTotalBalance(userId),
      ]);

      setUser(userResponse);
      setAccounts(accountsResponse.data || []);
      setTotalBalance(balanceResponse);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
      setError(errorMessage);
      console.error('Error fetching user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [userId]);

  return {
    user,
    accounts,
    totalBalance,
    isLoading,
    error,
    refreshData,
  };
}

export function useAccountData(accountId?: string) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAccount = async () => {
    if (!accountId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accountResponse = await api.account.getAccount(accountId);
      setAccount(accountResponse);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account data';
      setError(errorMessage);
      console.error('Error fetching account data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAccount();
  }, [accountId]);

  return {
    account,
    isLoading,
    error,
    refreshAccount,
  };
}
