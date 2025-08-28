import React, { useState, useEffect } from 'react';
import { User } from './AdminPage';
import { useTimezone } from '../../hooks/useTimezone';

interface UserTotalBalance {
  userId: string;
  totalBalance: number;
  accountCount: number;
  activeAccountCount: number;
}

interface UserManagerProps {
  users: User[];
  onRefresh: () => void;
}

export function UserManager({ users, onRefresh }: UserManagerProps) {
  const { formatDate } = useTimezone();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userBalances, setUserBalances] = useState<Record<string, UserTotalBalance>>({});
  const [balanceLoading, setBalanceLoading] = useState(false);

    const fetchUserBalances = async () => {
    setBalanceLoading(true);
    const balances: Record<string, UserTotalBalance> = {};
    
    try {
      await Promise.all(
        users.filter(u => !u.isDeleted).map(async (user) => {
          try {
            const response = await fetch(`/api/user/${user.id}/total-balance`);
            if (response.ok) {
              const balance = await response.json();
              balances[user.id] = balance;
            }
          } catch (error) {
            console.error(`Failed to fetch balance for user ${user.id}:`, error);
          }
        })
      );
      setUserBalances(balances);
    } catch (error) {
      console.error('Error fetching user balances:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

    useEffect(() => {
    if (users.length > 0) {
      fetchUserBalances();
    }
  }, [users]);

    useEffect(() => {
    const interval = setInterval(() => {
      if (users.length > 0) {
        fetchUserBalances();
      }
    }, 30000); 

    return () => clearInterval(interval);
  }, [users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('User created successfully!');
        setFormData({ username: '', email: '', password: '' });
        setShowCreateForm(false);
        onRefresh();
                setTimeout(fetchUserBalances, 1000);
      } else {
        const error = await response.text();
        setMessage(`Error: ${error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('User deleted successfully!');
        onRefresh();
                setTimeout(fetchUserBalances, 1000);
      } else {
        const error = await response.text();
        setMessage(`Error: ${error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = {
    padding: '8px 16px',
    margin: '4px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    margin: '4px 0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>Users ({users.length})</h2>
        <button
          style={{ ...buttonStyle, backgroundColor: '#007bff', color: 'white' }}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create User'}
        </button>
        <button
          style={{ ...buttonStyle, backgroundColor: '#17a2b8', color: 'white' }}
          onClick={fetchUserBalances}
          disabled={balanceLoading}
        >
          {balanceLoading ? 'Refreshing...' : 'Refresh Balances'}
        </button>
      </div>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
          color: message.includes('Error') ? '#721c24' : '#155724',
          border: `1px solid ${message.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {showCreateForm && (
        <div style={{
          padding: '20px',
          marginBottom: '20px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          <h3>Create New User</h3>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Username:</label>
              <input
                type="text"
                style={inputStyle}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                maxLength={64}
              />
            </div>
            <div>
              <label>Email:</label>
              <input
                type="email"
                style={inputStyle}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                maxLength={255}
              />
            </div>
            <div>
              <label>Password:</label>
              <input
                type="password"
                style={inputStyle}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              style={{ ...buttonStyle, backgroundColor: '#28a745', color: 'white' }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #dee2e6' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Username</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Total Balance</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Accounts</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Created</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No users found. Create your first user!
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const balance = userBalances[user.id];
                return (
                  <tr key={user.id}>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', fontFamily: 'monospace', fontSize: '12px' }}>
                      {user.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.username}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.email}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {user.isDeleted ? (
                        <span style={{ color: '#6c757d', fontStyle: 'italic' }}>N/A (Deleted)</span>
                      ) : balance ? (
                        <span style={{ 
                          fontWeight: 'bold',
                          color: balance.totalBalance >= 0 ? '#28a745' : '#dc3545'
                        }}>
                          ${balance.totalBalance.toFixed(2)}
                        </span>
                      ) : balanceLoading ? (
                        <span style={{ color: '#6c757d' }}>Loading...</span>
                      ) : (
                        <span style={{ color: '#6c757d' }}>$0.00</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {user.isDeleted ? (
                        <span style={{ color: '#6c757d', fontStyle: 'italic' }}>N/A</span>
                      ) : balance ? (
                        <span>
                          {balance.activeAccountCount}/{balance.accountCount}
                          <span style={{ fontSize: '11px', color: '#6c757d', marginLeft: '4px' }}>
                            (active/total)
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: '#6c757d' }}>0/0</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: user.isDeleted ? '#f8d7da' : '#d4edda',
                        color: user.isDeleted ? '#721c24' : '#155724'
                      }}>
                        {user.isDeleted ? 'Deleted' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {!user.isDeleted ? (
                        <button
                          style={{ ...buttonStyle, backgroundColor: '#dc3545', color: 'white' }}
                          onClick={() => handleDelete(user.id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      ) : (
                        <span style={{ 
                          color: '#6c757d', 
                          fontStyle: 'italic',
                          fontSize: '12px'
                        }}>
                          Deleted on {user.deletedAt ? formatDate(user.deletedAt) : 'Unknown'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {users.filter(u => !u.isDeleted).length > 0 && (
        <div style={{ 
          marginTop: '10px', 
          fontSize: '12px', 
          color: '#6c757d',
          textAlign: 'right'
        }}>
          Balances auto-refresh every 30 seconds
        </div>
      )}
    </div>
  );
}
