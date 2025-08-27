import React from 'react';
import { DatabaseTester } from '../components/DatabaseTester';
import { Container } from './styles';

type AppProps = {
}

export function App({}: AppProps) {
  return (
    <Container>
      <DatabaseTester />
    </Container>
  );
}
