'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface FilterSidebarProps {
  onClose?: () => void;
  isOpen?: boolean;
}

const CATEGORIES = ['Electronics', 'Automotive', 'Furniture', 'Appliances', 'Jewelry', 'Fashion'];
const PRICE_RANGES = [
  { label: 'Under ₹1000', min: 0, max: 1000 },
  { label: '₹1000 - ₹5000', min: 1000, max: 5000 },
  { label: '₹5000 - ₹10000', min: 5000, max: 10000 },
  { label: '₹10000 - ₹50000', min: 10000, max: 50000 },
  { label: 'Over ₹50000', min: 50000, max: Infinity },
];
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'trending', label: 'Trending' },
  { value: 'price', label: 'Price: Low to High' },
  { value: 'newest', label: 'Newest' },
];

export default function FilterSidebar({ onClose, isOpen }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedPrice, setSelectedPrice] = useState(searchParams.get('maxPrice') || '');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'featured');

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedPrice) params.append('maxPrice', selectedPrice);
    if (verifiedOnly) params.append('verified', 'true');
    params.append('sortBy', sortBy);

    router.push(`/products?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedPrice('');
    setVerifiedOnly(false);
    setSortBy('featured');
    router.push('/products');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`${
          isOpen
            ? 'fixed inset-y-0 left-0 z-40 w-72'
            : 'hidden lg:block'
        } lg:static lg:w-64 bg-white lg:bg-transparent border-r border-gray-200 lg:border-none p-6 lg:p-0 overflow-y-auto lg:overflow-y-visible`}
      >
        <div className="lg:bg-white lg:border lg:border-gray-200 lg:rounded-2xl lg:p-6 lg:shadow-sm">
          {isOpen && (
            <button
              onClick={onClose}
              aria-label="Close filters"
              className="absolute top-6 right-6 lg:hidden text-gray-400 hover:text-gray-900 p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          <div className="flex items-center gap-2 mb-8 mt-2 lg:mt-0">
            <Filter className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Sort By
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 appearance-none transition"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Category
            </label>
            <div className="space-y-3">
              {CATEGORIES.map((cat) => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      type="radio"
                      name="category"
                      value={cat.toLowerCase()}
                      checked={selectedCategory === cat.toLowerCase()}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-red-500 peer-checked:border-[6px] transition-all"></div>
                  </div>
                  <span className="text-gray-500 group-hover:text-gray-900 transition-colors">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Price Range
            </label>
            <div className="space-y-3">
              {PRICE_RANGES.map((range) => (
                <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      type="radio"
                      name="price"
                      value={range.max}
                      checked={selectedPrice === range.max.toString()}
                      onChange={(e) => setSelectedPrice(e.target.value)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-red-500 peer-checked:border-[6px] transition-all"></div>
                  </div>
                  <span className="text-gray-500 group-hover:text-gray-900 transition-colors">{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:border-red-500 peer-checked:bg-red-500 transition-all flex items-center justify-center">
                  {verifiedOnly && <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>}
                </div>
              </div>
              <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Verified Products Only</span>
            </label>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleFilter}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors shadow-sm"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 py-3 rounded-xl font-semibold transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
