import React, { useState } from 'react';
import { Transaction, Account, User } from './DatabaseTester';

interface TransactionManagerProps {
  transactions: Transaction[];
  accounts: Account[];
  users: User[];
  onRefresh: () => void;
}

export function TransactionManager({ transactions, accounts, users, onRefresh }: TransactionManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    sourceType: 0, // 0=ACCOUNT, 1=IBAN, 2=SYSTEM
    sourceUserId: '',
    sourceAccountId: '',
    sourceIban: '',
    sourceName: '',
    destinationType: 0, // 0=ACCOUNT, 1=IBAN, 2=SPEND
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

      // Add source details based on type
      if (formData.sourceType === 0) { // ACCOUNT
        payload.sourceAccountId = formData.sourceAccountId;
      } else if (formData.sourceType === 1) { // IBAN
        payload.sourceIban = formData.sourceIban;
        payload.sourceName = formData.sourceName;
      } else { // SYSTEM
        payload.sourceName = formData.sourceName;
      }

      // Add destination details based on type
      if (formData.destinationType === 0) { // ACCOUNT
        payload.destinationAccountId = formData.destinationAccountId;
      } else if (formData.destinationType === 1) { // IBAN
        payload.destinationIban = formData.destinationIban;
        payload.destinationName = formData.destinationName;
      } else { // SPEND
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

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/transaction/${transactionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('Transaction deleted successfully!');
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

  const getSourceDisplay = (transaction: Transaction) => {
    if (transaction.sourceType === 0) { // ACCOUNT
      const account = accounts.find(a => a.id === transaction.sourceAccountId);
      if (account) {
        const user = users.find(u => u.id === account.userId);
        const userName = user ? user.username : 'Unknown User';
        const accountName = account.coreDetails?.name || 'Unknown Account';
        const balance = account.coreDetails?.balance ? `$${account.coreDetails.balance.toFixed(2)}` : 'No balance';
        return `${userName} - ${accountName} (${balance})`;
      }
      return 'Unknown Account';
    } else if (transaction.sourceType === 1) { // IBAN
      return `${transaction.sourceIban} (${transaction.sourceName || 'External'})`;
    } else { // SYSTEM
      return `System (${transaction.sourceName || 'System Transaction'})`;
    }
  };

  const getDestinationDisplay = (transaction: Transaction) => {
    if (transaction.destinationType === 0) { // ACCOUNT
      const account = accounts.find(a => a.id === transaction.destinationAccountId);
      if (account) {
        const user = users.find(u => u.id === account.userId);
        const userName = user ? user.username : 'Unknown User';
        const accountName = account.coreDetails?.name || 'Unknown Account';
        const balance = account.coreDetails?.balance ? `$${account.coreDetails.balance.toFixed(2)}` : 'No balance';
        return `${userName} - ${accountName} (${balance})`;
      }
      return 'Unknown Account';
    } else if (transaction.destinationType === 1) { // IBAN
      return `${transaction.destinationIban} (${transaction.destinationName || 'External'})`;
    } else { // SPEND
      return `Spending (${transaction.destinationName || 'Purchase'})`;
    }
  };

  // Filter accounts by selected user
  const getFilteredSourceAccounts = () => {
    if (!formData.sourceUserId) return [];
    return accounts.filter(a => !a.isDeleted && a.userId === formData.sourceUserId);
  };

  const getFilteredDestinationAccounts = () => {
    if (!formData.destinationUserId) return [];
    return accounts.filter(a => !a.isDeleted && a.userId === formData.destinationUserId);
  };

  // Reset account selection when user changes
  const handleSourceUserChange = (userId: string) => {
    setFormData({ 
      ...formData, 
      sourceUserId: userId, 
      sourceAccountId: '' // Reset account selection
    });
  };

  const handleDestinationUserChange = (userId: string) => {
    setFormData({ 
      ...formData, 
      destinationUserId: userId, 
      destinationAccountId: '' // Reset account selection
    });
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
        <h2 style={{ margin: 0 }}>Transactions ({transactions.length})</h2>
        <button
          style={{ ...buttonStyle, backgroundColor: '#007bff', color: 'white' }}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Transaction'}
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
          <h3>Create New Transaction</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4>Source</h4>
                <div>
                  <label>Source Type:</label>
                  <select
                    style={inputStyle}
                    value={formData.sourceType}
                    onChange={(e) => setFormData({ ...formData, sourceType: parseInt(e.target.value) })}
                  >
                    {sourceTypeLabels.map((label, index) => (
                      <option key={index} value={index}>{label}</option>
                    ))}
                  </select>
                </div>

                {formData.sourceType === 0 && (
                  <>
                    <div>
                      <label>Source User:</label>
                      <select
                        style={inputStyle}
                        value={formData.sourceUserId}
                        onChange={(e) => handleSourceUserChange(e.target.value)}
                        required
                      >
                        <option value="">Select a user first</option>
                        {users.filter(u => !u.isDeleted).map(user => (
                          <option key={user.id} value={user.id}>
                            {user.username} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Source Account:</label>
                      <select
                        style={inputStyle}
                        value={formData.sourceAccountId}
                        onChange={(e) => setFormData({ ...formData, sourceAccountId: e.target.value })}
                        required
                        disabled={!formData.sourceUserId}
                      >
                        <option value="">
                          {formData.sourceUserId ? 'Select an account' : 'Select a user first'}
                        </option>
                        {getFilteredSourceAccounts().map(account => (
                          <option key={account.id} value={account.id}>
                            {account.coreDetails?.name || 'Unnamed Account'} 
                            {account.coreDetails?.balance !== undefined && ` - $${account.coreDetails.balance.toFixed(2)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {formData.sourceType === 1 && (
                  <>
                    <div>
                      <label>Source IBAN:</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={formData.sourceIban}
                        onChange={(e) => setFormData({ ...formData, sourceIban: e.target.value })}
                        required
                        maxLength={34}
                      />
                    </div>
                    <div>
                      <label>Source Name:</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={formData.sourceName}
                        onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                        maxLength={255}
                      />
                    </div>
                  </>
                )}

                {formData.sourceType === 2 && (
                  <div>
                    <label>Source Name:</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={formData.sourceName}
                      onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                      placeholder="System transaction description"
                      maxLength={255}
                    />
                  </div>
                )}
              </div>

              <div>
                <h4>Destination</h4>
                <div>
                  <label>Destination Type:</label>
                  <select
                    style={inputStyle}
                    value={formData.destinationType}
                    onChange={(e) => setFormData({ ...formData, destinationType: parseInt(e.target.value) })}
                  >
                    {destinationTypeLabels.map((label, index) => (
                      <option key={index} value={index}>{label}</option>
                    ))}
                  </select>
                </div>

                {formData.destinationType === 0 && (
                  <>
                    <div>
                      <label>Destination User:</label>
                      <select
                        style={inputStyle}
                        value={formData.destinationUserId}
                        onChange={(e) => handleDestinationUserChange(e.target.value)}
                        required
                      >
                        <option value="">Select a user first</option>
                        {users.filter(u => !u.isDeleted).map(user => (
                          <option key={user.id} value={user.id}>
                            {user.username} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Destination Account:</label>
                      <select
                        style={inputStyle}
                        value={formData.destinationAccountId}
                        onChange={(e) => setFormData({ ...formData, destinationAccountId: e.target.value })}
                        required
                        disabled={!formData.destinationUserId}
                      >
                        <option value="">
                          {formData.destinationUserId ? 'Select an account' : 'Select a user first'}
                        </option>
                        {getFilteredDestinationAccounts().map(account => (
                          <option key={account.id} value={account.id}>
                            {account.coreDetails?.name || 'Unnamed Account'}
                            {account.coreDetails?.balance !== undefined && ` - $${account.coreDetails.balance.toFixed(2)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {formData.destinationType === 1 && (
                  <>
                    <div>
                      <label>Destination IBAN:</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={formData.destinationIban}
                        onChange={(e) => setFormData({ ...formData, destinationIban: e.target.value })}
                        required
                        maxLength={34}
                      />
                    </div>
                    <div>
                      <label>Destination Name:</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={formData.destinationName}
                        onChange={(e) => setFormData({ ...formData, destinationName: e.target.value })}
                        maxLength={255}
                      />
                    </div>
                  </>
                )}

                {formData.destinationType === 2 && (
                  <div>
                    <label>Destination Name:</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={formData.destinationName}
                      onChange={(e) => setFormData({ ...formData, destinationName: e.target.value })}
                      placeholder="What was purchased"
                      maxLength={255}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h4>Transaction Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                <div>
                  <label>Amount:</label>
                  <input
                    type="number"
                    step="0.01"
                    style={inputStyle}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    required
                    min="0.01"
                  />
                </div>
                <div>
                  <label>Description:</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    maxLength={500}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              style={{ ...buttonStyle, backgroundColor: '#28a745', color: 'white', marginTop: '20px' }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Transaction'}
            </button>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #dee2e6' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Source</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Destination</th>
              <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No transactions found. Create your first transaction!
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6', fontFamily: 'monospace', fontSize: '12px' }}>
                    {transaction.id.substring(0, 8)}...
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                    {getSourceDisplay(transaction)}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                    {getDestinationDisplay(transaction)}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {transaction.description}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {new Date(transaction.timestamp).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: transaction.isDeleted ? '#f8d7da' : '#d4edda',
                      color: transaction.isDeleted ? '#721c24' : '#155724'
                    }}>
                      {transaction.isDeleted ? 'Deleted' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {!transaction.isDeleted && (
                      <button
                        style={{ ...buttonStyle, backgroundColor: '#dc3545', color: 'white' }}
                        onClick={() => handleDelete(transaction.id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
