import React from 'react';
import { AppProvider } from '@/contexts/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ContentRouter } from '@/components/ContentRouter';

export default function Home() {
  return (
    <AppProvider>
      <AppLayout>
        <ContentRouter />
      </AppLayout>
    </AppProvider>
  );
}