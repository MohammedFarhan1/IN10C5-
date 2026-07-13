'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { placeOrder, addAddress } from '@/app/actions/customer';
import { MapPin, Plus, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [cartRes, addrRes] = await Promise.all([
        fetch('/api/cart'),
        fetch('/api/addresses')
      ]);
      const cartData = await cartRes.json();
      const addrData = await addrRes.json();

      if (cartData.success) setCartItems(cartData.data);
      if (addrData.success) {
        setAddresses(addrData.data);
        if (addrData.data.length > 0) {
          setSelectedAddress(addrData.data[0].id);
        } else {
          setShowAddAddress(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await addAddress(formData);
    if (res.success) {
      toast.success('Address added successfully');
      setShowAddAddress(false);
      fetchData();
    } else {
      toast.error(res.error || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a shipping address');
      return;
    }

    setPlacingOrder(true);
    const formData = new FormData();
    formData.append('addressId', selectedAddress);
    formData.append('notes', notes);

    const res = await placeOrder(formData);
    if (res.success) {
      toast.success('Order placed successfully!');
      router.push(`/account/orders`);
    } else {
      toast.error(res.error || 'Failed to place order');
      setPlacingOrder(false);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Address Selection */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" /> Shipping Address
                </h2>
                {!showAddAddress && (
                  <button onClick={() => setShowAddAddress(true)} className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 transition-colors">
                    <Plus className="w-4 h-4" /> Add New
                  </button>
                )}
              </div>

              {showAddAddress ? (
                <form onSubmit={handleAddAddress} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input name="name" required placeholder="Full Name" className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition" />
                    <input name="mobile" required placeholder="Mobile Number" className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition" />
                    <input name="line1" required placeholder="Address Line 1" className="col-span-2 w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition" />
                    <input name="line2" placeholder="Address Line 2 (Optional)" className="col-span-2 w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition" />
                    <input name="city" required placeholder="City" className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition" />
                    <input name="state" required placeholder="State" className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition" />
                    <input name="pincode" required placeholder="Pincode" className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition" />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button type="submit" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors shadow-sm text-sm">Save Address</button>
                    {addresses.length > 0 && (
                      <button type="button" onClick={() => setShowAddAddress(false)} className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl font-semibold transition-colors text-sm">Cancel</button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      className={`cursor-pointer p-4 rounded-xl border transition relative ${
                        selectedAddress === addr.id
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      {selectedAddress === addr.id && <CheckCircle2 className="w-5 h-5 text-red-600 absolute top-4 right-4" />}
                      <p className="text-gray-900 font-bold mb-1">{addr.name} <span className="text-gray-400 font-normal ml-2">{addr.mobile}</span></p>
                      <p className="text-gray-600 text-sm">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                      <p className="text-gray-600 text-sm">{addr.city}, {addr.state} {addr.pincode}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Items Review */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
              <div className="space-y-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                      {item.product.thumbnail && <img src={item.product.thumbnail} alt={item.product.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{item.product.name}</p>
                      <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 font-bold">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 h-fit sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="text-gray-900 font-medium">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                <span className="text-gray-900 font-bold">Total</span>
                <span className="text-2xl font-bold text-red-600">₹{subtotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-500 text-sm mb-2">Order Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500/30 focus:border-red-400 focus:outline-none min-h-[100px] text-sm transition"
                placeholder="Any special instructions for delivery..."
              />
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder || !selectedAddress || cartItems.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-sm"
            >
              {placingOrder ? 'Processing...' : 'Place Order'} <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-center text-gray-400 text-xs mt-4">
              By placing your order, you agree to our Terms of Service and Privacy Policy. Payment is Cash on Delivery.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
