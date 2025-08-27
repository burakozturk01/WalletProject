import React, { useState, useEffect } from 'react';
import { UserManager } from './UserManager';
import { AccountManager } from './AccountManager';
import { TransactionManager } from './TransactionManager';

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
}

export interface Account {
  id: string;
  userId: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
  coreDetails?: {
    name: string;
    balance: number;
  };
  activeAccount?: {
    iban: string;
    activatedAt: string;
  };
  spendingLimit?: {
    limitAmount: number;
    timeframe: number;
    currentSpending: number;
    periodStartDate: string;
  };
  savingGoal?: {
    goalName: string;
    targetAmount: number;
  };
}

export interface Transaction {
  id: string;
  sourceType: number;
  sourceAccountId?: string;
  sourceIban?: string;
  sourceName?: string;
  destinationType: number;
  destinationAccountId?: string;
  destinationIban?: string;
  destinationName?: string;
  amount: number;
  description: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
}

export function DatabaseTester() {
  const [activeTab, setActiveTab] = useState<'users' | 'accounts' | 'transactions'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refreshData = async () => {
    try {
      // Fetch users
      const usersResponse = await fetch('/api/user?skip=0&limit=100');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data || []);
      }

      // Fetch accounts
      const accountsResponse = await fetch('/api/account?skip=0&limit=100');
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        setAccounts(accountsData.data || []);
      }

      // Fetch transactions
      const transactionsResponse = await fetch('/api/transaction?skip=0&limit=100');
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const resetDatabase = async () => {
    if (!window.confirm('Are you sure you want to reset the entire database? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/database/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Database has been reset successfully!');
        await refreshData(); // Refresh data after reset
      } else {
        const errorText = await response.text();
        alert(`Failed to reset database: ${errorText}`);
      }
    } catch (error) {
      console.error('Error resetting database:', error);
      alert('Error occurred while resetting database. Please check the console for details.');
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const tabStyle = (isActive: boolean) => ({
    padding: '10px 20px',
    backgroundColor: isActive ? '#007bff' : '#f8f9fa',
    color: isActive ? 'white' : '#333',
    border: '1px solid #dee2e6',
    cursor: 'pointer',
    borderBottom: isActive ? '1px solid #007bff' : '1px solid #dee2e6'
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>Database Testing Interface</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={refreshData} style={{
          padding: '10px 20px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginRight: '10px'
        }}>
          Refresh All Data
        </button>
        <button onClick={resetDatabase} style={{
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginRight: '10px'
        }}>
          Reset Database
        </button>
        <span style={{ color: '#666' }}>
          Users: {users.length} | Accounts: {accounts.length} | Transactions: {transactions.length}
        </span>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #dee2e6', marginBottom: '20px' }}>
        <button
          style={tabStyle(activeTab === 'users')}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          style={tabStyle(activeTab === 'accounts')}
          onClick={() => setActiveTab('accounts')}
        >
          Accounts & Components
        </button>
        <button
          style={tabStyle(activeTab === 'transactions')}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
      </div>

      <div>
        {activeTab === 'users' && (
          <UserManager users={users} onRefresh={refreshData} />
        )}
        {activeTab === 'accounts' && (
          <AccountManager accounts={accounts} users={users} onRefresh={refreshData} />
        )}
        {activeTab === 'transactions' && (
          <TransactionManager transactions={transactions} accounts={accounts} users={users} onRefresh={refreshData} />
        )}
      </div>
    </div>
  );
}
