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
  sourceAccountBalanceBefore?: number;
  destinationAccountBalanceBefore?: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'accounts' | 'transactions'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refreshData = async () => {
    try {
      const usersResponse = await fetch('/api/user/admin/all?skip=0&limit=100');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data || []);
      }

      const accountsResponse = await fetch('/api/account/admin/all?skip=0&limit=100');
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        setAccounts(accountsData.data || []);
      }

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
        await refreshData(); 
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

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '14px 24px',
    backgroundColor: isActive ? '#3b82f6' : 'transparent',
    color: isActive ? '#ffffff' : '#94a3b8',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    marginRight: '8px'
  });

  const buttonStyle = {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  } as React.CSSProperties;

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#10b981',
    color: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ef4444',
    color: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)'
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: '32px',
        borderBottom: '1px solid #334155'
      }}>
        <h1 style={{ 
          color: '#f8fafc', 
          marginBottom: '8px',
          fontSize: '32px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Database Administration
        </h1>
        <p style={{ 
          color: '#94a3b8', 
          margin: 0,
          fontSize: '16px'
        }}>
          Manage users, accounts, and transactions
        </p>
      </div>

      {/* Main Content */}
      <div style={{ padding: '32px' }}>
        {/* Action Bar */}
        <div style={{ 
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={refreshData} 
              style={primaryButtonStyle}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#059669'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#10b981'}
            >
              <span>🔄</span>
              Refresh All Data
            </button>
            <button 
              onClick={resetDatabase} 
              style={dangerButtonStyle}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#dc2626'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#ef4444'}
            >
              <span>⚠️</span>
              Reset Database
            </button>
          </div>
          
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            backgroundColor: '#1e293b',
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: '#3b82f6', 
                borderRadius: '50%' 
              }}></div>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Users: </span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{users.length}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: '#10b981', 
                borderRadius: '50%' 
              }}></div>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Accounts: </span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{accounts.length}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: '#f59e0b', 
                borderRadius: '50%' 
              }}></div>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Transactions: </span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{transactions.length}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '32px',
          backgroundColor: '#1e293b',
          padding: '8px',
          borderRadius: '12px',
          border: '1px solid #334155'
        }}>
          <button
            style={tabStyle(activeTab === 'users')}
            onClick={() => setActiveTab('users')}
            onMouseOver={(e) => {
              if (activeTab !== 'users') {
                (e.target as HTMLButtonElement).style.backgroundColor = '#374151';
                (e.target as HTMLButtonElement).style.color = '#ffffff';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'users') {
                (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.target as HTMLButtonElement).style.color = '#94a3b8';
              }
            }}
          >
            👥 Users
          </button>
          <button
            style={tabStyle(activeTab === 'accounts')}
            onClick={() => setActiveTab('accounts')}
            onMouseOver={(e) => {
              if (activeTab !== 'accounts') {
                (e.target as HTMLButtonElement).style.backgroundColor = '#374151';
                (e.target as HTMLButtonElement).style.color = '#ffffff';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'accounts') {
                (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.target as HTMLButtonElement).style.color = '#94a3b8';
              }
            }}
          >
            🏦 Accounts & Components
          </button>
          <button
            style={tabStyle(activeTab === 'transactions')}
            onClick={() => setActiveTab('transactions')}
            onMouseOver={(e) => {
              if (activeTab !== 'transactions') {
                (e.target as HTMLButtonElement).style.backgroundColor = '#374151';
                (e.target as HTMLButtonElement).style.color = '#ffffff';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'transactions') {
                (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.target as HTMLButtonElement).style.color = '#94a3b8';
              }
            }}
          >
            💳 Transactions
          </button>
        </div>

        {/* Tab Content */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
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
    </div>
  );
}
