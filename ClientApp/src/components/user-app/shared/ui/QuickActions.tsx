/**
 * These menus are mini versions of Transfer & Pay page's menus
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, ArrowUpRight, ArrowRight, Send, CreditCard, Building, X, ChevronDown } from 'lucide-react';
import { Button, Dropdown } from './index';
import { useAuth } from '../../../../hooks/useAuth';
import { useUserData } from '../../../../hooks/useUserData';
import { useThemeClasses } from '../../../../contexts/ThemeContext';
import { api } from '../../../../services/api';

export interface QuickActionsProps {
    className?: string;
    refreshActivities?: () => Promise<void>;
    refreshUserData?: () => Promise<void>;
}

type ActionType = 'deposit' | 'withdraw' | 'transfer' | null;

interface TransferData {
    sourceAccountId: string;
    destinationType: 'account' | 'iban';
    destinationAccountId: string;
    destinationIban: string;
    destinationName: string;
    amount: number;
    description: string;
}

interface DepositData {
    accountId: string;
    sourceIban: string;
    sourceName: string;
    amount: number;
    description: string;
}

interface WithdrawData {
    accountId: string;
    destinationIban: string;
    destinationName: string;
    amount: number;
    description: string;
}

export function QuickActions({ className = '', refreshActivities, refreshUserData }: QuickActionsProps) {
    const { user } = useAuth();
    const { accounts, refreshData } = useUserData(user?.id);
    const themeClasses = useThemeClasses();
    const [activeAction, setActiveAction] = useState<ActionType>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Form states
    const [transferData, setTransferData] = useState<TransferData>({
        sourceAccountId: '',
        destinationType: 'account',
        destinationAccountId: '',
        destinationIban: '',
        destinationName: '',
        amount: 0,
        description: ''
    });

    const [depositData, setDepositData] = useState<DepositData>({
        accountId: '',
        sourceIban: '',
        sourceName: '',
        amount: 0,
        description: ''
    });

    const [withdrawData, setWithdrawData] = useState<WithdrawData>({
        accountId: '',
        destinationIban: '',
        destinationName: '',
        amount: 0,
        description: ''
    });

    const activeAccounts = accounts.filter(a => !a.isDeleted);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setActiveAction(null);
            }
        };

        if (activeAction) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeAction]);

    const resetForms = () => {
        setTransferData({
            sourceAccountId: '',
            destinationType: 'account',
            destinationAccountId: '',
            destinationIban: '',
            destinationName: '',
            amount: 0,
            description: ''
        });
        setDepositData({
            accountId: '',
            sourceIban: '',
            sourceName: '',
            amount: 0,
            description: ''
        });
        setWithdrawData({
            accountId: '',
            destinationIban: '',
            destinationName: '',
            amount: 0,
            description: ''
        });
        setMessage('');
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const payload: any = {
                sourceType: 0,
                sourceAccountId: transferData.sourceAccountId,
                amount: transferData.amount,
                description: transferData.description
            };

            if (transferData.destinationType === 'account') {
                payload.destinationType = 0;
                payload.destinationAccountId = transferData.destinationAccountId;
            } else {
                payload.destinationType = 1;
                payload.destinationIban = transferData.destinationIban;
                payload.destinationName = transferData.destinationName;
            }

            await api.transaction.createTransaction(payload);
            setMessage('Transfer completed successfully!');

            // Refresh both local data and dashboard data
            await refreshData();
            if (refreshUserData) {
                await refreshUserData();
            }
            if (refreshActivities) {
                await refreshActivities();
            }
            resetForms();
            setActiveAction(null);
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
                sourceType: 1,
                sourceIban: depositData.sourceIban,
                sourceName: depositData.sourceName,
                destinationType: 0,
                destinationAccountId: depositData.accountId,
                amount: depositData.amount,
                description: depositData.description
            };

            await api.transaction.createTransaction(payload);
            setMessage('Deposit completed successfully!');

            // Refresh both local data and dashboard data
            await refreshData();
            if (refreshUserData) {
                await refreshUserData();
            }
            if (refreshActivities) {
                await refreshActivities();
            }
            resetForms();
            setActiveAction(null);
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
                sourceType: 0,
                sourceAccountId: withdrawData.accountId,
                destinationType: 1,
                destinationIban: withdrawData.destinationIban,
                destinationName: withdrawData.destinationName,
                amount: withdrawData.amount,
                description: withdrawData.description
            };

            await api.transaction.createTransaction(payload);
            setMessage('Withdrawal completed successfully!');

            // Refresh both local data and dashboard data
            await refreshData();
            if (refreshUserData) {
                await refreshUserData();
            }
            if (refreshActivities) {
                await refreshActivities();
            }
            resetForms();
            setActiveAction(null);
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

    const openAction = (action: ActionType) => {
        if (activeAction === action) {
            setActiveAction(null);
            resetForms();
        } else {
            resetForms();
            setActiveAction(action);
        }
    };

    const closeAction = () => {
        setActiveAction(null);
        resetForms();
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
                <div className="relative">
                    <Button
                        variant="success"
                        icon={<Plus size={16} />}
                        onClick={() => openAction('deposit')}
                        className={`text-sm w-full ${activeAction === 'deposit' ? 'ring-2 ring-green-400' : ''}`}
                    >
                        Deposit
                    </Button>
                </div>

                <div className="relative">
                    <Button
                        variant="primary"
                        icon={<ArrowUpRight size={16} />}
                        onClick={() => openAction('withdraw')}
                        className={`text-sm w-full ${activeAction === 'withdraw' ? 'ring-2 ring-blue-400' : ''}`}
                    >
                        Withdraw
                    </Button>
                </div>

                <div className="relative">
                    <Button
                        variant="teal"
                        icon={<ArrowRight size={16} />}
                        onClick={() => openAction('transfer')}
                        className={`text-sm w-full ${activeAction === 'transfer' ? 'ring-2 ring-teal-400' : ''}`}
                    >
                        Transfer
                    </Button>
                </div>
            </div>

            {/* Dropdown Forms */}
            {activeAction && (
                <div
                    ref={dropdownRef}
                    className={`absolute top-full left-0 right-0 mt-2 ${themeClasses.bg.card} rounded-lg ${themeClasses.shadow.lg} ${themeClasses.border.primary} border z-50`}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between p-3 border-b ${themeClasses.border.primary}`}>
                        <h3 className={`text-base font-semibold ${themeClasses.text.primary} flex items-center`}>
                            {activeAction === 'deposit' && <><CreditCard size={18} className="mr-2" />Quick Deposit</>}
                            {activeAction === 'withdraw' && <><Building size={18} className="mr-2" />Quick Withdraw</>}
                            {activeAction === 'transfer' && <><ArrowRight size={18} className="mr-2" />Quick Transfer</>}
                        </h3>
                        <button
                            onClick={closeAction}
                            className={`p-1 rounded-md ${themeClasses.bg.hover} ${themeClasses.text.secondary}`}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mx-3 mt-3 p-2 rounded-md text-sm ${message.includes('Error')
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                            {message}
                        </div>
                    )}

                    {/* Forms */}
                    <div className="p-3">
                        {/* Deposit Form */}
                        {activeAction === 'deposit' && (
                            <form onSubmit={handleDeposit} className="space-y-3">
                                <div>
                                    <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                        To Account
                                    </label>
                                    <Dropdown
                                        options={accountOptions}
                                        value={depositData.accountId}
                                        onChange={(value) => setDepositData({ ...depositData, accountId: value })}
                                        className="w-full"
                                        placeholder="Select account"
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                        From IBAN
                                    </label>
                                    <input
                                        type="text"
                                        value={depositData.sourceIban}
                                        onChange={(e) => setDepositData({ ...depositData, sourceIban: e.target.value })}
                                        className={`w-full px-3 py-2 text-sm ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                        placeholder="GB29 NWBK 6016 1331 9268 19"
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
                                        className={`w-full px-3 py-2 text-sm ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                        placeholder="Source account name"
                                        maxLength={255}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                            Amount
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={depositData.amount}
                                            onChange={(e) => setDepositData({ ...depositData, amount: parseFloat(e.target.value) || 0 })}
                                            className={`w-full px-3 py-2 text-sm ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
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
                                            className={`w-full px-3 py-2 text-sm ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                            placeholder="Purpose"
                                            maxLength={500}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex space-x-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={closeAction}
                                        className="flex-1 text-sm"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="success"
                                        disabled={isLoading}
                                        icon={<CreditCard size={14} />}
                                        className="flex-1 text-sm"
                                    >
                                        {isLoading ? 'Processing...' : 'Deposit'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* Withdraw Form */}
                        {activeAction === 'withdraw' && (
                            <form onSubmit={handleWithdraw} className="space-y-3">
                                <div>
                                    <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                        From Account
                                    </label>
                                    <Dropdown
                                        options={accountOptions}
                                        value={withdrawData.accountId}
                                        onChange={(value) => setWithdrawData({ ...withdrawData, accountId: value })}
                                        className="w-full"
                                        placeholder="Select account"
                                    />
                                    {withdrawData.accountId && (
                                        <p className={`text-xs ${themeClasses.text.tertiary} mt-1`}>
                                            Available: ${getAvailableBalance(withdrawData.accountId).toFixed(2)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                        To IBAN
                                    </label>
                                    <input
                                        type="text"
                                        value={withdrawData.destinationIban}
                                        onChange={(e) => setWithdrawData({ ...withdrawData, destinationIban: e.target.value })}
                                        className={`w-full px-3 py-2 text-sm ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                        placeholder="GB29 NWBK 6016 1331 9268 19"
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
                                        className={`w-full px-3 py-2 text-sm ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                        placeholder="Recipient account name"
                                        maxLength={255}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                            Amount
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={withdrawData.amount}
                                            onChange={(e) => setWithdrawData({ ...withdrawData, amount: parseFloat(e.target.value) || 0 })}
                                            className={`w-full px-3 py-2 text-sm ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
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
                                            className={`w-full px-3 py-2 text-sm ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                            placeholder="Purpose"
                                            maxLength={500}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex space-x-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={closeAction}
                                        className="flex-1 text-sm"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="danger"
                                        disabled={isLoading}
                                        icon={<Building size={14} />}
                                        className="flex-1 text-sm"
                                    >
                                        {isLoading ? 'Processing...' : 'Withdraw'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* Transfer Form */}
                        {activeAction === 'transfer' && (
                            <form onSubmit={handleTransfer} className="space-y-3">
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
                                            className={`px-2 py-1 text-xs rounded ${transferData.destinationType === 'account'
                                                    ? `${themeClasses.button.primary} text-white`
                                                    : `${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`
                                                }`}
                                        >
                                            My Account
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTransferData({ ...transferData, destinationType: 'iban' })}
                                            className={`px-2 py-1 text-xs rounded ${transferData.destinationType === 'iban'
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
                                                className={`w-full px-3 py-2 text-sm ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                                placeholder="IBAN (e.g., GB29 NWBK 6016 1331 9268 19)"
                                                maxLength={34}
                                                required
                                            />
                                            <input
                                                type="text"
                                                value={transferData.destinationName}
                                                onChange={(e) => setTransferData({ ...transferData, destinationName: e.target.value })}
                                                className={`w-full px-3 py-2 text-sm ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                                placeholder="Recipient name"
                                                maxLength={255}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                                            Amount
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={transferData.amount}
                                            onChange={(e) => setTransferData({ ...transferData, amount: parseFloat(e.target.value) || 0 })}
                                            className={`w-full px-3 py-2 text-sm ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
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
                                            className={`w-full px-3 py-2 text-sm ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                            placeholder="Purpose"
                                            maxLength={500}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex space-x-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={closeAction}
                                        className="flex-1 text-sm"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="teal"
                                        disabled={isLoading}
                                        icon={<Send size={14} />}
                                        className="flex-1 text-sm"
                                    >
                                        {isLoading ? 'Processing...' : 'Transfer'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
