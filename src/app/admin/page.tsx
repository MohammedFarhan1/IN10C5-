import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Users, Store, Package, AlertTriangle, TrendingUp, CheckCircle, ShieldAlert, Clock } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

export default async function AdminDashboardPage() {
  await requireRole('admin');
  const supabase = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalSellers },
    { count: totalProducts },
    { count: pendingSellers },
    { count: openReports },
    { data: recentReports },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('sellers').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('sellers').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('fraud_reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('fraud_reports').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(5),
  ]);

  const KPI_STYLES: Record<string, { iconBg: string; iconColor: string; badge: string }> = {
    blue:   { iconBg: 'bg-blue-50',   iconColor: 'text-blue-600',   badge: 'text-blue-600 bg-blue-50 border-blue-100' },
    green:  { iconBg: 'bg-green-50',  iconColor: 'text-green-600',  badge: 'text-green-600 bg-green-50 border-green-100' },
    purple: { iconBg: 'bg-purple-50', iconColor: 'text-purple-600', badge: 'text-purple-600 bg-purple-50 border-purple-100' },
    amber:  { iconBg: 'bg-amber-50',  iconColor: 'text-amber-600',  badge: 'text-amber-600 bg-amber-50 border-amber-100' },
    red:    { iconBg: 'bg-red-50',    iconColor: 'text-red-600',    badge: 'text-red-600 bg-red-50 border-red-100' },
    teal:   { iconBg: 'bg-teal-50',   iconColor: 'text-teal-600',   badge: 'text-teal-600 bg-teal-50 border-teal-100' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showCategoryMenu={false} />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar />

          <main className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Overview</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Users',              value: totalUsers   ?? 0,    icon: Users,         color: 'blue' },
                { label: 'Total Brand Owners',       value: totalSellers ?? 0,    icon: Store,         color: 'green' },
                { label: 'Total Products',           value: totalProducts ?? 0,   icon: Package,       color: 'purple' },
                { label: 'Pending Verifications',    value: pendingSellers ?? 0,  icon: Clock,         color: 'amber', href: '/admin/sellers?filter=pending' },
                { label: 'Open Fraud Reports',       value: openReports   ?? 0,   icon: AlertTriangle, color: 'red',   href: '/admin/fraud' },
                { label: 'Platform Health',          value: '98.2%',              icon: TrendingUp,    color: 'teal' },
              ].map(({ label, value, icon: Icon, color, href }) => {
                const s = KPI_STYLES[color];
                const card = (
                  <div className={`bg-white border border-gray-200 rounded-2xl p-5 transition-all ${href ? 'hover:shadow-md hover:border-gray-300 cursor-pointer' : ''}`}>
                    <div className={`w-9 h-9 ${s.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className={`w-4 h-4 ${s.iconColor}`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-gray-500 text-xs mt-1">{label}</p>
                  </div>
                );
                return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>;
              })}
            </div>

            {/* Fraud Alerts */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-gray-900 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Recent Fraud Reports
                </h2>
                <Link href="/admin/fraud" className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors">View all →</Link>
              </div>
              {!recentReports?.length ? (
                <div className="py-12 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No open fraud reports — platform is clean!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentReports.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-gray-900 text-sm font-medium capitalize">{r.reported_type} report</p>
                        <p className="text-gray-400 text-xs mt-0.5">{r.reason}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full font-medium">{r.status}</span>
                        <Link href="/admin/fraud" className="text-red-600 hover:text-red-700 text-xs font-medium transition-colors">Review →</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
