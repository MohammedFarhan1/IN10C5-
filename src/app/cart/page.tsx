'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Package, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { updateCartItem } from '@/app/actions/customer';
import toast from 'react-hot-toast';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.success) {
        setCartItems(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    const res = await updateCartItem(productId, newQuantity);
    if (res.success) {
      fetchCart();
    } else {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemove = async (productId: string) => {
    const res = await updateCartItem(productId, 0);
    if (res.success) {
      fetchCart();
      toast.success('Item removed');
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6 text-sm">Looks like you haven't added anything to your cart yet.</p>
            <Link href="/products" className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-5 items-center hover:shadow-sm transition-shadow">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
                    {item.product.thumbnail ? (
                      <img src={item.product.thumbnail} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-7 h-7 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Link href={`/product/${item.product.id}`} className="text-base font-semibold text-gray-900 hover:text-red-600 transition-colors block mb-1">
                      {item.product.name}
                    </Link>
                    <p className="text-red-600 font-bold text-sm mb-3">₹{item.product.price.toLocaleString()}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-200 transition-colors text-sm font-semibold">−</button>
                        <span className="px-3 text-gray-900 text-sm font-medium border-x border-gray-200">{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-200 transition-colors text-sm font-semibold">+</button>
                      </div>
                      <button onClick={() => handleRemove(item.product.id)} className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-medium">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 font-bold">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 h-fit sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Subtotal</span>
                  <span className="text-gray-900 font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="text-gray-900 font-bold">Total</span>
                  <span className="text-xl font-bold text-gray-900">₹{subtotal.toLocaleString()}</span>
                </div>
              </div>
              <Link href="/checkout" className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm text-sm">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
