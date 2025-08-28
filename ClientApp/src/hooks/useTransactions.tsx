import { useState, useEffect } from 'react';
import { api, Transaction, TransactionCreate } from '../services/api';

export interface UseTransactionsReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refreshTransactions: () => Promise<void>;
  createTransaction: (data: TransactionCreate) => Promise<Transaction>;
}

export function useTransactions(accountId?: string): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let response;
      if (accountId) {
        response = await api.transaction.getTransactionsByAccount(accountId, { limit: 50 });
      } else {
        response = await api.transaction.getTransactions({ limit: 50 });
      }
      
      setTransactions(response.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createTransaction = async (data: TransactionCreate): Promise<Transaction> => {
    setError(null);
    
    try {
      const newTransaction = await api.transaction.createTransaction(data);
      
      // Refresh transactions to get updated list
      await refreshTransactions();
      
      return newTransaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transaction';
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    refreshTransactions();
  }, [accountId]);

  return {
    transactions,
    isLoading,
    error,
    refreshTransactions,
    createTransaction,
  };
}

export function useRecentTransactions(accountId?: string, limit: number = 5) {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshRecentTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let response;
      if (accountId) {
        response = await api.transaction.getTransactionsByAccount(accountId, { limit });
      } else {
        response = await api.transaction.getTransactions({ limit });
      }
      
      setRecentTransactions(response.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recent transactions';
      setError(errorMessage);
      console.error('Error fetching recent transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshRecentTransactions();
  }, [accountId, limit]);

  return {
    recentTransactions,
    isLoading,
    error,
    refreshRecentTransactions,
  };
}
