import React, { useState } from 'react';
import { ArrowRight, Send, CreditCard, Building, User } from 'lucide-react';
import { Card, Button, Dropdown } from '../../shared/ui';
import { useAuth } from '../../../../hooks/useAuth';
import { useUserData } from '../../../../hooks/useUserData';
import { useThemeClasses } from '../../../../contexts/ThemeContext';
import { api } from '../../../../services/api';

export function TransferPayPage() {
    const { user } = useAuth();
    const { accounts, refreshData } = useUserData(user?.id);
    const themeClasses = useThemeClasses();
    const [activeTab, setActiveTab] = useState<'transfer' | 'deposit' | 'withdraw'>('transfer');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Transfer form state
    const [transferData, setTransferData] = useState({
        sourceAccountId: '',
        destinationType: 'account' as 'account' | 'iban',
        destinationAccountId: '',
        destinationIban: '',
        destinationName: '',
        amount: 0,
        description: ''
    });

    // Deposit form state
    const [depositData, setDepositData] = useState({
        accountId: '',
        sourceIban: '',
        sourceName: '',
        amount: 0,
        description: ''
    });

    // Withdraw form state
    const [withdrawData, setWithdrawData] = useState({
        accountId: '',
        destinationIban: '',
        destinationName: '',
        amount: 0,
        description: ''
    });

    const activeAccounts = accounts.filter(a => !a.isDeleted);

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const payload: any = {
                sourceType: 0, // Account
                sourceAccountId: transferData.sourceAccountId,
                amount: transferData.amount,
                description: transferData.description
            };

            if (transferData.destinationType === 'account') {
                payload.destinationType = 0; // Account
                payload.destinationAccountId = transferData.destinationAccountId;
            } else {
                payload.destinationType = 1; // IBAN
                payload.destinationIban = transferData.destinationIban;
                payload.destinationName = transferData.destinationName;
            }

            await api.transaction.createTransaction(payload);
            setMessage('Transfer completed successfully!');
            setTransferData({
                sourceAccountId: '',
                destinationType: 'account',
                destinationAccountId: '',
                destinationIban: '',
                destinationName: '',
                amount: 0,
                description: ''
            });
            await refreshData();
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : 'Transfer failed'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const payload = {
                sourceType: 1, // IBAN
                sourceIban: depositData.sourceIban,
                sourceName: depositData.sourceName,
                destinationType: 0, // Account
                destinationAccountId: depositData.accountId,
                amount: depositData.amount,
                description: depositData.description
            };

            await api.transaction.createTransaction(payload);
            setMessage('Deposit completed successfully!');
            setDepositData({
                accountId: '',
                sourceIban: '',
                sourceName: '',
                amount: 0,
                description: ''
            });
            await refreshData();
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : 'Deposit failed'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const payload = {
                sourceType: 0, // Account
                sourceAccountId: withdrawData.accountId,
                destinationType: 1, // IBAN
                destinationIban: withdrawData.destinationIban,
                destinationName: withdrawData.destinationName,
                amount: withdrawData.amount,
                description: withdrawData.description
            };

            await api.transaction.createTransaction(payload);
            setMessage('Withdrawal completed successfully!');
            setWithdrawData({
                accountId: '',
                destinationIban: '',
                destinationName: '',
                amount: 0,
                description: ''
            });
            await refreshData();
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : 'Withdrawal failed'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const accountOptions = activeAccounts.map(account => ({
        value: account.id,
        label: `${account.coreDetails?.name || 'Unnamed Account'} - $${(account.coreDetails?.balance || 0).toFixed(2)}`
    }));

    const getAvailableBalance = (accountId: string) => {
        const account = activeAccounts.find(a => a.id === accountId);
        return account?.coreDetails?.balance || 0;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className={`text-3xl font-bold ${themeClasses.text.primary}`}>Transfer & Pay</h1>
                <p className={`${themeClasses.text.secondary} mt-1`}>Send money, deposit funds, or withdraw to external accounts</p>
            </div>

            {/* Tabs */}
            <div className={`flex space-x-1 ${themeClasses.bg.tertiary} p-1 rounded-lg`}>
                <button
                    onClick={() => setActiveTab('transfer')}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'transfer'
                            ? `${themeClasses.bg.card} ${themeClasses.brand.primary} ${themeClasses.shadow.sm}`
                            : `${themeClasses.text.secondary} ${themeClasses.bg.hover}`
                        }`}
                >
                    <ArrowRight size={16} className="mr-2" />
                    Transfer
                </button>
                <button
                    onClick={() => setActiveTab('deposit')}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'deposit'
                            ? `${themeClasses.bg.card} ${themeClasses.amount.positive} ${themeClasses.shadow.sm}`
                            : `${themeClasses.text.secondary} ${themeClasses.bg.hover}`
                        }`}
                >
                    <CreditCard size={16} className="mr-2" />
                    Deposit
                </button>
                <button
                    onClick={() => setActiveTab('withdraw')}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'withdraw'
                            ? `${themeClasses.bg.card} ${themeClasses.amount.negative} ${themeClasses.shadow.sm}`
                            : `${themeClasses.text.secondary} ${themeClasses.bg.hover}`
                        }`}
                >
                    <Building size={16} className="mr-2" />
                    Withdraw
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-md text-sm ${message.includes('Error')
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                    {message}
                </div>
            )}

            {/* Transfer Tab */}
            {activeTab === 'transfer' && (
                <Card title="Transfer Money">
                    <form onSubmit={handleTransfer} className="space-y-4">
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                From Account
                            </label>
                            <Dropdown
                                options={accountOptions}
                                value={transferData.sourceAccountId}
                                onChange={(value) => setTransferData({ ...transferData, sourceAccountId: value })}
                                className="w-full"
                                placeholder="Select source account"
                            />
                            {transferData.sourceAccountId && (
                                <p className={`text-xs ${themeClasses.text.tertiary} mt-1`}>
                                    Available: ${getAvailableBalance(transferData.sourceAccountId).toFixed(2)}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                To
                            </label>
                            <div className="flex space-x-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => setTransferData({ ...transferData, destinationType: 'account' })}
                                    className={`px-3 py-1 text-xs rounded ${transferData.destinationType === 'account'
                                            ? `${themeClasses.button.primary} text-white`
                                            : `${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`
                                        }`}
                                >
                                    My Account
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTransferData({ ...transferData, destinationType: 'iban' })}
                                    className={`px-3 py-1 text-xs rounded ${transferData.destinationType === 'iban'
                                            ? `${themeClasses.button.primary} text-white`
                                            : `${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`
                                        }`}
                                >
                                    External Account
                                </button>
                            </div>

                            {transferData.destinationType === 'account' ? (
                                <Dropdown
                                    options={accountOptions.filter(opt => opt.value !== transferData.sourceAccountId)}
                                    value={transferData.destinationAccountId}
                                    onChange={(value) => setTransferData({ ...transferData, destinationAccountId: value })}
                                    className="w-full"
                                    placeholder="Select destination account"
                                />
                            ) : (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={transferData.destinationIban}
                                        onChange={(e) => setTransferData({ ...transferData, destinationIban: e.target.value })}
                                        className={`w-full px-3 py-2 ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                        placeholder="IBAN (e.g., GB29 NWBK 6016 1331 9268 19)"
                                        maxLength={34}
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={transferData.destinationName}
                                        onChange={(e) => setTransferData({ ...transferData, destinationName: e.target.value })}
                                        className={`w-full px-3 py-2 ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                        placeholder="Recipient name"
                                        maxLength={255}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                Amount
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={transferData.amount}
                                onChange={(e) => setTransferData({ ...transferData, amount: parseFloat(e.target.value) || 0 })}
                                className={`w-full px-3 py-2 ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                placeholder="0.00"
                                min="0.01"
                                required
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                Description
                            </label>
                            <input
                                type="text"
                                value={transferData.description}
                                onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                                className={`w-full px-3 py-2 ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                placeholder="What's this transfer for?"
                                maxLength={500}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading}
                            icon={<Send size={16} />}
                        >
                            {isLoading ? 'Processing...' : 'Send Transfer'}
                        </Button>
                    </form>
                </Card>
            )}

            {/* Deposit Tab */}
            {activeTab === 'deposit' && (
                <Card title="Deposit Funds">
                    <form onSubmit={handleDeposit} className="space-y-4">
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                To Account
                            </label>
                            <Dropdown
                                options={accountOptions}
                                value={depositData.accountId}
                                onChange={(value) => setDepositData({ ...depositData, accountId: value })}
                                className="w-full"
                                placeholder="Select account to deposit to"
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                From External Account (IBAN)
                            </label>
                            <input
                                type="text"
                                value={depositData.sourceIban}
                                onChange={(e) => setDepositData({ ...depositData, sourceIban: e.target.value })}
                                className={`w-full px-3 py-2 ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                placeholder="IBAN (e.g., GB29 NWBK 6016 1331 9268 19)"
                                maxLength={34}
                                required
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                Source Name
                            </label>
                            <input
                                type="text"
                                value={depositData.sourceName}
                                onChange={(e) => setDepositData({ ...depositData, sourceName: e.target.value })}
                                className={`w-full px-3 py-2 ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                placeholder="Source account name"
                                maxLength={255}
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                Amount
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={depositData.amount}
                                onChange={(e) => setDepositData({ ...depositData, amount: parseFloat(e.target.value) || 0 })}
                                className={`w-full px-3 py-2 ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                placeholder="0.00"
                                min="0.01"
                                required
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                Description
                            </label>
                            <input
                                type="text"
                                value={depositData.description}
                                onChange={(e) => setDepositData({ ...depositData, description: e.target.value })}
                                className={`w-full px-3 py-2 ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                placeholder="What's this deposit for?"
                                maxLength={500}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="success"
                            disabled={isLoading}
                            icon={<CreditCard size={16} />}
                        >
                            {isLoading ? 'Processing...' : 'Deposit Funds'}
                        </Button>
                    </form>
                </Card>
            )}

            {/* Withdraw Tab */}
            {activeTab === 'withdraw' && (
                <Card title="Withdraw Funds">
                    <form onSubmit={handleWithdraw} className="space-y-4">
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                From Account
                            </label>
                            <Dropdown
                                options={accountOptions}
                                value={withdrawData.accountId}
                                onChange={(value) => setWithdrawData({ ...withdrawData, accountId: value })}
                                className="w-full"
                                placeholder="Select account to withdraw from"
                            />
                            {withdrawData.accountId && (
                                <p className={`text-xs ${themeClasses.text.tertiary} mt-1`}>
                                    Available: ${getAvailableBalance(withdrawData.accountId).toFixed(2)}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                To External Account (IBAN)
                            </label>
                            <input
                                type="text"
                                value={withdrawData.destinationIban}
                                onChange={(e) => setWithdrawData({ ...withdrawData, destinationIban: e.target.value })}
                                className={`w-full px-3 py-2 ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                placeholder="IBAN (e.g., GB29 NWBK 6016 1331 9268 19)"
                                maxLength={34}
                                required
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                Recipient Name
                            </label>
                            <input
                                type="text"
                                value={withdrawData.destinationName}
                                onChange={(e) => setWithdrawData({ ...withdrawData, destinationName: e.target.value })}
                                className={`w-full px-3 py-2 ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                placeholder="Recipient account name"
                                maxLength={255}
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                Amount
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={withdrawData.amount}
                                onChange={(e) => setWithdrawData({ ...withdrawData, amount: parseFloat(e.target.value) || 0 })}
                                className={`w-full px-3 py-2 ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                placeholder="0.00"
                                min="0.01"
                                required
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                Description
                            </label>
                            <input
                                type="text"
                                value={withdrawData.description}
                                onChange={(e) => setWithdrawData({ ...withdrawData, description: e.target.value })}
                                className={`w-full px-3 py-2 ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                placeholder="What's this withdrawal for?"
                                maxLength={500}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="danger"
                            disabled={isLoading}
                            icon={<Building size={16} />}
                        >
                            {isLoading ? 'Processing...' : 'Withdraw Funds'}
                        </Button>
                    </form>
                </Card>
            )}

            {/* Quick Stats */}
            {activeAccounts.length > 0 && (
                <Card title="Account Overview">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${themeClasses.text.primary}`}>
                                {activeAccounts.length}
                            </div>
                            <div className={`text-sm ${themeClasses.text.secondary}`}>Active Accounts</div>
                        </div>

                        <div className="text-center">
                            <div className={`text-2xl font-bold ${themeClasses.amount.positive}`}>
                                ${activeAccounts.reduce((sum, acc) => sum + (acc.coreDetails?.balance || 0), 0).toFixed(2)}
                            </div>
                            <div className={`text-sm ${themeClasses.text.secondary}`}>Total Balance</div>
                        </div>

                        <div className="text-center">
                            <div className={`text-2xl font-bold ${themeClasses.brand.primary}`}>
                                {activeAccounts.filter(acc => acc.activeAccount).length}
                            </div>
                            <div className={`text-sm ${themeClasses.text.secondary}`}>IBAN Enabled</div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
