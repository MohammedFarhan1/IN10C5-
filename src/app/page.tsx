'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Shield, TrendingUp, Award, Zap, ArrowRight, Package, Search, Store } from 'lucide-react';
import { Product } from '@/types';
import Link from 'next/link';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const featuredRes = await fetch('/api/products?sortBy=featured&limit=4');
        const featuredData = await featuredRes.json();
        setFeaturedProducts(featuredData.data || []);

        const trendingRes = await fetch('/api/products?sortBy=trending&verified=true&limit=4');
        const trendingData = await trendingRes.json();
        setTrendingProducts(trendingData.data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header showCategoryMenu={false} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-14 lg:py-20 border-b border-gray-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(220,38,38,0.06),transparent)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-sm font-semibold mb-6 w-fit">
                <Shield className="w-4 h-4" /> The future of authentic commerce
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                Buy <span className="text-red-600">Authentic</span><br />
                Products with<br />Confidence.
              </h1>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-xl">
                Trusta ensures every product is verified, every brand owner is trusted, and every purchase is tracked via immutable digital certificates from manufacturer to your door.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-7 py-3.5 rounded-xl font-semibold transition-colors shadow-sm"
                >
                  <Search className="w-5 h-5" /> Explore Products
                </Link>
                <Link
                  href="/signup/seller"
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 px-7 py-3.5 rounded-xl font-semibold transition-colors"
                >
                  <Store className="w-5 h-5" /> Become a Brand Owner
                </Link>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hidden md:flex items-center justify-center lg:justify-end">
              <img
                src="/images/home-mockup.png"
                alt="Trusta mobile app"
                className="w-full max-w-[460px] lg:max-w-[580px] h-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
            <p className="text-gray-500">Handpicked authentic items from our highest-rated verified sellers.</p>
          </div>
          <Link href="/products?sortBy=featured" className="group flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold transition-colors text-sm">
            View Collection <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 border border-gray-200 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No featured products available at the moment.</p>
          </div>
        )}
      </section>

      {/* Why Trust Trusta */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Trust Trusta?</h2>
            <p className="text-gray-500 text-lg">We've eliminated counterfeit products from the equation. Every item comes with a verifiable digital certificate of authenticity.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                iconBg: 'bg-red-50', iconColor: 'text-red-600',
                title: 'Authenticity Verified',
                desc: 'Each product undergoes rigorous verification with detailed certificates and full traceability from manufacturer to delivery.',
              },
              {
                icon: Award,
                iconBg: 'bg-green-50', iconColor: 'text-green-600',
                title: 'Brand Owner Verification',
                desc: 'All brand owners are thoroughly vetted with trust scores, verified reviews, and strict accountability measures in place.',
              },
              {
                icon: Zap,
                iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
                title: 'Real-Time Tracking',
                desc: 'Track your product\'s complete journey from manufacture to delivery with transparent status updates.',
              },
            ].map(({ icon: Icon, iconBg, iconColor, title, desc }) => (
              <div key={title} className="bg-white border border-gray-200 p-7 rounded-2xl hover:shadow-md hover:border-gray-300 transition-all duration-200">
                <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-5`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Verified Products */}
      <section className="py-20 container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Trending Now</h2>
            <p className="text-gray-500">The most sought-after authentic products on the platform right now.</p>
          </div>
          <Link href="/products?verified=true&sortBy=trending" className="group flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold transition-colors text-sm">
            View All Trending <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 border border-gray-200 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : trendingProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl">
            <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No trending products available at the moment.</p>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-500 text-lg">A flawless chain of custody ensuring you get exactly what you paid for.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-5 relative">
            <div className="hidden md:block absolute top-8 left-[14%] right-[14%] h-px bg-gray-200" />
            {[
              { step: '01', title: 'Manufacturing', desc: 'Products receive unique serialization at the source.' },
              { step: '02', title: 'Verification',  desc: 'Auditors sign the product batches before listing.' },
              { step: '03', title: 'Listing',        desc: 'Verified brand owners list items with strict guarantees.' },
              { step: '04', title: 'Delivery',       desc: 'You receive delivery with full proof of authenticity.' },
            ].map((item, i) => (
              <div key={i} className="relative z-10 bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-md hover:border-gray-300 transition-all duration-200">
                <div className="w-16 h-16 mx-auto bg-red-600 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-sm mb-5">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verify Product CTA */}
      <section className="py-14 container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 p-10 lg:p-12 flex flex-col lg:flex-row items-center gap-8 justify-between">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-red-600 text-xs font-semibold uppercase tracking-wider mb-4">
              <Shield className="w-3.5 h-3.5" /> Product Authenticity
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Got a product? Verify it.</h2>
            <p className="text-gray-500 max-w-lg text-sm">
              Enter the Verification ID on your product to instantly confirm it's genuine, view ownership history, and register your purchase.
            </p>
          </div>
          <div className="w-full lg:w-auto flex-shrink-0">
            <VerifyInput />
          </div>
        </div>
      </section>

      {/* Dual CTA Section */}
      <section className="pb-20 container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="relative overflow-hidden rounded-2xl bg-red-600 p-10 text-center md:text-left flex flex-col items-center md:items-start justify-center">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-red-500/30 blur-[60px] rounded-full pointer-events-none" />
            <h2 className="text-2xl font-bold text-white mb-3 relative z-10">Start Shopping</h2>
            <p className="text-red-100 mb-7 max-w-sm relative z-10 text-sm">
              Join thousands of satisfied customers who shop with absolute confidence.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-red-600 hover:bg-red-50 px-6 py-3 rounded-xl font-bold transition-colors relative z-10 text-sm shadow-sm"
            >
              Explore Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gray-900 p-10 text-center md:text-left flex flex-col items-center md:items-start justify-center">
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gray-700/50 blur-[60px] rounded-full pointer-events-none" />
            <h2 className="text-2xl font-bold text-white mb-3 relative z-10">Sell with Trusta</h2>
            <p className="text-gray-400 mb-7 max-w-sm relative z-10 text-sm">
              Reach thousands of customers looking for authentic products and build your reputation.
            </p>
            <Link
              href="/signup/seller"
              className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-xl font-bold transition-colors relative z-10 text-sm shadow-sm"
            >
              Start Selling <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function VerifyInput() {
  const [value, setValue] = useState('');
  const router = useRouter();
  const handleVerify = () => {
    const code = value.trim().toUpperCase();
    if (code) router.push(`/verify/${code}`);
    else router.push('/verify');
  };
  return (
    <div className="flex gap-2 w-full lg:w-96">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && handleVerify()}
        placeholder="TRU-IP16-BLK128-000001"
        className="flex-1 px-4 py-3 bg-white border border-red-200 rounded-xl text-gray-900 font-mono text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition shadow-sm"
      />
      <button
        onClick={handleVerify}
        className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
      >
        <Shield className="w-4 h-4" /> Verify
      </button>
    </div>
  );
}
