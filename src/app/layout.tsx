import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Trusta — Buy Authentic Products with Confidence', template: '%s | Trusta' },
  description: 'Trusta ensures every product is verified, every brand owner is trusted, and every purchase is tracked from manufacturer to your door.',
  keywords: ['verified products', 'authentic marketplace', 'product tracking', 'trusted brand owners'],
  openGraph: {
    title: 'Trusta — Authentic Product Marketplace',
    description: 'Shop verified products with full traceability and brand owner trust scores.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
