import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SEOFlow - Rank Clients on Google and Get Cited on ChatGPT",
  description: "The ultimate SEO automation system for agencies and marketers. AI-powered content creation, optimization, and syndication in one place.",
  keywords: "SEO automation, AI content creation, SEO tools, content marketing, digital marketing",
  authors: [{ name: "SEOFlow Team" }],
  openGraph: {
    title: "SEOFlow - AI-Powered SEO Automation",
    description: "Rank clients on Google and get cited on ChatGPT – all in one place.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SEOFlow - AI-Powered SEO Automation",
    description: "Rank clients on Google and get cited on ChatGPT – all in one place.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-white dark:bg-gray-900">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
