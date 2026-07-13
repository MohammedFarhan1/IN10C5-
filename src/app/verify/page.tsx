'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShieldCheck, Search, ScanLine, CheckCircle2 } from 'lucide-react';

const EXAMPLE_IDS = [
  'TRU-IP16-BLK128-000001',
  'TRU-SAM55-WHT256-000023',
  'TRU-DRNX-SLV001-000007',
];

export default function VerifyPage() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleVerify = (id?: string) => {
    const code = (id ?? value).trim().toUpperCase();
    if (!code) {
      setError('Please enter a Verification ID.');
      return;
    }
    if (!/^TRU-[A-Z0-9]+-[A-Z0-9]+-\d{6}$/.test(code)) {
      setError('Invalid format. Expected: TRU-XXXX-XXXX-000001');
      return;
    }
    router.push(`/verify/${code}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showCategoryMenu={false} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-10 max-w-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 border border-red-100 rounded-2xl mb-5">
            <ShieldCheck className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Verify Product Authenticity</h1>
          <p className="text-gray-500 leading-relaxed">
            Enter the Verification ID printed on your product or packaging to confirm it's genuine and see full ownership details.
          </p>
        </div>

        {/* Input card */}
        <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Verification ID
          </label>
          <div className="relative">
            <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={value}
              onChange={e => { setValue(e.target.value.toUpperCase()); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              placeholder="TRU-IP16-BLK128-000001"
              spellCheck={false}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition text-sm tracking-wider"
            />
          </div>

          {error && (
            <p className="mt-2 text-red-600 text-xs">{error}</p>
          )}

          <button
            onClick={() => handleVerify()}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Search className="w-4 h-4" />
            Verify Now
          </button>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Format: <span className="text-gray-600 font-mono">TRU-[PRODUCT]-[VARIANT]-[NUMBER]</span>
          </p>
        </div>

        {/* Example IDs */}
        <div className="mt-8 w-full max-w-lg">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3 text-center">
            Try an example
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {EXAMPLE_IDS.map(id => (
              <button
                key={id}
                onClick={() => { setValue(id); setError(''); }}
                className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-900 rounded-lg text-xs font-mono transition-colors"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-16 w-full max-w-2xl">
          <h2 className="text-center text-lg font-bold text-gray-900 mb-6">How Verification Works</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: ScanLine,     step: '1', title: 'Enter ID',    desc: 'Type the Verification ID from your product or packaging.' },
              { icon: Search,       step: '2', title: 'We Search',   desc: 'We look up the unique unit in our authenticity registry.' },
              { icon: CheckCircle2, step: '3', title: 'See Results', desc: 'View product details, ownership status, and authenticity proof.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="bg-white border border-gray-200 rounded-xl p-5 text-center hover:shadow-sm hover:border-gray-300 transition-all duration-200">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mb-1">Step {step}</p>
                <h3 className="text-gray-900 font-semibold text-sm mb-1">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
