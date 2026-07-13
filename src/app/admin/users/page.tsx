import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { banUser, resetUserAccount } from '@/app/actions/admin';
import { ShieldOff, ShieldCheck, RotateCcw, User, Eye, Users, Store, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import DeleteUserButton from './DeleteUserButton';
import NewUserModal from './NewUserModal';
import AdminSidebar from '@/components/AdminSidebar';

type Tab = 'customers' | 'sellers' | 'admins';

const TABS: { key: Tab; label: string; role: string; icon: typeof Users }[] = [
  { key: 'customers', label: 'Customers', role: 'customer', icon: Users },
  { key: 'sellers',   label: 'Brand Owners', role: 'seller',   icon: Store },
  { key: 'admins',    label: 'Admins',    role: 'admin',    icon: ShieldAlert },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireRole('admin');
  const { tab: tabParam } = await searchParams;
  const activeTab: Tab = (TABS.find(t => t.key === tabParam)?.key) ?? 'customers';
  const activeRole = TABS.find(t => t.key === activeTab)!.role;

  const supabase = createAdminClient();

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', activeRole)
    .order('created_at', { ascending: false })
    .limit(100);

  let sellerMap: Record<string, string> = {};
  if (activeTab === 'sellers' && users?.length) {
    const ids = users.map(u => u.id);
    const { data: sellers } = await supabase
      .from('sellers')
      .select('id, business_name')
      .in('id', ids);
    sellerMap = Object.fromEntries((sellers ?? []).map(s => [s.id, s.business_name]));
  }

  const counts = await Promise.all(
    TABS.map(t =>
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', t.role)
        .then(r => ({ key: t.key, count: r.count ?? 0 }))
    )
  );
  const countMap = Object.fromEntries(counts.map(c => [c.key, c.count]));

  const tabIconColor: Record<Tab, string> = {
    customers: 'text-blue-600 bg-blue-50',
    sellers:   'text-green-600 bg-green-50',
    admins:    'text-red-600 bg-red-50',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showCategoryMenu={false} />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar />

          <main className="flex-1">
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <NewUserModal />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
              {TABS.map(({ key, label, icon: Icon }) => (
                <Link
                  key={key}
                  href={`/admin/users?tab=${key}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    activeTab === key
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold ${
                    activeTab === key
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {countMap[key]}
                  </span>
                </Link>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-widest bg-gray-50">
                      <th className="px-6 py-3 text-left font-semibold">User</th>
                      {activeTab === 'sellers' && (
                        <th className="px-6 py-3 text-left font-semibold">Business</th>
                      )}
                      <th className="px-6 py-3 text-left font-semibold">Joined</th>
                      <th className="px-6 py-3 text-left font-semibold">Status</th>
                      <th className="px-6 py-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users?.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tabIconColor[activeTab]}`}>
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <Link
                                href={`/admin/users/${user.id}`}
                                className="text-gray-900 font-medium hover:text-red-600 transition-colors"
                              >
                                {user.name || 'Unknown'}
                              </Link>
                              <p className="text-gray-400 text-xs">{user.id.slice(0, 8)}…</p>
                            </div>
                          </div>
                        </td>

                        {activeTab === 'sellers' && (
                          <td className="px-6 py-4 text-gray-700 text-sm">
                            {sellerMap[user.id] || <span className="text-gray-400 italic">Not set</span>}
                          </td>
                        )}

                        <td className="px-6 py-4 text-gray-400 text-xs">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4">
                          {user.banned ? (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 font-medium">
                              Banned
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 font-medium">
                              Active
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/admin/users/${user.id}`}
                              title="View Details"
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            {activeTab !== 'admins' && (
                              <>
                                <form action={async () => { 'use server'; await banUser(user.id, !user.banned); }}>
                                  <button
                                    type="submit"
                                    title={user.banned ? 'Unban' : 'Ban'}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      user.banned
                                        ? 'bg-green-50 hover:bg-green-100 text-green-600'
                                        : 'bg-red-50 hover:bg-red-100 text-red-600'
                                    }`}
                                  >
                                    {user.banned ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                                  </button>
                                </form>
                                <form action={async () => { 'use server'; await resetUserAccount(user.id); }}>
                                  <button
                                    type="submit"
                                    title="Send Password Reset"
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                </form>
                                <DeleteUserButton userId={user.id} />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {!users?.length && (
                      <tr>
                        <td colSpan={activeTab === 'sellers' ? 5 : 4} className="px-6 py-16 text-center text-gray-400">
                          <User className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                          <p className="font-medium">No {activeTab} found</p>
                        </td>
                      </tr>
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
