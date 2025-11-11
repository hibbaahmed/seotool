// components/ClientProvider.js
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { CreditsProvider } from '@/app/context/CreditsContext';

export default function ClientProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <CreditsProvider>
        {children}
      </CreditsProvider>
    </QueryClientProvider>
  );
}

