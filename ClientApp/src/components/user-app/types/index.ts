// Core entity types (matching backend models)
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
}

export interface Account {
  id: string;
  userId: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
  coreDetails?: {
    name: string;
    balance: number;
  };
  activeAccount?: {
    iban: string;
    activatedAt: string;
  };
  spendingLimit?: {
    limitAmount: number;
    timeframe: number;
    currentSpending: number;
    periodStartDate: string;
  };
  savingGoal?: {
    goalName: string;
    targetAmount: number;
  };
}

export interface Transaction {
  id: string;
  sourceType: number;
  sourceAccountId?: string;
  sourceIban?: string;
  sourceName?: string;
  destinationType: number;
  destinationAccountId?: string;
  destinationIban?: string;
  destinationName?: string;
  amount: number;
  description: string;
  timestamp: string;
  sourceAccountBalanceBefore?: number;
  destinationAccountBalanceBefore?: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
}

// UI-specific types
export interface UserTotalBalance {
  userId: string;
  totalBalance: number;
  accountCount: number;
  activeAccountCount: number;
}

export interface DashboardData {
  totalBalance: number;
  accounts: Account[];
  recentTransactions: Transaction[];
  balanceTrend: number[];
}

// Component prop types
export interface ComponentToggleState {
  activeAccount: boolean;
  spendingLimit: boolean;
  savingGoal: boolean;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface TransferFormData {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
}

export interface WithdrawFormData {
  accountId: string;
  destinationIban: string;
  destinationName: string;
  amount: number;
  description: string;
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// Navigation types
export type NavigationItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
  divider?: boolean;
};

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

// Timeframe enum for spending limits
export enum SpendingTimeframe {
  Daily = 0,
  Weekly = 1,
  Monthly = 2,
  Yearly = 3
}

// Transaction type enums
export enum TransactionSourceType {
  Account = 0,
  IBAN = 1,
  System = 2
}

export enum TransactionDestinationType {
  Account = 0,
  IBAN = 1,
  Spend = 2
}

// Language support
export type SupportedLanguage = 'en' | 'tr';

// Settings types
export interface UserSettings {
  theme: ThemeMode;
  language: SupportedLanguage;
  notifications: {
    transactions: boolean;
    spendingLimits: boolean;
    savingGoals: boolean;
  };
}
