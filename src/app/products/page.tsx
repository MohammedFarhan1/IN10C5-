'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import FilterBar from '@/components/FilterBar';
import { Package, AlertCircle } from 'lucide-react';
import { Product } from '@/types';
import { useSearchParams } from 'next/navigation';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(false);
      try {
        const queryString = searchParams.toString();
        const res = await fetch(`/api/products?${queryString}`);
        const data = await res.json();
        setProducts(data.data || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  return (
    <main className="flex-1 container mx-auto px-4 py-10">
      {/* Page Header */}
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {searchParams.get('search')
            ? `Results for "${searchParams.get('search')}"`
            : searchParams.get('category')
            ? <span className="capitalize">{searchParams.get('category')} Products</span>
            : 'All Products'}
        </h1>
        <p className="text-gray-500 text-sm">
          Showing {products.length} of {pagination.total} products
        </p>
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-gray-100 border border-gray-200 rounded-2xl h-[340px] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-6 text-sm">Failed to load products. Please check your connection and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors text-sm"
          >
            Try again
          </button>
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-14">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('page', page.toString());
                    window.location.href = `/products?${params.toString()}`;
                  }}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl font-semibold text-sm transition-all ${
                    pagination.page === page
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-red-300 hover:text-red-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
          <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No products found</h2>
          <p className="text-gray-500 text-sm">Try adjusting your filters or search query.</p>
          <button
            onClick={() => window.location.href = '/products'}
            className="mt-5 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </main>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <Suspense
        fallback={
          <main className="flex-1 container mx-auto px-4 py-10">
            <div className="mb-5">
              <div className="h-9 w-52 bg-gray-200 rounded-xl mb-2 animate-pulse" />
              <div className="h-4 w-36 bg-gray-100 rounded-md animate-pulse" />
            </div>
            <div className="flex gap-3 mb-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-gray-100 border border-gray-200 rounded-2xl h-[340px] animate-pulse" />
              ))}
            </div>
          </main>
        }
      >
        <ProductsContent />
      </Suspense>
      <Footer />
    </div>
  );
}
