'use client';

import '../../globals.css';
import ClientProvider from '../../../components/ClientProvider';
import Nav from '../../../components/Nav';

export default function RootLayout({ children }) {
  return (
    <>
      <Nav />
      <ClientProvider>
        {children}
      </ClientProvider>
    </>
  );
} 