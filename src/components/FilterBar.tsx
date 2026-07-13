'use client';

import { useState } from 'react';
import { SlidersHorizontal, ChevronDown, Shield } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = ['Electronics', 'Automotive', 'Furniture', 'Appliances', 'Jewelry', 'Fashion'];
const PRICE_RANGES = [
  { label: 'All',             value: '' },
  { label: 'Under ₹1,000',   value: '1000' },
  { label: '₹1,000–₹5,000',  value: '5000' },
  { label: '₹5,000–₹10,000', value: '10000' },
  { label: '₹10,000–₹50,000',value: '50000' },
  { label: 'Over ₹50,000',   value: 'Infinity' },
];
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'trending', label: 'Trending' },
  { value: 'price',    label: 'Price: Low to High' },
  { value: 'newest',   label: 'Newest' },
];
const RATING_OPTIONS = [
  { label: 'All',    value: '' },
  { label: '4★ & up', value: '4' },
  { label: '3★ & up', value: '3' },
  { label: '2★ & up', value: '2' },
];

const selectCls = 'bg-transparent text-gray-700 focus:outline-none cursor-pointer appearance-none pr-4 text-sm';

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sortBy,      setSortBy]      = useState(searchParams.get('sortBy')    || 'featured');
  const [category,    setCategory]    = useState(searchParams.get('category')  || '');
  const [maxPrice,    setMaxPrice]    = useState(searchParams.get('maxPrice')  || '');
  const [minRating,   setMinRating]   = useState(searchParams.get('minRating') || '');
  const [verifiedOnly,setVerifiedOnly]= useState(searchParams.get('verified')  === 'true');

  const push = (overrides: Record<string, string | boolean> = {}) => {
    const next = { sortBy, category, maxPrice, minRating, verified: verifiedOnly, ...overrides };
    const params = new URLSearchParams();
    if (next.sortBy && next.sortBy !== 'featured') params.set('sortBy', next.sortBy as string);
    if (next.category)  params.set('category',  next.category as string);
    if (next.maxPrice)  params.set('maxPrice',  next.maxPrice as string);
    if (next.minRating) params.set('minRating', next.minRating as string);
    if (next.verified)  params.set('verified',  'true');
    router.push(`/products?${params.toString()}`);
  };

  const Dropdown = ({ label, value, onChange, children }: {
    label?: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
  }) => (
    <div className="relative flex items-center gap-1 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm">
      {label && <span className="text-gray-400 mr-0.5">{label}</span>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={selectCls}
      >
        {children}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-gray-400 pointer-events-none -ml-2 flex-shrink-0" />
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-8 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
      {/* Label */}
      <div className="flex items-center gap-2 px-3.5 py-2 border border-red-200 bg-red-50 rounded-xl text-red-600 font-semibold text-sm">
        <SlidersHorizontal className="w-4 h-4" />
        Filters
      </div>

      {/* Sort */}
      <Dropdown label="Sort by:" value={sortBy} onChange={v => { setSortBy(v); push({ sortBy: v }); }}>
        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Dropdown>

      {/* Category */}
      <Dropdown value={category} onChange={v => { setCategory(v); push({ category: v }); }}>
        <option value="">All Categories</option>
        {CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
      </Dropdown>

      {/* Price */}
      <Dropdown label="Price:" value={maxPrice} onChange={v => { setMaxPrice(v); push({ maxPrice: v }); }}>
        {PRICE_RANGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
      </Dropdown>

      {/* Rating */}
      <Dropdown label="Rating:" value={minRating} onChange={v => { setMinRating(v); push({ minRating: v }); }}>
        {RATING_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
      </Dropdown>

      {/* Verified Only toggle */}
      <label className="ml-auto flex items-center gap-2.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer shadow-sm select-none">
        <Shield className="w-4 h-4 text-gray-400" />
        <span className="font-medium">Verified Only</span>
        <button
          type="button"
          role="switch"
          aria-checked={verifiedOnly}
          onClick={() => { setVerifiedOnly(!verifiedOnly); push({ verified: !verifiedOnly }); }}
          className={`relative inline-flex items-center rounded-full transition-colors focus:outline-none ${verifiedOnly ? 'bg-red-600' : 'bg-gray-200'}`}
          style={{ minWidth: '2.5rem', height: '1.375rem' }}
        >
          <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${verifiedOnly ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </label>
    </div>
  );
}
