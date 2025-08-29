import React, { useState } from 'react';
import { Account, User } from './AdminPage';

interface AccountManagerProps {
    accounts: Account[];
    users: User[];
    onRefresh: () => void;
}

export function AccountManager({ accounts, users, onRefresh }: AccountManagerProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        userId: '',
        isMain: false,
        coreDetails: {
            name: '',
            balance: 0
        },
        activeAccount: {
            enabled: false,
            iban: ''
        },
        spendingLimit: {
            enabled: false,
            limitAmount: 0,
            timeframe: 0
        },
        savingGoal: {
            enabled: false,
            goalName: '',
            targetAmount: 0
        }
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const timeframeLabels = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const payload: any = {
                userId: formData.userId,
                isMain: formData.isMain,
                coreDetails: {
                    name: formData.coreDetails.name,
                    balance: formData.coreDetails.balance
                }
            };

            if (formData.activeAccount.enabled) {
                payload.activeAccount = {
                    iban: formData.activeAccount.iban
                };
            }

            if (formData.spendingLimit.enabled) {
                payload.spendingLimit = {
                    limitAmount: formData.spendingLimit.limitAmount,
                    timeframe: formData.spendingLimit.timeframe,
                    currentSpending: 0
                };
            }

            if (formData.savingGoal.enabled) {
                payload.savingGoal = {
                    goalName: formData.savingGoal.goalName,
                    targetAmount: formData.savingGoal.targetAmount
                };
            }

            const response = await fetch('/api/account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setMessage('Account created successfully!');
                resetForm();
                setShowCreateForm(false);
                onRefresh();
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

    const resetForm = () => {
        setFormData({
            userId: '',
            isMain: false,
            coreDetails: {
                name: '',
                balance: 0
            },
            activeAccount: {
                enabled: false,
                iban: ''
            },
            spendingLimit: {
                enabled: false,
                limitAmount: 0,
                timeframe: 0
            },
            savingGoal: {
                enabled: false,
                goalName: '',
                targetAmount: 0
            }
        });
    };

    const handleDelete = async (accountId: string) => {
        if (!confirm('Are you sure you want to delete this account?')) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/account/${accountId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setMessage('Account deleted successfully!');
                onRefresh();
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

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        cursor: 'pointer'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        marginBottom: '4px',
        color: '#e2e8f0',
        fontSize: '14px',
        fontWeight: 500
    };

    const checkboxStyle: React.CSSProperties = {
        margin: '4px 8px 4px 0',
        transform: 'scale(1.2)'
    };

    const componentCardStyle: React.CSSProperties = {
        marginBottom: '20px',
        padding: '20px',
        border: '1px solid #475569',
        borderRadius: '12px',
        backgroundColor: '#3f4b5f',
        transition: 'all 0.2s ease'
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
                    🏦 Accounts & Components ({accounts.length})
                </h2>
                <button
                    style={primaryButtonStyle}
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
                    onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6'}
                >
                    {showCreateForm ? '✕ Cancel' : '➕ Create Account'}
                </button>
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
                        🏗️ Create New Account (ECS Architecture)
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                            <div>
                                <h4 style={{
                                    color: '#f8fafc',
                                    marginBottom: '20px',
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    borderBottom: '2px solid #475569',
                                    paddingBottom: '8px'
                                }}>
                                    📋 Account Entity
                                </h4>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>User:</label>
                                    <select
                                        style={selectStyle}
                                        value={formData.userId}
                                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                        required
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#475569'}
                                    >
                                        <option value="">Select a user</option>
                                        {users.filter(u => !u.isDeleted).map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.username} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '20px',
                                    padding: '12px',
                                    backgroundColor: '#475569',
                                    borderRadius: '8px'
                                }}>
                                    <input
                                        type="checkbox"
                                        style={checkboxStyle}
                                        checked={formData.isMain}
                                        onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                                    />
                                    <label style={{ color: '#f8fafc', fontWeight: 500 }}>
                                        🌟 Main Account
                                    </label>
                                </div>

                                <h4 style={{
                                    color: '#f8fafc',
                                    marginBottom: '16px',
                                    fontSize: '16px',
                                    fontWeight: 600
                                }}>
                                    🔧 Core Details Component (Required)
                                </h4>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Account Name:</label>
                                    <input
                                        type="text"
                                        style={inputStyle}
                                        value={formData.coreDetails.name}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            coreDetails: { ...formData.coreDetails, name: e.target.value }
                                        })}
                                        required
                                        maxLength={100}
                                        placeholder="Enter account name"
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#475569'}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Initial Balance:</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        style={inputStyle}
                                        value={formData.coreDetails.balance}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            coreDetails: { ...formData.coreDetails, balance: parseFloat(e.target.value) || 0 }
                                        })}
                                        required
                                        placeholder="0.00"
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#475569'}
                                    />
                                </div>
                            </div>

                            <div>
                                <h4 style={{
                                    color: '#f8fafc',
                                    marginBottom: '20px',
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    borderBottom: '2px solid #475569',
                                    paddingBottom: '8px'
                                }}>
                                    🧩 Optional Components
                                </h4>

                                <div style={componentCardStyle}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '16px'
                                    }}>
                                        <input
                                            type="checkbox"
                                            style={checkboxStyle}
                                            checked={formData.activeAccount.enabled}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                activeAccount: { ...formData.activeAccount, enabled: e.target.checked }
                                            })}
                                        />
                                        <label style={{ color: '#f8fafc', fontWeight: 600, fontSize: '16px' }}>
                                            🏧 Active Account Component
                                        </label>
                                    </div>
                                    {formData.activeAccount.enabled && (
                                        <input
                                            type="text"
                                            placeholder="IBAN (e.g., TR123456789012345678901234)"
                                            style={inputStyle}
                                            value={formData.activeAccount.iban}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                activeAccount: { ...formData.activeAccount, iban: e.target.value }
                                            })}
                                            maxLength={34}
                                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                            onBlur={(e) => e.target.style.borderColor = '#475569'}
                                        />
                                    )}
                                </div>

                                <div style={componentCardStyle}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '16px'
                                    }}>
                                        <input
                                            type="checkbox"
                                            style={checkboxStyle}
                                            checked={formData.spendingLimit.enabled}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                spendingLimit: { ...formData.spendingLimit, enabled: e.target.checked }
                                            })}
                                        />
                                        <label style={{ color: '#f8fafc', fontWeight: 600, fontSize: '16px' }}>
                                            💸 Spending Limit Component
                                        </label>
                                    </div>
                                    {formData.spendingLimit.enabled && (
                                        <>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="Limit Amount"
                                                style={inputStyle}
                                                value={formData.spendingLimit.limitAmount}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    spendingLimit: { ...formData.spendingLimit, limitAmount: parseFloat(e.target.value) || 0 }
                                                })}
                                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                                onBlur={(e) => e.target.style.borderColor = '#475569'}
                                            />
                                            <select
                                                style={selectStyle}
                                                value={formData.spendingLimit.timeframe}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    spendingLimit: { ...formData.spendingLimit, timeframe: parseInt(e.target.value) }
                                                })}
                                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                                onBlur={(e) => e.target.style.borderColor = '#475569'}
                                            >
                                                {timeframeLabels.map((label, index) => (
                                                    <option key={index} value={index}>{label}</option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                </div>

                                <div style={componentCardStyle}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '16px'
                                    }}>
                                        <input
                                            type="checkbox"
                                            style={checkboxStyle}
                                            checked={formData.savingGoal.enabled}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                savingGoal: { ...formData.savingGoal, enabled: e.target.checked }
                                            })}
                                        />
                                        <label style={{ color: '#f8fafc', fontWeight: 600, fontSize: '16px' }}>
                                            🎯 Saving Goal Component
                                        </label>
                                    </div>
                                    {formData.savingGoal.enabled && (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Goal Name (e.g., Vacation Fund)"
                                                style={inputStyle}
                                                value={formData.savingGoal.goalName}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    savingGoal: { ...formData.savingGoal, goalName: e.target.value }
                                                })}
                                                maxLength={200}
                                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                                onBlur={(e) => e.target.style.borderColor = '#475569'}
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="Target Amount"
                                                style={inputStyle}
                                                value={formData.savingGoal.targetAmount}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    savingGoal: { ...formData.savingGoal, targetAmount: parseFloat(e.target.value) || 0 }
                                                })}
                                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                                onBlur={(e) => e.target.style.borderColor = '#475569'}
                                            />
                                        </>
                                    )}
                                </div>
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
                            {loading ? '⏳ Creating...' : '✅ Create Account'}
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
                            }}>User</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 600,
                                borderRight: '1px solid #64748b'
                            }}>Name</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 600,
                                borderRight: '1px solid #64748b'
                            }}>Balance</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 600,
                                borderRight: '1px solid #64748b'
                            }}>Components</th>
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
                        {accounts.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    color: '#94a3b8',
                                    fontSize: '16px',
                                    fontStyle: 'italic'
                                }}>
                                    🏦 No accounts found. Create your first account!
                                </td>
                            </tr>
                        ) : (
                            accounts.map((account, index) => {
                                const user = users.find(u => u.id === account.userId);
                                const components = [];
                                if (account.coreDetails) components.push('Core');
                                if (account.activeAccount) components.push('Active');
                                if (account.spendingLimit) components.push('Spending');
                                if (account.savingGoal) components.push('Saving');
                                const isEven = index % 2 === 0;

                                return (
                                    <tr key={account.id} style={{
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
                                            {account.id.substring(0, 8)}...
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            borderRight: '1px solid #475569',
                                            color: '#f8fafc'
                                        }}>
                                            {user ? (
                                                <div>
                                                    <span style={{ fontWeight: 500 }}>{user.username}</span>
                                                    {user.isDeleted && (
                                                        <span style={{
                                                            color: '#ef4444',
                                                            fontSize: '11px',
                                                            marginLeft: '4px',
                                                            fontStyle: 'italic',
                                                            backgroundColor: '#7f1d1d',
                                                            padding: '2px 4px',
                                                            borderRadius: '4px'
                                                        }}>
                                                            deleted
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unknown</span>
                                            )}
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            borderRight: '1px solid #475569',
                                            color: '#e2e8f0'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>{account.coreDetails?.name || 'No name'}</span>
                                                {account.isMain && (
                                                    <span style={{
                                                        color: '#3b82f6',
                                                        fontSize: '12px',
                                                        backgroundColor: '#1e3a8a',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontWeight: 500
                                                    }}>
                                                        🌟 Main
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            borderRight: '1px solid #475569'
                                        }}>
                                            {account.coreDetails ? (
                                                <span style={{
                                                    fontWeight: 600,
                                                    fontSize: '15px',
                                                    color: account.coreDetails.balance >= 0 ? '#10b981' : '#ef4444'
                                                }}>
                                                    ${account.coreDetails.balance.toFixed(2)}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>N/A</span>
                                            )}
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            borderRight: '1px solid #475569'
                                        }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {components.map(comp => (
                                                    <span key={comp} style={{
                                                        display: 'inline-block',
                                                        padding: '4px 8px',
                                                        backgroundColor: '#475569',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        color: '#e2e8f0',
                                                        fontWeight: 500
                                                    }}>
                                                        {comp === 'Core' && '🔧'}
                                                        {comp === 'Active' && '🏧'}
                                                        {comp === 'Spending' && '💸'}
                                                        {comp === 'Saving' && '🎯'}
                                                        {comp}
                                                    </span>
                                                ))}
                                            </div>
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
                                                backgroundColor: account.isDeleted ? '#7f1d1d' : '#064e3b',
                                                color: account.isDeleted ? '#fecaca' : '#a7f3d0'
                                            }}>
                                                {account.isDeleted ? '🗑️ Deleted' : '✅ Active'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            {!account.isDeleted && !account.isMain ? (
                                                <button
                                                    style={dangerButtonStyle}
                                                    onClick={() => handleDelete(account.id)}
                                                    disabled={loading}
                                                    onMouseOver={(e) => !loading && ((e.target as HTMLButtonElement).style.backgroundColor = '#dc2626')}
                                                    onMouseOut={(e) => !loading && ((e.target as HTMLButtonElement).style.backgroundColor = '#ef4444')}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            ) : account.isMain ? (
                                                <span style={{
                                                    color: '#94a3b8',
                                                    fontStyle: 'italic',
                                                    fontSize: '12px'
                                                }}>
                                                    🔒 Protected (Main)
                                                </span>
                                            ) : (
                                                <span style={{
                                                    color: '#94a3b8',
                                                    fontStyle: 'italic',
                                                    fontSize: '12px'
                                                }}>
                                                    Already deleted
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
        </div>
    );
}
