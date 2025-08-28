import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import { ProtectedRoute } from '../components/user-app/routing/ProtectedRoute';
import { AuthRedirect } from '../components/user-app/routing/AuthRedirect';
import { MainLayout } from '../components/user-app/layout/MainLayout';
import { LoginPage } from '../components/user-app/pages/auth/LoginPage';
import { RegisterPage } from '../components/user-app/pages/auth/RegisterPage';
import { DashboardPage } from '../components/user-app/pages/dashboard/DashboardPage';
import { AccountsPage } from '../components/user-app/pages/accounts/AccountsPage';
import { TransactionsPage } from '../components/user-app/pages/transactions/TransactionsPage';
import { TransferPayPage } from '../components/user-app/pages/transfer-pay/TransferPayPage';
import { SettingsPage } from '../components/user-app/pages/settings/SettingsPage';
import { AdminPage } from '../components/admin-page/AdminPage';

type AppProps = {
}

export function App({}: AppProps) {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth routes - redirect to dashboard if already authenticated */}
          <Route path="/login" element={
            <AuthRedirect>
              <LoginPage />
            </AuthRedirect>
          } />
          <Route path="/register" element={
            <AuthRedirect>
              <RegisterPage />
            </AuthRedirect>
          } />
          
          {/* Admin route - no authentication required for development */}
          <Route path="/admin" element={<AdminPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="transfer-pay" element={<TransferPayPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
