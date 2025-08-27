import React from 'react';
import { Container } from './styles';
import { WalletApp } from '../components/user-app';

type AppProps = {
}

export function App({}: AppProps) {
  return (
    <Container>
      <WalletApp />
    </Container>
  );
}
