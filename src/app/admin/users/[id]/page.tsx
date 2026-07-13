import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { User, Mail, Calendar, Briefcase, ShoppingBag, ShieldCheck, ShieldOff } from 'lucide-react';
import Link from 'next/link';

export default async function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin');
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();

  const { data: authUser } = await supabase.auth.admin.getUserById(id);
  const email = authUser?.user?.email || 'Unknown Email';

  let sellerData = null;
  let productsCount = 0;
  if (profile?.role === 'seller') {
    const { data: s } = await supabase.from('sellers').select('*').eq('id', id).single();
    sellerData = s;
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('seller_id', id);
    productsCount = count || 0;
  }

  let ordersCount = 0;
  if (profile?.role === 'customer') {
    const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', id);
    ordersCount = count || 0;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
        <Link href="/admin/users" className="text-red-600 hover:text-red-700 font-medium transition-colors">Return to User Management</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showCategoryMenu={false} />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar />

          <main className="flex-1 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Link href="/admin/users" className="text-gray-400 hover:text-gray-900 transition-colors">Users</Link>
                <span className="text-gray-300">/</span>
                User Details
              </h1>
              {profile.banned ? (
                <span className="px-4 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-sm font-medium flex items-center gap-2">
                  <ShieldOff className="w-4 h-4" /> Account Banned
                </span>
              ) : (
                <span className="px-4 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-100 text-sm font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Active Account
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Main Profile Card */}
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                  <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile.name || 'Unnamed User'}</h2>
                    <p className="text-gray-500 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> {email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">User ID</p>
                    <p className="text-gray-900 font-mono text-sm break-all">{profile.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Role</p>
                    <p className="text-gray-900 capitalize font-medium">{profile.role}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1 flex items-center gap-2"><Calendar className="w-4 h-4" /> Joined Date</p>
                    <p className="text-gray-700">{new Date(profile.created_at).toLocaleDateString()} {new Date(profile.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>

              {/* Role Specific Stats Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Account Statistics</h3>

                  {profile.role === 'seller' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Business Name</p>
                          <p className="text-gray-900 font-bold">{sellerData?.business_name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Total Products</p>
                          <p className="text-gray-900 font-bold">{productsCount}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.role === 'customer' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Total Orders</p>
                          <p className="text-gray-900 font-bold">{ordersCount}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.role === 'admin' && (
                    <div className="text-gray-500 text-sm">
                      System Administrator Account. Full access granted.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
