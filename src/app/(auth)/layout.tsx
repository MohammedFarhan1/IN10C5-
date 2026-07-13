import type { Metadata } from 'next';
import { Hexagon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Auth — Trusta',
  description: 'Sign in or create your Trusta account',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md flex flex-col">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors mb-5 self-start">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Link>
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-sm">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Trusta</span>
          </Link>
          {children}
        </div>
      </div>
      <p className="text-center text-gray-400 text-xs py-4">
        © {new Date().getFullYear()} Trusta Marketplace. All rights reserved.
      </p>
    </div>
  );
}
