import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Package, ChevronRight, XCircle, RotateCcw } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  pending:          'bg-amber-50 text-amber-600 border-amber-100',
  confirmed:        'bg-blue-50 text-blue-600 border-blue-100',
  processing:       'bg-blue-50 text-blue-600 border-blue-100',
  dispatched:       'bg-indigo-50 text-indigo-600 border-indigo-100',
  in_transit:       'bg-purple-50 text-purple-600 border-purple-100',
  delivered:        'bg-green-50 text-green-600 border-green-100',
  cancelled:        'bg-red-50 text-red-600 border-red-100',
  return_requested: 'bg-orange-50 text-orange-600 border-orange-100',
  returned:         'bg-gray-100 text-gray-500 border-gray-200',
  refunded:         'bg-teal-50 text-teal-600 border-teal-100',
};

export default async function OrdersPage() {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(id, product_name, product_image, quantity, unit_price, item_status)')
    .eq('user_id', session.userId)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Orders</h1>

        {!orders?.length ? (
          <div className="text-center py-20">
            <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-2">No orders yet</p>
            <Link href="/products" className="inline-block mt-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow">
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-gray-900 font-semibold">{order.order_number}</p>
                      <p className="text-gray-400 text-xs">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_BADGE[order.status] || STATUS_BADGE.pending}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-900 font-bold">₹{order.total.toLocaleString()}</span>
                    <Link href={`/account/orders/${order.id}`} className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium transition-colors">
                      Details <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="px-6 py-4">
                  <div className="flex gap-4 flex-wrap">
                    {(order.order_items as Array<{ product_image: string; product_name: string; quantity: number; unit_price: number }>)
                      ?.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {item.product_image && (
                          <img src={item.product_image} alt={item.product_name}
                            className="w-11 h-11 object-cover rounded-lg bg-gray-100 border border-gray-200" />
                        )}
                        <div>
                          <p className="text-gray-900 text-sm font-medium line-clamp-1">{item.product_name}</p>
                          <p className="text-gray-400 text-xs">Qty: {item.quantity} · ₹{item.unit_price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    {(order.order_items?.length ?? 0) > 3 && (
                      <span className="text-gray-400 text-sm self-center">+{(order.order_items?.length ?? 0) - 3} more</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {['pending', 'confirmed'].includes(order.status) && (
                  <div className="px-6 py-3 border-t border-gray-100 flex gap-3">
                    <Link href={`/account/orders/${order.id}?action=cancel`}
                      className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm font-medium transition-colors">
                      <XCircle className="w-4 h-4" /> Cancel Order
                    </Link>
                  </div>
                )}
                {order.status === 'delivered' && (
                  <div className="px-6 py-3 border-t border-gray-100 flex gap-3">
                    <Link href={`/account/orders/${order.id}?action=return`}
                      className="flex items-center gap-1.5 text-orange-500 hover:text-orange-700 text-sm font-medium transition-colors">
                      <RotateCcw className="w-4 h-4" /> Return Order
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
