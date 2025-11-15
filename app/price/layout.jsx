import '../globals.css';
import ClientProvider from '../../components/ClientProvider';
import Navbar from "../../components/Navbar";
import { getNavbarData } from '../../utils/getNavbarData';
import Script from 'next/script';

export const metadata = {
  title: 'Bridgely',
  description: 'AI-Powered SEO Automation Platform - Rank on Google and Get Cited on ChatGPT',
};

export default async function RootLayout({ children }) {
  const { user, credits } = await getNavbarData();

  return (
    <div className="min-h-screen">
      <Navbar user={user} credits={credits} />
      <ClientProvider>
        {children}
      </ClientProvider>
    </div>
  );
}