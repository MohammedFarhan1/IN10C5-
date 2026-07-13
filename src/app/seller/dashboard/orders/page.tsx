import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SellerSidebar from '@/components/SellerSidebar';
import { Package } from 'lucide-react';
import StatusSelector from './StatusSelector';

export default async function SellerOrdersPage() {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  const [{ data: seller }, { data: orderItems }] = await Promise.all([
    supabase.from('sellers').select('*').eq('id', session.userId).single(),
    supabase.from('order_items').select('*, order:orders(*)').eq('seller_id', session.userId).order('id', { ascending: false }),
  ]);

  const statusStyle = (status: string) => {
    if (status === 'delivered') return 'bg-green-50 text-green-600 border-green-100';
    if (status === 'dispatched') return 'bg-blue-50 text-blue-600 border-blue-100';
    if (status === 'cancelled') return 'bg-red-50 text-red-600 border-red-100';
    return 'bg-amber-50 text-amber-600 border-amber-100';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <SellerSidebar seller={seller} />

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-gray-400 text-xs uppercase tracking-widest">
                      <th className="px-6 py-3 font-semibold">Order ID</th>
                      <th className="px-6 py-3 font-semibold">Product</th>
                      <th className="px-6 py-3 font-semibold">Qty</th>
                      <th className="px-6 py-3 font-semibold">Total</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {!orderItems?.length ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                          <Package className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                          <p>No orders yet.</p>
                        </td>
                      </tr>
                    ) : (
                      orderItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-gray-900 font-semibold text-sm">
                            {(item.order as any).order_number}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                                {item.product_image
                                  ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                  : <Package className="w-5 h-5 m-2.5 text-gray-300" />
                                }
                              </div>
                              <span className="text-gray-900 font-medium text-sm max-w-[200px] truncate">{item.product_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{item.quantity}</td>
                          <td className="px-6 py-4 text-gray-900 font-semibold">₹{item.total.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle(item.item_status)}`}>
                              {item.item_status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <StatusSelector itemId={item.id} currentStatus={item.item_status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
