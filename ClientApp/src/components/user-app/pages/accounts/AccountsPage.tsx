import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Calendar, CreditCard } from 'lucide-react';
import { Card, Button } from '../../shared/ui';
import { useAuth } from '../../../../hooks/useAuth';
import { useUserData } from '../../../../hooks/useUserData';
import { useTimezone } from '../../../../hooks/useTimezone';
import { useThemeClasses } from '../../../../contexts/ThemeContext';
import { api } from '../../../../services/api';

export function AccountsPage() {
    const { user } = useAuth();
    const { accounts, totalBalance, isLoading, error, refreshData } = useUserData(user?.id);
    const { formatDate } = useTimezone();
    const themeClasses = useThemeClasses();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showBalances, setShowBalances] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        iban: '',
        enableActiveAccount: false
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formMessage, setFormMessage] = useState('');

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;

        setFormLoading(true);
        setFormMessage('');

        try {
            const payload: any = {
                userId: user.id,
                isMain: false,
                coreDetails: {
                    name: formData.name,
                    balance: 0.00
                }
            };

            if (formData.enableActiveAccount && formData.iban) {
                payload.activeAccount = {
                    iban: formData.iban
                };
            }

            await api.account.createAccount(payload);
            setFormMessage('Account created successfully!');
            setFormData({ name: '', iban: '', enableActiveAccount: false });
            setShowCreateForm(false);
            await refreshData();
        } catch (error) {
            setFormMessage(`Error: ${error instanceof Error ? error.message : 'Failed to create account'}`);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteAccount = async (accountId: string, accountName: string) => {
        if (!confirm(`Are you sure you want to delete "${accountName}"?`)) return;

        try {
            await api.account.deleteAccount(accountId);
            await refreshData();
        } catch (error) {
            alert(`Error deleting account: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="text-center text-gray-500">Loading accounts...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="text-center text-red-500">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-3xl font-bold ${themeClasses.text.primary}`}>My Accounts</h1>
                    <p className={`${themeClasses.text.secondary} mt-1`}>
                        Manage your {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        icon={showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
                        onClick={() => setShowBalances(!showBalances)}
                    >
                        {showBalances ? 'Hide' : 'Show'} Balances
                    </Button>
                    <Button
                        variant="primary"
                        icon={<Plus size={16} />}
                        onClick={() => setShowCreateForm(true)}
                    >
                        Create Account
                    </Button>
                </div>
            </div>

            {/* Total Balance Card */}
            <Card title="Total Balance">
                <div className={`text-4xl font-bold ${themeClasses.amount.positive}`}>
                    {showBalances
                        ? `$${(totalBalance?.totalBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '••••••'
                    }
                </div>
                <div className={`text-sm ${themeClasses.text.secondary} mt-2`}>
                    {totalBalance?.activeAccountCount || 0} active accounts • {totalBalance?.accountCount || 0} total accounts
                </div>
            </Card>

            {/* Create Account Form */}
            {showCreateForm && (
                <Card title="Create New Account">
                    <form onSubmit={handleCreateAccount} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Savings Account"
                                required
                                maxLength={100}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="enableActiveAccount"
                                checked={formData.enableActiveAccount}
                                onChange={(e) => setFormData({ ...formData, enableActiveAccount: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="enableActiveAccount" className="text-sm font-medium text-gray-700">
                                Enable Active Account (IBAN)
                            </label>
                        </div>

                        {formData.enableActiveAccount && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    IBAN
                                </label>
                                <input
                                    type="text"
                                    value={formData.iban}
                                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., GB29 NWBK 6016 1331 9268 19"
                                    maxLength={34}
                                />
                            </div>
                        )}

                        {formMessage && (
                            <div className={`p-3 rounded-md text-sm ${formMessage.includes('Error')
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-green-50 text-green-700 border border-green-200'
                                }`}>
                                {formMessage}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={formLoading}
                            >
                                {formLoading ? 'Creating...' : 'Create Account'}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setFormMessage('');
                                    setFormData({ name: '', iban: '', enableActiveAccount: false });
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Accounts List */}
            <div className="grid gap-4">
                {accounts.length === 0 ? (
                    <Card>
                        <div className={`text-center py-8 ${themeClasses.text.secondary}`}>
                            <CreditCard size={48} className={`mx-auto mb-3 ${themeClasses.text.muted}`} />
                            <p className="text-lg font-medium">No accounts yet</p>
                            <p className="text-sm">Create your first account to get started</p>
                        </div>
                    </Card>
                ) : (
                    accounts.map((account) => (
                        <Card key={account.id}>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCard size={20} className={themeClasses.brand.primary} />
                                        <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
                                            {account.coreDetails?.name || 'Unnamed Account'}
                                        </h3>
                                        {account.isMain && (
                                            <span className={`px-2 py-1 text-xs font-medium ${themeClasses.button.primary} rounded-full`}>
                                                Main
                                            </span>
                                        )}
                                        {account.isDeleted && (
                                            <span className={`px-2 py-1 text-xs font-medium ${themeClasses.alert.error} rounded-full`}>
                                                Deleted
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm ${themeClasses.text.secondary}`}>Balance:</span>
                                            <span className={`text-lg font-bold ${themeClasses.amount.positive}`}>
                                                {showBalances
                                                    ? `$${(account.coreDetails?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                    : '••••••'
                                                }
                                            </span>
                                        </div>

                                        {account.activeAccount && (
                                            <div className="flex justify-between items-center">
                                                <span className={`text-sm ${themeClasses.text.secondary}`}>IBAN:</span>
                                                <span className={`text-sm font-mono ${themeClasses.text.primary}`}>
                                                    {account.activeAccount.iban}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm ${themeClasses.text.secondary}`}>Created:</span>
                                            <span className={`text-sm ${themeClasses.text.primary}`}>
                                                {formatDate(account.createdAt)}
                                            </span>
                                        </div>

                                        {/* Components */}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {account.coreDetails && (
                                                <span className={`px-2 py-1 text-xs ${themeClasses.bg.tertiary} ${themeClasses.text.secondary} rounded`}>
                                                    Core Details
                                                </span>
                                            )}
                                            {account.activeAccount && (
                                                <span className={`px-2 py-1 text-xs ${themeClasses.alert.success} rounded`}>
                                                    Active Account
                                                </span>
                                            )}
                                            {account.spendingLimit && (
                                                <span className={`px-2 py-1 text-xs ${themeClasses.alert.warning} rounded`}>
                                                    Spending Limit
                                                </span>
                                            )}
                                            {account.savingGoal && (
                                                <span className={`px-2 py-1 text-xs ${themeClasses.alert.info} rounded`}>
                                                    Saving Goal
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                {!account.isDeleted && !account.isMain && (
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            variant="danger"
                                            size="small"
                                            icon={<Trash2 size={14} />}
                                            onClick={() => handleDeleteAccount(account.id, account.coreDetails?.name || 'Account')}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
