import '../globals.css';
import ClientProvider from '../../components/ClientProvider';
import { Nav } from '../../components/Nav';

export const metadata = {
  title: 'VidFix',
  description: 'Create Your Next AI Video',
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