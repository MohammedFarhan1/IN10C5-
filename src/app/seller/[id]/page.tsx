'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Star, CheckCircle, Award, Users, Package } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Product, Seller } from '@/types';

export default function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const { id } = await params;
        const res = await fetch(`/api/sellers/${id}`);
        const data = await res.json();
        if (data.success) {
          setSeller(data.data.seller);
          setProducts(data.data.products || []);
        }
      } catch (error) {
        console.error('Error fetching seller:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSeller();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 rounded-2xl" />
            <div className="h-6 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Brand Owner not found</h1>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Seller Header */}
        <div className="bg-white border-b border-gray-200 py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-start gap-8">
              {seller.logo_url ? (
                <img src={seller.logo_url} alt={seller.business_name} className="w-28 h-28 rounded-2xl object-cover border border-gray-200 shadow-sm" />
              ) : (
                <div className="w-28 h-28 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-4xl font-bold text-red-600">
                  {seller.business_name.charAt(0)}
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{seller.business_name}</h1>
                <div className="flex items-center gap-4 mb-4">
                  {seller.verification_status === 'approved' && (
                    <div className="flex items-center gap-2 bg-green-50 text-green-600 border border-green-100 px-3 py-1 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" /> Verified Brand Owner
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(seller.trust_score / 20) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                    ))}
                    <span className="text-gray-500 text-sm ml-1">{seller.trust_score}% Trust</span>
                  </div>
                </div>

                {seller.description && <p className="text-gray-500 mb-4">{seller.description}</p>}

                <div className="flex gap-8">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Products</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{seller.total_products}+</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Reviews</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{seller.total_reviews.toLocaleString()}</p>
                  </div>
                  {seller.verified_at && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider">Verified Since</p>
                      <p className="text-xl font-bold text-gray-900 mt-0.5">{new Date(seller.verified_at).getFullYear()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats + Products */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-4 mb-10">
            {[
              { icon: Package, label: 'Products', value: seller.total_products, iconCls: 'text-red-600', bgCls: 'bg-red-50' },
              { icon: Users, label: 'Reviews', value: seller.total_reviews, iconCls: 'text-green-600', bgCls: 'bg-green-50' },
              { icon: Award, label: 'Trust Score', value: `${seller.trust_score}%`, iconCls: 'text-purple-600', bgCls: 'bg-purple-50' },
              { icon: CheckCircle, label: 'Status', value: seller.verification_status === 'approved' ? 'Verified' : 'Pending', iconCls: 'text-teal-600', bgCls: 'bg-teal-50' },
            ].map(({ icon: Icon, label, value, iconCls, bgCls }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
                <div className={`w-10 h-10 ${bgCls} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-5 h-5 ${iconCls}`} />
                </div>
                <p className="text-gray-400 text-sm">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-gray-900 font-bold mb-3">About</h3>
              <p className="text-gray-500 text-sm">{seller.description || 'A trusted seller on Trusta marketplace.'}</p>
              {seller.website && (
                <a href={seller.website} target="_blank" rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-700 text-sm mt-3 block transition-colors">
                  {seller.website}
                </a>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-gray-900 font-bold mb-3">Contact</h3>
              <p className="text-red-600 text-sm">{seller.contact_email}</p>
              {seller.contact_phone && <p className="text-gray-500 text-sm mt-1">{seller.contact_phone}</p>}
              {seller.city && <p className="text-gray-400 text-xs mt-2">{seller.city}, {seller.state} {seller.pincode}</p>}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-gray-900 font-bold mb-3">Policies</h3>
              {['30-day return policy', 'Authenticity guaranteed', '24/7 customer support'].map((p) => (
                <div key={p} className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {p}
                </div>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Products from {seller.business_name}</h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">No products available</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
