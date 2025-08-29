import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, ArrowRight, Filter, Calendar, Search, Clock, RefreshCw, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Card, Button, Dropdown } from '../../shared/ui';
import { useAuth } from '../../../../hooks/useAuth';
import { useUserData } from '../../../../hooks/useUserData';
import { useTimezone } from '../../../../hooks/useTimezone';
import { useThemeClasses } from '../../../../contexts/ThemeContext';
import { api, Transaction } from '../../../../services/api';
import { convertToUserTimezone } from '../../../../utils/timezone';

export function TransactionsPage() {
    const { user } = useAuth();
    const { accounts } = useUserData(user?.id);
    const { formatDate, formatTime, formatDateTime } = useTimezone();
    const themeClasses = useThemeClasses();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [allAccounts, setAllAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date-desc');
    const [dateInterval, setDateInterval] = useState<string>('all');
    const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);

    const sortOptions = [
        { value: 'date-desc', label: 'Newest First' },
        { value: 'date-asc', label: 'Oldest First' },
        { value: 'amount-desc', label: 'Highest Amount' },
        { value: 'amount-asc', label: 'Lowest Amount' }
    ];

    const dateIntervalOptions = [
        { value: 'all', label: 'All Time' },
        { value: 'day', label: 'Last Day' },
        { value: 'week', label: 'Last Week' },
        { value: 'month', label: 'Last Month' },
        { value: 'year', label: 'Last Year' }
    ];

    const getDateFilterCutoff = (interval: string): Date | null => {
        // Use timezone-aware current time for filtering
        const now = convertToUserTimezone(new Date());
        switch (interval) {
            case 'day':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case 'week':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case 'year':
                return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            default:
                return null;
        }
    };

    const fetchTransactions = async () => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch all accounts including deleted ones for transaction history
            const allAccountsResponse = await api.account.getAllAccountsByUserIncludingDeleted(user.id, { limit: 100 });
            const allUserAccounts = allAccountsResponse.data || [];

            if (allUserAccounts.length === 0) {
                setTransactions([]);
                setIsLoading(false);
                return;
            }

            const transactionPromises = allUserAccounts.map(account =>
                api.transaction.getTransactionsByAccount(account.id, { limit: 100 }).catch(err => {
                    console.warn(`Failed to fetch transactions for account ${account.id}:`, err);
                    return { data: [] }; // Return empty data for failed requests
                })
            );

            const transactionResponses = await Promise.all(transactionPromises);
            const allTransactions = transactionResponses.flatMap(response => response.data || []);

            // Remove duplicates (transactions that appear in multiple accounts)
            const uniqueTransactions = allTransactions.filter((transaction, index, self) =>
                index === self.findIndex(t => t.id === transaction.id)
            );

            setTransactions(uniqueTransactions);
            setAllAccounts(allUserAccounts);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [accounts, user?.id]);

    const getTransactionIcon = (transaction: Transaction) => {
        // Use allAccounts (including deleted) to properly identify user accounts
        const allUserAccountIds = allAccounts.map(a => a.id);
        const isIncoming = allUserAccountIds.includes(transaction.destinationAccountId || '');
        const isOutgoing = allUserAccountIds.includes(transaction.sourceAccountId || '');

        if (isIncoming && !isOutgoing) {
            return <ArrowDownLeft size={20} className="text-green-600" />;
        } else if (isOutgoing && !isIncoming) {
            return <ArrowUpRight size={20} className="text-red-600" />;
        } else {
            return <ArrowRight size={20} className="text-blue-600" />;
        }
    };

    const getTransactionType = (transaction: Transaction) => {
        // Use allAccounts (including deleted) to properly identify user accounts
        const allUserAccountIds = allAccounts.map(a => a.id);
        const isIncoming = allUserAccountIds.includes(transaction.destinationAccountId || '');
        const isOutgoing = allUserAccountIds.includes(transaction.sourceAccountId || '');

        if (isIncoming && !isOutgoing) {
            return { type: 'Incoming', color: 'text-green-600' };
        } else if (isOutgoing && !isIncoming) {
            return { type: 'Outgoing', color: 'text-red-600' };
        } else {
            return { type: 'Transfer', color: 'text-blue-600' };
        }
    };

    const getTransactionDetails = (transaction: Transaction, allAccounts: any[]) => {
        // Use allAccounts (including deleted) to properly identify user accounts
        const allUserAccountIds = allAccounts.map(a => a.id);
        const isIncoming = allUserAccountIds.includes(transaction.destinationAccountId || '');
        const isOutgoing = allUserAccountIds.includes(transaction.sourceAccountId || '');

        if (isIncoming && !isOutgoing) {
            // Incoming transaction - find the destination account name
            const destAccount = allAccounts.find(a => a.id === transaction.destinationAccountId);
            const destAccountName = destAccount?.coreDetails?.name || 'Unknown Account';
            const destDeleted = destAccount?.isDeleted ? ' (Deleted)' : '';

            if (transaction.sourceType === 1) { // IBAN
                return `From: ${transaction.sourceIban} (${transaction.sourceName || 'External'}) → To: ${destAccountName}${destDeleted}`;
            } else if (transaction.sourceType === 2) { // System
                return `From: ${transaction.sourceName || 'System'} → To: ${destAccountName}${destDeleted}`;
            }
            return `From: External Account → To: ${destAccountName}${destDeleted}`;
        } else if (isOutgoing && !isIncoming) {
            // Outgoing transaction
            if (transaction.destinationType === 1) { // IBAN
                return `To: ${transaction.destinationIban} (${transaction.destinationName || 'External'})`;
            } else if (transaction.destinationType === 2) { // Spend
                return `Spent on: ${transaction.destinationName || 'Purchase'}`;
            }
            return 'To: External Account';
        } else {
            // Internal transfer - check both active and deleted accounts
            const sourceAccount = allAccounts.find(a => a.id === transaction.sourceAccountId);
            const destAccount = allAccounts.find(a => a.id === transaction.destinationAccountId);

            const sourceName = sourceAccount?.coreDetails?.name || 'Unknown';
            const destName = destAccount?.coreDetails?.name || 'Unknown';

            const sourceDeleted = sourceAccount?.isDeleted ? ' (Deleted)' : '';
            const destDeleted = destAccount?.isDeleted ? ' (Deleted)' : '';

            return `From: ${sourceName}${sourceDeleted} → To: ${destName}${destDeleted}`;
        }
    };

    const filteredAndSortedTransactions = transactions
        .filter(transaction => {
            // Filter by account
            if (selectedAccount !== 'all') {
                const isRelated = transaction.sourceAccountId === selectedAccount ||
                    transaction.destinationAccountId === selectedAccount;
                if (!isRelated) return false;
            }

            // Filter by date interval
            const dateCutoff = getDateFilterCutoff(dateInterval);
            if (dateCutoff) {
                const transactionDate = new Date(transaction.timestamp);
                if (transactionDate < dateCutoff) return false;
            }

            // Filter by search term
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return (
                    transaction.description.toLowerCase().includes(searchLower) ||
                    transaction.sourceName?.toLowerCase().includes(searchLower) ||
                    transaction.destinationName?.toLowerCase().includes(searchLower) ||
                    transaction.sourceIban?.toLowerCase().includes(searchLower) ||
                    transaction.destinationIban?.toLowerCase().includes(searchLower)
                );
            }

            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'date-asc':
                    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                default: // date-desc
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            }
        });

    const accountOptions = [
        { value: 'all', label: 'All Accounts' },
        ...accounts
            .filter(a => !a.isDeleted)
            .map(account => ({
                value: account.id,
                label: account.coreDetails?.name || 'Unnamed Account'
            }))
    ];

    if (isLoading) {
        return (
            <div className="p-6">
                <div className={`text-center ${themeClasses.text.secondary}`}>
                    <RefreshCw size={48} className={`mx-auto mb-3 ${themeClasses.text.muted} animate-spin`} />
                    <p>Loading transactions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className={`text-center ${themeClasses.status.error}`}>
                    <p>Error: {error}</p>
                    <Button onClick={fetchTransactions} className="mt-4">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-3xl font-bold ${themeClasses.text.primary}`}>Transactions</h1>
                    <p className={`${themeClasses.text.secondary} mt-1`}>
                        {filteredAndSortedTransactions.length} transaction{filteredAndSortedTransactions.length !== 1 ? 's' : ''} found
                    </p>
                </div>
                <Button
                    variant="secondary"
                    icon={<RefreshCw size={16} />}
                    onClick={fetchTransactions}
                    disabled={isLoading}
                >
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <Card title="Filters">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                            Account
                        </label>
                        <Dropdown
                            options={accountOptions}
                            value={selectedAccount}
                            onChange={setSelectedAccount}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                            Date Range
                        </label>
                        <Dropdown
                            options={dateIntervalOptions}
                            value={dateInterval}
                            onChange={setDateInterval}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                            Search
                        </label>
                        <div className="relative">
                            <Search size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${themeClasses.text.tertiary}`} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full pl-10 pr-3 py-2 ${themeClasses.input.base} rounded-md focus:outline-none focus:ring-2 ${themeClasses.ring.focus}`}
                                placeholder="Search transactions..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                            Sort By
                        </label>
                        <Dropdown
                            options={sortOptions}
                            value={sortBy}
                            onChange={setSortBy}
                            className="w-full"
                        />
                    </div>
                </div>
            </Card>

            {/* Transactions List */}
            <div className="space-y-4">
                {filteredAndSortedTransactions.length === 0 ? (
                    <Card>
                        <div className={`text-center py-8 ${themeClasses.text.secondary}`}>
                            <Clock size={48} className={`mx-auto mb-3 ${themeClasses.text.muted}`} />
                            <p className="text-lg font-medium">No transactions found</p>
                            <p className="text-sm">
                                {searchTerm || selectedAccount !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Your transactions will appear here when you start using your accounts'
                                }
                            </p>
                        </div>
                    </Card>
                ) : (
                    filteredAndSortedTransactions.map((transaction) => {
                        const transactionType = getTransactionType(transaction);
                        const details = getTransactionDetails(transaction, allAccounts);

                        const isExpanded = expandedTransaction === transaction.id;

                        return (
                            <Card key={transaction.id}>
                                <div
                                    className="cursor-pointer"
                                    onClick={() => setExpandedTransaction(isExpanded ? null : transaction.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                {getTransactionIcon(transaction)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className={`text-lg font-semibold ${themeClasses.text.primary} truncate`}>
                                                        {transaction.description.length > 50 && !isExpanded
                                                            ? `${transaction.description.substring(0, 50)}...`
                                                            : transaction.description}
                                                    </h3>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${transactionType.type === 'Incoming'
                                                            ? themeClasses.alert.success
                                                            : transactionType.type === 'Outgoing'
                                                                ? themeClasses.alert.error
                                                                : themeClasses.alert.info
                                                        }`}>
                                                        {transactionType.type}
                                                    </span>
                                                </div>

                                                <p className={`text-sm ${themeClasses.text.secondary} truncate`}>
                                                    {details}
                                                </p>

                                                <div className={`flex items-center space-x-4 mt-2 text-xs ${themeClasses.text.tertiary}`}>
                                                    <span className="flex items-center">
                                                        <Calendar size={12} className="mr-1" />
                                                        {formatDate(transaction.timestamp)}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Clock size={12} className="mr-1" />
                                                        {formatTime(transaction.timestamp)}
                                                    </span>
                                                    <span className="font-mono">
                                                        ID: {transaction.id.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right flex items-center space-x-3">
                                            <div>
                                                <div className={`text-xl font-bold ${transactionType.color}`}>
                                                    {transactionType.type === 'Incoming' ? '+' : transactionType.type === 'Outgoing' ? '-' : ''}
                                                    ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>

                                                {/* Balance information if available */}
                                                {(() => {
                                                    const userAccountIds = accounts.map(a => a.id);
                                                    const isUserSource = userAccountIds.includes(transaction.sourceAccountId || '');
                                                    const isUserDestination = userAccountIds.includes(transaction.destinationAccountId || '');

                                                    if (isUserSource && transaction.sourceAccountBalanceBefore !== undefined && transaction.sourceAccountBalanceBefore !== null) {
                                                        const sourceAccount = accounts.find(a => a.id === transaction.sourceAccountId);
                                                        return (
                                                            <div className={`text-xs ${themeClasses.text.tertiary} mt-1`}>
                                                                {sourceAccount?.coreDetails?.name || 'Account'}: ${transaction.sourceAccountBalanceBefore.toFixed(2)} → ${(transaction.sourceAccountBalanceBefore - transaction.amount).toFixed(2)}
                                                            </div>
                                                        );
                                                    }

                                                    if (isUserDestination && transaction.destinationAccountBalanceBefore !== undefined && transaction.destinationAccountBalanceBefore !== null) {
                                                        const destAccount = accounts.find(a => a.id === transaction.destinationAccountId);
                                                        return (
                                                            <div className={`text-xs ${themeClasses.text.tertiary} mt-1`}>
                                                                {destAccount?.coreDetails?.name || 'Account'}: ${transaction.destinationAccountBalanceBefore.toFixed(2)} → ${(transaction.destinationAccountBalanceBefore + transaction.amount).toFixed(2)}
                                                            </div>
                                                        );
                                                    }

                                                    return null;
                                                })()}
                                            </div>

                                            <div className="flex-shrink-0">
                                                {isExpanded ? (
                                                    <ChevronUp size={20} className={themeClasses.text.tertiary} />
                                                ) : (
                                                    <ChevronDown size={20} className={themeClasses.text.tertiary} />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Transaction Details */}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                                        <Info size={16} className="mr-2" />
                                                        Transaction Details
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Full ID:</span>
                                                            <span className="font-mono text-gray-900">{transaction.id}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Amount:</span>
                                                            <span className={`font-bold ${transactionType.color}`}>
                                                                {transactionType.type === 'Incoming' ? '+' : transactionType.type === 'Outgoing' ? '-' : ''}
                                                                ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Transaction Time:</span>
                                                            <span className="text-gray-900">
                                                                {formatDateTime(transaction.timestamp)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Source and Destination Details */}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                                        Source & Destination
                                                    </h4>
                                                    <div className="space-y-4 text-sm">
                                                        {/* Source Details */}
                                                        <div className="bg-gray-50 p-3 rounded-md">
                                                            <div className="font-medium text-gray-700 mb-2">Source</div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Type:</span>
                                                                    <span className="text-gray-900">
                                                                        {transaction.sourceType === 0 ? 'Account' :
                                                                            transaction.sourceType === 1 ? 'IBAN' : 'System'}
                                                                    </span>
                                                                </div>
                                                                {transaction.sourceAccountId && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Account:</span>
                                                                        <span className="text-gray-900">
                                                                            {allAccounts.find(a => a.id === transaction.sourceAccountId)?.coreDetails?.name || 'Unknown'}
                                                                            {allAccounts.find(a => a.id === transaction.sourceAccountId)?.isDeleted && ' (Deleted)'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {transaction.sourceIban && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">IBAN:</span>
                                                                        <span className="font-mono text-gray-900">{transaction.sourceIban}</span>
                                                                    </div>
                                                                )}
                                                                {transaction.sourceName && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Name:</span>
                                                                        <span className="text-gray-900">{transaction.sourceName}</span>
                                                                    </div>
                                                                )}
                                                                {transaction.sourceAccountBalanceBefore !== undefined && transaction.sourceAccountBalanceBefore !== null && (
                                                                    <>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-600">Balance Before:</span>
                                                                            <span className="text-gray-900">${transaction.sourceAccountBalanceBefore.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-600">Balance After:</span>
                                                                            <span className="text-gray-900">${(transaction.sourceAccountBalanceBefore - transaction.amount).toFixed(2)}</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Destination Details */}
                                                        <div className="bg-gray-50 p-3 rounded-md">
                                                            <div className="font-medium text-gray-700 mb-2">Destination</div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Type:</span>
                                                                    <span className="text-gray-900">
                                                                        {transaction.destinationType === 0 ? 'Account' :
                                                                            transaction.destinationType === 1 ? 'IBAN' : 'Spend'}
                                                                    </span>
                                                                </div>
                                                                {transaction.destinationAccountId && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Account:</span>
                                                                        <span className="text-gray-900">
                                                                            {allAccounts.find(a => a.id === transaction.destinationAccountId)?.coreDetails?.name || 'Unknown'}
                                                                            {allAccounts.find(a => a.id === transaction.destinationAccountId)?.isDeleted && ' (Deleted)'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {transaction.destinationIban && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">IBAN:</span>
                                                                        <span className="font-mono text-gray-900">{transaction.destinationIban}</span>
                                                                    </div>
                                                                )}
                                                                {transaction.destinationName && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Name:</span>
                                                                        <span className="text-gray-900">{transaction.destinationName}</span>
                                                                    </div>
                                                                )}
                                                                {transaction.destinationAccountBalanceBefore !== undefined && transaction.destinationAccountBalanceBefore !== null && (
                                                                    <>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-600">Balance Before:</span>
                                                                            <span className="text-gray-900">${transaction.destinationAccountBalanceBefore.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-600">Balance After:</span>
                                                                            <span className="text-gray-900">${(transaction.destinationAccountBalanceBefore + transaction.amount).toFixed(2)}</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Full Description */}
                                            {transaction.description.length > 50 && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Full Description</h4>
                                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                                                        {transaction.description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Summary */}
            {filteredAndSortedTransactions.length > 0 && (
                <Card title={`Summary - ${dateIntervalOptions.find(opt => opt.value === dateInterval)?.label || 'All Time'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className={`text-2xl font-bold ${themeClasses.text.primary}`}>
                                {filteredAndSortedTransactions.length}
                            </div>
                            <div className={`text-sm ${themeClasses.text.secondary}`}>Total Transactions</div>
                        </div>

                        <div>
                            <div className={`text-2xl font-bold ${themeClasses.amount.positive}`}>
                                +${filteredAndSortedTransactions
                                    .filter(t => getTransactionType(t).type === 'Incoming')
                                    .reduce((sum, t) => sum + t.amount, 0)
                                    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-sm ${themeClasses.text.secondary}`}>Total Incoming</div>
                        </div>

                        <div>
                            <div className={`text-2xl font-bold ${themeClasses.amount.negative}`}>
                                -${filteredAndSortedTransactions
                                    .filter(t => getTransactionType(t).type === 'Outgoing')
                                    .reduce((sum, t) => sum + t.amount, 0)
                                    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-sm ${themeClasses.text.secondary}`}>Total Outgoing</div>
                        </div>

                        <div>
                            <div className={`text-2xl font-bold ${themeClasses.amount.neutral}`}>
                                ${(() => {
                                    const incoming = filteredAndSortedTransactions
                                        .filter(t => getTransactionType(t).type === 'Incoming')
                                        .reduce((sum, t) => sum + t.amount, 0);
                                    const outgoing = filteredAndSortedTransactions
                                        .filter(t => getTransactionType(t).type === 'Outgoing')
                                        .reduce((sum, t) => sum + t.amount, 0);
                                    const netFlow = incoming - outgoing;
                                    return `${netFlow >= 0 ? '+' : ''}${netFlow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                })()}
                            </div>
                            <div className={`text-sm ${themeClasses.text.secondary}`}>Net Flow</div>
                        </div>
                    </div>

                    {dateInterval !== 'all' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className={`text-center text-sm ${themeClasses.text.tertiary}`}>
                                <Calendar size={14} className="inline mr-1" />
                                Showing transactions from {dateIntervalOptions.find(opt => opt.value === dateInterval)?.label.toLowerCase()}
                                {getDateFilterCutoff(dateInterval) && (
                                    <span className="ml-2">
                                        (since {getDateFilterCutoff(dateInterval)!.toLocaleDateString()})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
