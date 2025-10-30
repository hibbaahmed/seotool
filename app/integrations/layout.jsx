import '../globals.css';
import ClientProvider from '../../components/ClientProvider';
import Navbar from "../../components/Navbar";
import { getNavbarData } from '../../utils/getNavbarData';

export const metadata = {
  title: 'VidFix',
  description: 'Create Your Next AI Video',
};

export default async function RootLayout({ children }) {
  const { user } = await getNavbarData();

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <ClientProvider>
        {children}
      </ClientProvider>
    </div>
  );
}