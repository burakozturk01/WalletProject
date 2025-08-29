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

    const buttonStyle: React.CSSProperties = {
        padding: '10px 16px',
        margin: '4px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
    };

    const primaryButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
    };

    const successButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#10b981',
        color: '#ffffff',
        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
    };

    const infoButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#06b6d4',
        color: '#ffffff',
        boxShadow: '0 2px 4px rgba(6, 182, 212, 0.3)'
    };

    const dangerButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#ef4444',
        color: '#ffffff',
        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        margin: '8px 0',
        border: '1px solid #475569',
        borderRadius: '8px',
        fontSize: '14px',
        backgroundColor: '#334155',
        color: '#f8fafc',
        transition: 'all 0.2s ease'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        marginBottom: '4px',
        color: '#e2e8f0',
        fontSize: '14px',
        fontWeight: 500
    };

    return (
        <div style={{ padding: '32px' }}>
            <div style={{
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <h2 style={{
                    margin: 0,
                    color: '#f8fafc',
                    fontSize: '24px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    👥 Users ({users.length})
                </h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        style={primaryButtonStyle}
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
                        onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6'}
                    >
                        {showCreateForm ? '✕ Cancel' : '➕ Create User'}
                    </button>
                    <button
                        style={infoButtonStyle}
                        onClick={fetchUserBalances}
                        disabled={balanceLoading}
                        onMouseOver={(e) => !balanceLoading && ((e.target as HTMLButtonElement).style.backgroundColor = '#0891b2')}
                        onMouseOut={(e) => !balanceLoading && ((e.target as HTMLButtonElement).style.backgroundColor = '#06b6d4')}
                    >
                        {balanceLoading ? '🔄 Refreshing...' : '💰 Refresh Balances'}
                    </button>
                </div>
            </div>

            {message && (
                <div style={{
                    padding: '16px 20px',
                    marginBottom: '24px',
                    backgroundColor: message.includes('Error') ? '#7f1d1d' : '#064e3b',
                    color: message.includes('Error') ? '#fecaca' : '#a7f3d0',
                    border: `1px solid ${message.includes('Error') ? '#991b1b' : '#047857'}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 500
                }}>
                    {message.includes('Error') ? '❌ ' : '✅ '}{message}
                </div>
            )}

            {showCreateForm && (
                <div style={{
                    padding: '32px',
                    marginBottom: '32px',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                }}>
                    <h3 style={{
                        color: '#f8fafc',
                        marginBottom: '24px',
                        fontSize: '20px',
                        fontWeight: 600
                    }}>
                        ➕ Create New User
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>Username:</label>
                                <input
                                    type="text"
                                    style={inputStyle}
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    maxLength={64}
                                    placeholder="Enter username"
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#475569'}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Email:</label>
                                <input
                                    type="email"
                                    style={inputStyle}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    maxLength={255}
                                    placeholder="Enter email address"
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#475569'}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Password:</label>
                                <input
                                    type="password"
                                    style={inputStyle}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength={6}
                                    placeholder="Enter password (min 6 characters)"
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#475569'}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            style={{
                                ...successButtonStyle,
                                marginTop: '24px',
                                padding: '12px 24px',
                                fontSize: '16px'
                            }}
                            disabled={loading}
                            onMouseOver={(e) => !loading && ((e.target as HTMLButtonElement).style.backgroundColor = '#059669')}
                            onMouseOut={(e) => !loading && ((e.target as HTMLButtonElement).style.backgroundColor = '#10b981')}
                        >
                            {loading ? '⏳ Creating...' : '✅ Create User'}
                        </button>
                    </form>
                </div>
            )}

            <div style={{
                overflowX: 'auto',
                borderRadius: '12px',
                border: '1px solid #475569',
                backgroundColor: '#334155'
            }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                }}>
                    <thead>
                        <tr style={{
                            backgroundColor: '#475569',
                            borderBottom: '1px solid #64748b'
                        }}>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 600,
                                borderRight: '1px solid #64748b'
                            }}>ID</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 600,
                                borderRight: '1px solid #64748b'
                            }}>Username</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 600,
                                borderRight: '1px solid #64748b'
                            }}>Email</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 600,
                                borderRight: '1px solid #64748b'
                            }}>Total Balance</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 600,
                                borderRight: '1px solid #64748b'
                            }}>Accounts</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 600,
                                borderRight: '1px solid #64748b'
                            }}>Created</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 600,
                                borderRight: '1px solid #64748b'
                            }}>Status</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 600
                            }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    color: '#94a3b8',
                                    fontSize: '16px',
                                    fontStyle: 'italic'
                                }}>
                                    📭 No users found. Create your first user!
                                </td>
                            </tr>
                        ) : (
                            users.map((user, index) => {
                                const balance = userBalances[user.id];
                                const isEven = index % 2 === 0;
                                return (
                                    <tr key={user.id} style={{
                                        backgroundColor: isEven ? '#334155' : '#3f4b5f',
                                        borderBottom: '1px solid #475569'
                                    }}>
                                        <td style={{
                                            padding: '16px 20px',
                                            borderRight: '1px solid #475569',
                                            fontFamily: 'Monaco, Consolas, monospace',
                                            fontSize: '12px',
                                            color: '#94a3b8'
                                        }}>
                                            {user.id.substring(0, 8)}...
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            borderRight: '1px solid #475569',
                                            color: '#f8fafc',
                                            fontWeight: 500
                                        }}>
                                            {user.username}
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            borderRight: '1px solid #475569',
                                            color: '#e2e8f0'
                                        }}>
                                            {user.email}
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            borderRight: '1px solid #475569'
                                        }}>
                                            {user.isDeleted ? (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>N/A (Deleted)</span>
                                            ) : balance ? (
                                                <span style={{
                                                    fontWeight: 600,
                                                    fontSize: '15px',
                                                    color: balance.totalBalance >= 0 ? '#10b981' : '#ef4444'
                                                }}>
                                                    ${balance.totalBalance.toFixed(2)}
                                                </span>
                                            ) : balanceLoading ? (
                                                <span style={{ color: '#94a3b8' }}>🔄 Loading...</span>
                                            ) : (
                                                <span style={{ color: '#94a3b8' }}>$0.00</span>
                                            )}
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            borderRight: '1px solid #475569',
                                            color: '#e2e8f0'
                                        }}>
                                            {user.isDeleted ? (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>N/A</span>
                                            ) : balance ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: 600 }}>
                                                        {balance.activeAccountCount}/{balance.accountCount}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        color: '#94a3b8',
                                                        backgroundColor: '#475569',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px'
                                                    }}>
                                                        active/total
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8' }}>0/0</span>
                                            )}
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            borderRight: '1px solid #475569',
                                            color: '#e2e8f0',
                                            fontSize: '13px'
                                        }}>
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            borderRight: '1px solid #475569'
                                        }}>
                                            <span style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                backgroundColor: user.isDeleted ? '#7f1d1d' : '#064e3b',
                                                color: user.isDeleted ? '#fecaca' : '#a7f3d0'
                                            }}>
                                                {user.isDeleted ? '🗑️ Deleted' : '✅ Active'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            {!user.isDeleted ? (
                                                <button
                                                    style={dangerButtonStyle}
                                                    onClick={() => handleDelete(user.id)}
                                                    disabled={loading}
                                                    onMouseOver={(e) => !loading && ((e.target as HTMLButtonElement).style.backgroundColor = '#dc2626')}
                                                    onMouseOut={(e) => !loading && ((e.target as HTMLButtonElement).style.backgroundColor = '#ef4444')}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            ) : (
                                                <span style={{
                                                    color: '#94a3b8',
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
                    marginTop: '16px',
                    fontSize: '12px',
                    color: '#94a3b8',
                    textAlign: 'right',
                    fontStyle: 'italic'
                }}>
                    💡 Balances auto-refresh every 30 seconds
                </div>
            )}
        </div>
    );
}
