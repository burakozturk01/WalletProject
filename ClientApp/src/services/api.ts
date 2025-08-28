// Base API configuration
const API_BASE_URL = '/api';

// API response types
export interface ApiResponse<T> {
  data: T;
  total?: number;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
}

export interface UserTotalBalance {
  userId: string;
  totalBalance: number;
  accountCount: number;
  activeAccountCount: number;
}

// Account types
export interface Account {
  id: string;
  userId: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
  coreDetails?: CoreDetails;
  activeAccount?: ActiveAccount;
  spendingLimit?: SpendingLimit;
  savingGoal?: SavingGoal;
}

export interface CoreDetails {
  name: string;
  balance: number;
}

export interface ActiveAccount {
  iban: string;
  activatedAt: string;
}

export interface SpendingLimit {
  limitAmount: number;
  timeframe: number;
  currentSpending: number;
  periodStartDate: string;
}

export interface SavingGoal {
  goalName: string;
  targetAmount: number;
}

export interface AccountCreate {
  userId: string;
  isMain: boolean;
  coreDetails: {
    name: string;
    balance: number;
  };
  activeAccount?: {
    iban: string;
  };
  spendingLimit?: {
    limitAmount: number;
    timeframe: number;
    currentSpending?: number;
    periodStartDate?: string;
  };
  savingGoal?: {
    goalName: string;
    targetAmount: number;
  };
}

// Transaction types
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
}

export interface TransactionCreate {
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
  timestamp?: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface TokenValidationResponse {
  isValid: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

// Generic API client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params ? 
      '?' + new URLSearchParams(params).toString() : '';
    return this.request<T>(`${endpoint}${queryString}`);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL);

// User API
export const userApi = {
  getUsers: (params?: PaginationParams) =>
    apiClient.get<ApiResponse<User[]>>('/user', params),
  
  getUser: (id: string) =>
    apiClient.get<User>(`/user/${id}`),
  
  getUserTotalBalance: (id: string) =>
    apiClient.get<UserTotalBalance>(`/user/${id}/total-balance`),
  
  createUser: (data: UserCreate) =>
    apiClient.post<User>('/user', data),
  
  updateUser: (id: string, data: UserUpdate) =>
    apiClient.put<User>(`/user/${id}`, data),
  
  deleteUser: (id: string) =>
    apiClient.delete(`/user/${id}`),
};

// Account API
export const accountApi = {
  getAccounts: (params?: PaginationParams) =>
    apiClient.get<ApiResponse<Account[]>>('/account', params),
  
  getAccount: (id: string) =>
    apiClient.get<Account>(`/account/${id}`),
  
  getAccountsByUser: (userId: string, params?: PaginationParams) =>
    apiClient.get<ApiResponse<Account[]>>(`/account/user/${userId}`, params),
  
  createAccount: (data: AccountCreate) =>
    apiClient.post<Account>('/account', data),
  
  updateAccount: (id: string, data: AccountCreate) =>
    apiClient.put<Account>(`/account/${id}`, data),
  
  deleteAccount: (id: string) =>
    apiClient.delete(`/account/${id}`),
};

// Transaction API
export const transactionApi = {
  getTransactions: (params?: PaginationParams) =>
    apiClient.get<ApiResponse<Transaction[]>>('/transaction', params),
  
  getTransaction: (id: string) =>
    apiClient.get<Transaction>(`/transaction/${id}`),
  
  getTransactionsByAccount: (accountId: string, params?: PaginationParams) =>
    apiClient.get<ApiResponse<Transaction[]>>(`/transaction/account/${accountId}`, params),
  
  createTransaction: (data: TransactionCreate) =>
    apiClient.post<Transaction>('/transaction', data),
};

// Authentication API
export const authApi = {
  login: (credentials: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', credentials),
  
  register: (credentials: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', credentials),
  
  validateToken: () =>
    apiClient.get<TokenValidationResponse>('/auth/validate'),
};

// Export default API object
export const api = {
  user: userApi,
  account: accountApi,
  transaction: transactionApi,
  auth: authApi,
};

export default api;
