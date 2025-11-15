import '../globals.css';
import ClientProvider from '../../components/ClientProvider';
import Nav from "../../components/Nav";

export const metadata = {
  title: 'Bridgely',
  description: 'AI-Powered SEO Automation Platform - Rank on Google and Get Cited on ChatGPT',
};

export default function RootLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Nav />
      <ClientProvider>
        {children}
      </ClientProvider>
    </div>
  );
}