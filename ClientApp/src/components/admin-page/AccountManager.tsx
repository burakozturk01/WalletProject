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

  const checkboxStyle = {
    margin: '4px 8px 4px 0'
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>Accounts & Components ({accounts.length})</h2>
        <button
          style={{ ...buttonStyle, backgroundColor: '#007bff', color: 'white' }}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Account'}
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
          <h3>Create New Account (ECS Architecture)</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4>Account Entity</h4>
                <div>
                  <label>User:</label>
                  <select
                    style={inputStyle}
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    required
                  >
                    <option value="">Select a user</option>
                    {users.filter(u => !u.isDeleted).map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      style={checkboxStyle}
                      checked={formData.isMain}
                      onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                    />
                    Main Account
                  </label>
                </div>

                <h4>Core Details Component (Required)</h4>
                <div>
                  <label>Account Name:</label>
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
                  />
                </div>
                <div>
                  <label>Balance:</label>
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
                  />
                </div>
              </div>

              <div>
                <h4>Optional Components</h4>
                
                <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <label>
                    <input
                      type="checkbox"
                      style={checkboxStyle}
                      checked={formData.activeAccount.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        activeAccount: { ...formData.activeAccount, enabled: e.target.checked }
                      })}
                    />
                    <strong>Active Account Component</strong>
                  </label>
                  {formData.activeAccount.enabled && (
                    <input
                      type="text"
                      placeholder="IBAN"
                      style={inputStyle}
                      value={formData.activeAccount.iban}
                      onChange={(e) => setFormData({
                        ...formData,
                        activeAccount: { ...formData.activeAccount, iban: e.target.value }
                      })}
                      maxLength={34}
                    />
                  )}
                </div>

                <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <label>
                    <input
                      type="checkbox"
                      style={checkboxStyle}
                      checked={formData.spendingLimit.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        spendingLimit: { ...formData.spendingLimit, enabled: e.target.checked }
                      })}
                    />
                    <strong>Spending Limit Component</strong>
                  </label>
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
                      />
                      <select
                        style={inputStyle}
                        value={formData.spendingLimit.timeframe}
                        onChange={(e) => setFormData({
                          ...formData,
                          spendingLimit: { ...formData.spendingLimit, timeframe: parseInt(e.target.value) }
                        })}
                      >
                        {timeframeLabels.map((label, index) => (
                          <option key={index} value={index}>{label}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <label>
                    <input
                      type="checkbox"
                      style={checkboxStyle}
                      checked={formData.savingGoal.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        savingGoal: { ...formData.savingGoal, enabled: e.target.checked }
                      })}
                    />
                    <strong>Saving Goal Component</strong>
                  </label>
                  {formData.savingGoal.enabled && (
                    <>
                      <input
                        type="text"
                        placeholder="Goal Name"
                        style={inputStyle}
                        value={formData.savingGoal.goalName}
                        onChange={(e) => setFormData({
                          ...formData,
                          savingGoal: { ...formData.savingGoal, goalName: e.target.value }
                        })}
                        maxLength={200}
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
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              style={{ ...buttonStyle, backgroundColor: '#28a745', color: 'white' }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #dee2e6' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>User</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Balance</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Components</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No accounts found. Create your first account!
                </td>
              </tr>
            ) : (
              accounts.map((account) => {
                const user = users.find(u => u.id === account.userId);
                const components = [];
                if (account.coreDetails) components.push('Core');
                if (account.activeAccount) components.push('Active');
                if (account.spendingLimit) components.push('Spending');
                if (account.savingGoal) components.push('Saving');

                return (
                  <tr key={account.id}>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', fontFamily: 'monospace', fontSize: '12px' }}>
                      {account.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {user ? (
                        <span>
                          {user.username}
                          {user.isDeleted && (
                            <span style={{ 
                              color: '#dc3545', 
                              fontSize: '11px', 
                              marginLeft: '4px',
                              fontStyle: 'italic'
                            }}>
                              (deleted)
                            </span>
                          )}
                        </span>
                      ) : 'Unknown'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {account.coreDetails?.name || 'No name'}
                      {account.isMain && <span style={{ color: '#007bff', fontSize: '12px' }}> (Default)</span>}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {account.coreDetails ? `$${account.coreDetails.balance.toFixed(2)}` : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {components.map(comp => (
                        <span key={comp} style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          margin: '1px',
                          backgroundColor: '#e9ecef',
                          borderRadius: '3px',
                          fontSize: '11px'
                        }}>
                          {comp}
                        </span>
                      ))}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: account.isDeleted ? '#f8d7da' : '#d4edda',
                        color: account.isDeleted ? '#721c24' : '#155724'
                      }}>
                        {account.isDeleted ? 'Deleted' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {!account.isDeleted && !account.isMain && (
                        <button
                          style={{ ...buttonStyle, backgroundColor: '#dc3545', color: 'white' }}
                          onClick={() => handleDelete(account.id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
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
