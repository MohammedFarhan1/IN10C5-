import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Package, ShoppingBag, TrendingUp, DollarSign, Star, AlertCircle } from 'lucide-react';
import SellerSidebar from '@/components/SellerSidebar';

export default async function SellerDashboardPage() {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  const [{ data: seller }, { data: products }, { data: orders }] = await Promise.all([
    supabase.from('sellers').select('*').eq('id', session.userId).single(),
    supabase.from('products').select('id, name, quantity, sold_count, avg_rating, price, is_active').eq('seller_id', session.userId),
    supabase.from('order_items').select('total, item_status').eq('seller_id', session.userId),
  ]);

  const totalRevenue = orders?.reduce((s, o) => s + o.total, 0) ?? 0;
  const pendingOrders = orders?.filter((o) => o.item_status === 'pending').length ?? 0;
  const totalProducts = products?.length ?? 0;
  const lowStock = products?.filter((p) => p.quantity < 5).length ?? 0;

  const KPI_STYLES: Record<string, { iconBg: string; iconColor: string }> = {
    green:  { iconBg: 'bg-green-50',  iconColor: 'text-green-600' },
    amber:  { iconBg: 'bg-amber-50',  iconColor: 'text-amber-600' },
    blue:   { iconBg: 'bg-blue-50',   iconColor: 'text-blue-600' },
    red:    { iconBg: 'bg-red-50',    iconColor: 'text-red-600' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <SellerSidebar seller={seller} />

          <main className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

            {seller?.verification_status !== 'approved' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-blue-700 font-bold text-base mb-1">Account Pending Approval</h3>
                  <p className="text-blue-600/80 text-sm leading-relaxed max-w-2xl">
                    Your brand owner account is currently <strong>{seller?.verification_status}</strong>.
                    You will be able to add and manage products once your account has been reviewed and approved by the Trusta admin team.
                  </p>
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Revenue',   value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign,  color: 'green', badge: '+12%' },
                { label: 'Pending Orders',  value: pendingOrders,                        icon: ShoppingBag, color: 'amber', badge: null },
                { label: 'Total Products',  value: totalProducts,                        icon: Package,     color: 'blue',  badge: null },
                { label: 'Low Stock Items', value: lowStock,                             icon: TrendingUp,  color: 'red',   badge: null },
              ].map(({ label, value, icon: Icon, color, badge }) => {
                const s = KPI_STYLES[color];
                return (
                  <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 ${s.iconBg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${s.iconColor}`} />
                      </div>
                      {badge && <span className="text-green-600 text-xs font-semibold bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full">{badge}</span>}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-gray-500 text-xs mt-1">{label}</p>
                  </div>
                );
              })}
            </div>

            {/* Top Products */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-gray-900 font-bold">Top Products</h2>
                <Link href="/seller/dashboard/products" className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {products?.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-gray-900 font-medium text-sm">{product.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{product.sold_count} sold · {product.quantity} in stock</p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                        <Star className="w-3 h-3 fill-amber-400" /> {product.avg_rating.toFixed(1)}
                      </div>
                      <span className="text-gray-900 font-semibold text-sm">₹{product.price.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {!products?.length && (
                  <div className="py-12 text-center text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm">No products yet</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
