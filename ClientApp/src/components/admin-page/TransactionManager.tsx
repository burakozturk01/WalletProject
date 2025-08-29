import React, { useState } from 'react';
import { Transaction, Account, User } from './AdminPage';
import { useTimezone } from '../../hooks/useTimezone';

interface TransactionManagerProps {
  transactions: Transaction[];
  accounts: Account[];
  users: User[];
  onRefresh: () => void;
}

export function TransactionManager({ transactions, accounts, users, onRefresh }: TransactionManagerProps) {
  const { formatDate } = useTimezone();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    sourceType: 0, 
    sourceUserId: '',
    sourceAccountId: '',
    sourceIban: '',
    sourceName: '',
    destinationType: 0, 
    destinationUserId: '',
    destinationAccountId: '',
    destinationIban: '',
    destinationName: '',
    amount: 0,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sourceTypeLabels = ['Account', 'IBAN', 'System'];
  const destinationTypeLabels = ['Account', 'IBAN', 'Spend'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload: any = {
        sourceType: formData.sourceType,
        destinationType: formData.destinationType,
        amount: formData.amount,
        description: formData.description
      };

      if (formData.sourceType === 0) { 
        payload.sourceAccountId = formData.sourceAccountId;
      } else if (formData.sourceType === 1) { 
        payload.sourceIban = formData.sourceIban;
        payload.sourceName = formData.sourceName;
      } else { 
        payload.sourceName = formData.sourceName;
      }

      if (formData.destinationType === 0) { 
        payload.destinationAccountId = formData.destinationAccountId;
      } else if (formData.destinationType === 1) { 
        payload.destinationIban = formData.destinationIban;
        payload.destinationName = formData.destinationName;
      } else { 
        payload.destinationName = formData.destinationName;
      }

      const response = await fetch('/api/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage('Transaction created successfully!');
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
      sourceType: 0,
      sourceUserId: '',
      sourceAccountId: '',
      sourceIban: '',
      sourceName: '',
      destinationType: 0,
      destinationUserId: '',
      destinationAccountId: '',
      destinationIban: '',
      destinationName: '',
      amount: 0,
      description: ''
    });
  };

  const getSourceDisplay = (transaction: Transaction) => {
    if (transaction.sourceType === 0) { 
      const account = accounts.find(a => a.id === transaction.sourceAccountId);
      if (account) {
        const user = users.find(u => u.id === account.userId);
        const userName = user ? `${user.username}${user.isDeleted ? ' (deleted)' : ''}` : 'Unknown User';
        const accountName = account.coreDetails?.name || 'Unknown Account';
        const accountStatus = account.isDeleted ? ' (deleted)' : '';
        
        let balanceInfo = '';
        if (transaction.sourceAccountBalanceBefore !== undefined) {
          const balanceBefore = transaction.sourceAccountBalanceBefore;
          const balanceAfter = balanceBefore - transaction.amount;
          balanceInfo = ` ($${balanceBefore.toFixed(2)} → $${balanceAfter.toFixed(2)})`;
        }
        
        return `${userName} - ${accountName}${balanceInfo}${accountStatus}`;
      }
      return 'Unknown Account';
    } else if (transaction.sourceType === 1) { 
      return `${transaction.sourceIban} (${transaction.sourceName || 'External'})`;
    } else { 
      return `System (${transaction.sourceName || 'System Transaction'})`;
    }
  };

  const getDestinationDisplay = (transaction: Transaction) => {
    if (transaction.destinationType === 0) { 
      const account = accounts.find(a => a.id === transaction.destinationAccountId);
      if (account) {
        const user = users.find(u => u.id === account.userId);
        const userName = user ? `${user.username}${user.isDeleted ? ' (deleted)' : ''}` : 'Unknown User';
        const accountName = account.coreDetails?.name || 'Unknown Account';
        const accountStatus = account.isDeleted ? ' (deleted)' : '';
        
        let balanceInfo = '';
        if (transaction.destinationAccountBalanceBefore !== undefined) {
          const balanceBefore = transaction.destinationAccountBalanceBefore;
          const balanceAfter = balanceBefore + transaction.amount;
          balanceInfo = ` ($${balanceBefore.toFixed(2)} → $${balanceAfter.toFixed(2)})`;
        }
        
        return `${userName} - ${accountName}${balanceInfo}${accountStatus}`;
      }
      return 'Unknown Account';
    } else if (transaction.destinationType === 1) { 
      return `${transaction.destinationIban} (${transaction.destinationName || 'External'})`;
    } else { 
      return `Spending (${transaction.destinationName || 'Purchase'})`;
    }
  };

  const getFilteredSourceAccounts = () => {
    if (!formData.sourceUserId) return [];
    return accounts.filter(a => !a.isDeleted && a.userId === formData.sourceUserId);
  };

  const getFilteredDestinationAccounts = () => {
    if (!formData.destinationUserId) return [];
    return accounts.filter(a => !a.isDeleted && a.userId === formData.destinationUserId);
  };

  const handleSourceUserChange = (userId: string) => {
    setFormData({ 
      ...formData, 
      sourceUserId: userId, 
      sourceAccountId: '' 
    });
  };

  const handleDestinationUserChange = (userId: string) => {
    setFormData({ 
      ...formData, 
      destinationUserId: userId, 
      destinationAccountId: '' 
    });
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

  const sectionStyle: React.CSSProperties = {
    padding: '24px',
    backgroundColor: '#3f4b5f',
    borderRadius: '12px',
    border: '1px solid #475569'
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
          💳 Transactions ({transactions.length})
        </h2>
        <button
          style={primaryButtonStyle}
          onClick={() => setShowCreateForm(!showCreateForm)}
          onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6'}
        >
          {showCreateForm ? '✕ Cancel' : '➕ Create Transaction'}
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
            💸 Create New Transaction
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div style={sectionStyle}>
                <h4 style={{ 
                  color: '#f8fafc', 
                  marginBottom: '20px',
                  fontSize: '18px',
                  fontWeight: 600,
                  borderBottom: '2px solid #475569',
                  paddingBottom: '8px'
                }}>
                  📤 Source
                </h4>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Source Type:</label>
                  <select
                    style={selectStyle}
                    value={formData.sourceType}
                    onChange={(e) => setFormData({ ...formData, sourceType: parseInt(e.target.value) })}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#475569'}
                  >
                    {sourceTypeLabels.map((label, index) => (
                      <option key={index} value={index}>
                        {index === 0 && '🏦 '}{index === 1 && '🏧 '}{index === 2 && '⚙️ '}{label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.sourceType === 0 && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Source User:</label>
                      <select
                        style={selectStyle}
                        value={formData.sourceUserId}
                        onChange={(e) => handleSourceUserChange(e.target.value)}
                        required
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#475569'}
                      >
                        <option value="">Select a user first</option>
                        {users.filter(u => !u.isDeleted).map(user => (
                          <option key={user.id} value={user.id}>
                            👤 {user.username} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Source Account:</label>
                      <select
                        style={selectStyle}
                        value={formData.sourceAccountId}
                        onChange={(e) => setFormData({ ...formData, sourceAccountId: e.target.value })}
                        required
                        disabled={!formData.sourceUserId}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#475569'}
                      >
                        <option value="">
                          {formData.sourceUserId ? 'Select an account' : 'Select a user first'}
                        </option>
                        {getFilteredSourceAccounts().map(account => (
                          <option key={account.id} value={account.id}>
                            🏦 {account.coreDetails?.name || 'Unnamed Account'} 
                            {account.coreDetails?.balance !== undefined && ` - $${account.coreDetails.balance.toFixed(2)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {formData.sourceType === 1 && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Source IBAN:</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={formData.sourceIban}
                        onChange={(e) => setFormData({ ...formData, sourceIban: e.target.value })}
                        required
                        maxLength={34}
                        placeholder="TR123456789012345678901234"
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#475569'}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Source Name:</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={formData.sourceName}
                        onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                        maxLength={255}
                        placeholder="External bank name"
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#475569'}
                      />
                    </div>
                  </>
                )}

                {formData.sourceType === 2 && (
                  <div>
                    <label style={labelStyle}>Source Name:</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={formData.sourceName}
                      onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                      placeholder="System transaction description"
                      maxLength={255}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#475569'}
                    />
                  </div>
                )}
              </div>

              <div style={sectionStyle}>
                <h4 style={{ 
                  color: '#f8fafc', 
                  marginBottom: '20px',
                  fontSize: '18px',
                  fontWeight: 600,
                  borderBottom: '2px solid #475569',
                  paddingBottom: '8px'
                }}>
                  📥 Destination
                </h4>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Destination Type:</label>
                  <select
                    style={selectStyle}
                    value={formData.destinationType}
                    onChange={(e) => setFormData({ ...formData, destinationType: parseInt(e.target.value) })}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#475569'}
                  >
                    {destinationTypeLabels.map((label, index) => (
                      <option key={index} value={index}>
                        {index === 0 && '🏦 '}{index === 1 && '🏧 '}{index === 2 && '🛒 '}{label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.destinationType === 0 && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Destination User:</label>
                      <select
                        style={selectStyle}
                        value={formData.destinationUserId}
                        onChange={(e) => handleDestinationUserChange(e.target.value)}
                        required
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#475569'}
                      >
                        <option value="">Select a user first</option>
                        {users.filter(u => !u.isDeleted).map(user => (
                          <option key={user.id} value={user.id}>
                            👤 {user.username} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Destination Account:</label>
                      <select
                        style={selectStyle}
                        value={formData.destinationAccountId}
                        onChange={(e) => setFormData({ ...formData, destinationAccountId: e.target.value })}
                        required
                        disabled={!formData.destinationUserId}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#475569'}
                      >
                        <option value="">
                          {formData.destinationUserId ? 'Select an account' : 'Select a user first'}
                        </option>
                        {getFilteredDestinationAccounts().map(account => (
                          <option key={account.id} value={account.id}>
                            🏦 {account.coreDetails?.name || 'Unnamed Account'}
                            {account.coreDetails?.balance !== undefined && ` - $${account.coreDetails.balance.toFixed(2)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {formData.destinationType === 1 && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Destination IBAN:</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={formData.destinationIban}
                        onChange={(e) => setFormData({ ...formData, destinationIban: e.target.value })}
                        required
                        maxLength={34}
                        placeholder="TR123456789012345678901234"
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#475569'}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Destination Name:</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={formData.destinationName}
                        onChange={(e) => setFormData({ ...formData, destinationName: e.target.value })}
                        maxLength={255}
                        placeholder="External bank name"
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#475569'}
                      />
                    </div>
                  </>
                )}

                {formData.destinationType === 2 && (
                  <div>
                    <label style={labelStyle}>Destination Name:</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={formData.destinationName}
                      onChange={(e) => setFormData({ ...formData, destinationName: e.target.value })}
                      placeholder="What was purchased"
                      maxLength={255}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#475569'}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ 
              marginTop: '32px',
              padding: '24px',
              backgroundColor: '#3f4b5f',
              borderRadius: '12px',
              border: '1px solid #475569'
            }}>
              <h4 style={{ 
                color: '#f8fafc', 
                marginBottom: '20px',
                fontSize: '18px',
                fontWeight: 600,
                borderBottom: '2px solid #475569',
                paddingBottom: '8px'
              }}>
                💰 Transaction Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Amount:</label>
                  <input
                    type="number"
                    step="0.01"
                    style={inputStyle}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    required
                    min="0.01"
                    placeholder="0.00"
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#475569'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Description:</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    maxLength={500}
                    placeholder="Transaction description"
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#475569'}
                  />
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
              {loading ? '⏳ Creating...' : '✅ Create Transaction'}
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
              }}>Source</th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'left', 
                color: '#f8fafc',
                fontSize: '14px',
                fontWeight: 600,
                borderRight: '1px solid #64748b'
              }}>Destination</th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'right', 
                color: '#f8fafc',
                fontSize: '14px',
                fontWeight: 600,
                borderRight: '1px solid #64748b'
              }}>Amount</th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'left', 
                color: '#f8fafc',
                fontSize: '14px',
                fontWeight: 600,
                borderRight: '1px solid #64748b'
              }}>Description</th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'left', 
                color: '#f8fafc',
                fontSize: '14px',
                fontWeight: 600
              }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ 
                  padding: '40px 20px', 
                  textAlign: 'center', 
                  color: '#94a3b8',
                  fontSize: '16px',
                  fontStyle: 'italic'
                }}>
                  💳 No transactions found. Create your first transaction!
                </td>
              </tr>
            ) : (
              transactions.map((transaction, index) => {
                const isEven = index % 2 === 0;
                return (
                  <tr key={transaction.id} style={{
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
                      {transaction.id.substring(0, 8)}...
                    </td>
                    <td style={{ 
                      padding: '16px 20px', 
                      borderRight: '1px solid #475569',
                      fontSize: '13px',
                      color: '#e2e8f0',
                      maxWidth: '200px',
                      wordWrap: 'break-word'
                    }}>
                      {getSourceDisplay(transaction)}
                    </td>
                    <td style={{ 
                      padding: '16px 20px', 
                      borderRight: '1px solid #475569',
                      fontSize: '13px',
                      color: '#e2e8f0',
                      maxWidth: '200px',
                      wordWrap: 'break-word'
                    }}>
                      {getDestinationDisplay(transaction)}
                    </td>
                    <td style={{ 
                      padding: '16px 20px', 
                      borderRight: '1px solid #475569',
                      textAlign: 'right', 
                      fontWeight: 600,
                      fontSize: '15px',
                      color: '#10b981'
                    }}>
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '16px 20px', 
                      borderRight: '1px solid #475569',
                      color: '#f8fafc',
                      maxWidth: '150px',
                      wordWrap: 'break-word'
                    }}>
                      {transaction.description}
                    </td>
                    <td style={{ 
                      padding: '16px 20px',
                      color: '#e2e8f0',
                      fontSize: '13px'
                    }}>
                      {formatDate(transaction.timestamp)}
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
