'use client';

import Link from 'next/link';
import { Star, TrendingUp, Package } from 'lucide-react';
import { Product } from '@/types';

export default function ProductCard({ product }: { product: Product }) {
  const discountPercent = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  return (
    <Link href={`/product/${product.id}`} className="group block h-full">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden h-full transition-all duration-300 hover:shadow-lg hover:shadow-gray-200 hover:-translate-y-0.5 hover:border-gray-300">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.thumbnail || product.images?.[0] ? (
            <img
              src={product.thumbnail ?? product.images[0]}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          )}

          {/* Rating badge */}
          <div className="absolute bottom-3 left-3 bg-white shadow-md rounded-lg px-2 py-1 flex items-center gap-1 border border-gray-100">
            <span className="text-sm font-bold text-gray-900">{product.avg_rating.toFixed(1)}</span>
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </div>

          {/* Trending badge */}
          {product.trending && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="bg-red-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Trending
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">
            {product.category}
          </p>
          <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors h-10 text-sm">
            {product.name}
          </h3>

          {/* Pricing */}
          <div className="mt-auto flex items-center gap-2 flex-wrap">
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-sm text-gray-400 line-through">
                ₹{product.compare_price.toLocaleString()}
              </span>
            )}
            <span className="text-lg font-bold text-gray-900">
              ₹{product.price.toLocaleString()}
            </span>
            {discountPercent > 0 && (
              <span className="text-green-700 text-xs font-bold bg-green-50 border border-green-100 px-1.5 py-0.5 rounded">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
