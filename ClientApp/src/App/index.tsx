import React from 'react';
import { DatabaseTester } from '../components/DatabaseTester';
import { WalletApp } from '../components/user-app';
import { AuthProvider } from '../hooks/useAuth';

type AppProps = {
}

export function App({}: AppProps) {
  return (
    <AuthProvider>
      <WalletApp />
    </AuthProvider>
  );
}
