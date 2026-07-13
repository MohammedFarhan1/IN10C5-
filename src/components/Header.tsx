'use client';

import Link from 'next/link';
import { Search, ShoppingCart, User, Hexagon, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Header({ showCategoryMenu = true }: { showCategoryMenu?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/cart')
      .then(async res => {
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.data) {
          const count = data.data.reduce((acc: number, item: any) => acc + item.quantity, 0);
          setCartCount(count);
        }
      })
      .catch(console.error);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-red-700 transition-colors">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Trusta</span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search authentic products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-11 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 focus:bg-white transition-all text-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </form>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/verify"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verify
            </Link>
            <Link
              href="/cart"
              aria-label={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
              className="relative text-gray-500 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/account"
              aria-label="Account"
              className="text-gray-500 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Category Menu */}
      {showCategoryMenu && (
        <div className="border-t border-gray-100 bg-gray-50">
          <nav className="container mx-auto px-4 py-2.5 flex items-center justify-center relative overflow-x-auto hide-scrollbar">
            <div className="flex gap-6 text-sm font-medium whitespace-nowrap">
              <Link href="/products" className="text-gray-900 hover:text-red-600 transition-colors border-b-2 border-red-600 pb-0.5">
                All Products
              </Link>
              <Link href="/products?category=electronics" className="text-gray-500 hover:text-gray-900 transition-colors pb-0.5">
                Electronics
              </Link>
              <Link href="/products?category=automotive" className="text-gray-500 hover:text-gray-900 transition-colors pb-0.5">
                Automotive
              </Link>
              <Link href="/products?category=furniture" className="text-gray-500 hover:text-gray-900 transition-colors pb-0.5">
                Furniture
              </Link>
              <Link href="/products?category=appliances" className="text-gray-500 hover:text-gray-900 transition-colors pb-0.5">
                Appliances
              </Link>
            </div>
            <Link
              href="/signup/seller"
              className="absolute right-4 text-red-600 hover:text-red-700 font-semibold text-sm transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              Sell with Trusta <span className="text-base leading-none">&rarr;</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
