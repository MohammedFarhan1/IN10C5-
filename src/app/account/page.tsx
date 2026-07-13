import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Package, Heart, MapPin, ShoppingBag, User, ChevronRight, LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';

export default async function AccountPage() {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  const [{ data: profile }, { data: orders }, { data: wishlist }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', session.userId).single(),
    supabase.from('orders').select('id, order_number, status, total, created_at').eq('user_id', session.userId).order('created_at', { ascending: false }).limit(5),
    supabase.from('wishlist_items').select('id').eq('user_id', session.userId),
  ]);

  const STATUS_COLORS: Record<string, string> = {
    pending:          'text-amber-600 bg-amber-50 border-amber-100',
    confirmed:        'text-blue-600 bg-blue-50 border-blue-100',
    delivered:        'text-green-600 bg-green-50 border-green-100',
    cancelled:        'text-red-600 bg-red-50 border-red-100',
    return_requested: 'text-orange-600 bg-orange-50 border-orange-100',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-10">
        {/* Welcome */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-sm">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.name || 'Customer'}!</h1>
              <p className="text-gray-500 text-sm">{session.email}</p>
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-xl transition-colors font-medium text-sm">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </form>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { href: '/account/orders',    icon: Package,    label: 'My Orders',   count: orders?.length ?? 0,   iconBg: 'bg-blue-50',   iconColor: 'text-blue-600' },
            { href: '/account/wishlist',  icon: Heart,      label: 'Wishlist',    count: wishlist?.length ?? 0, iconBg: 'bg-pink-50',   iconColor: 'text-pink-600' },
            { href: '/account/profile',   icon: User,       label: 'Profile',     count: null,                  iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
            { href: '/account/addresses', icon: MapPin,     label: 'Addresses',   count: null,                  iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
            { href: '/my-products',       icon: ShoppingBag,label: 'My Products', count: null,                  iconBg: 'bg-green-50',  iconColor: 'text-green-600' },
          ].map(({ href, icon: Icon, label, count, iconBg, iconColor }) => (
            <Link key={href} href={href}
              className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 group">
              <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-sm">{label}</p>
                {count !== null
                  ? <p className="text-gray-400 text-xs">{count} item{count !== 1 ? 's' : ''}</p>
                  : <p className="text-gray-400 text-xs">Manage details</p>
                }
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-gray-900 font-bold text-base">Recent Orders</h2>
            <Link href="/account/orders" className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {!orders?.length ? (
            <div className="py-14 text-center">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No orders yet.</p>
              <Link href="/products" className="mt-3 inline-block text-red-600 hover:text-red-700 text-sm font-medium transition-colors">
                Start Shopping →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => (
                <Link key={order.id} href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{order.order_number}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_COLORS[order.status] || 'text-gray-500 bg-gray-50 border-gray-100'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <span className="text-gray-900 font-semibold text-sm">₹{order.total.toLocaleString()}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
