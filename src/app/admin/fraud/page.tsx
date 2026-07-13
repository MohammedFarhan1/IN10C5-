import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { resolveReport } from '@/app/actions/admin';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export default async function AdminFraudPage() {
  await requireRole('admin');
  const supabase = createAdminClient();

  const { data: reports } = await supabase
    .from('fraud_reports')
    .select('*, reporter:profiles(name, email)')
    .order('created_at', { ascending: false });

  const { data: units } = await supabase
    .from('tracked_units')
    .select(`
      *,
      product:products(name, category),
      seller:sellers(business_name)
    `)
    .or('fraud_flag.eq.true,scan_count.gt.5,verification_status.eq.COUNTERFEIT,verification_status.eq.SUSPICIOUS')
    .order('updated_at', { ascending: false })
    .limit(30);

  const { data: scanLogs } = await supabase
    .from('verification_logs')
    .select('*')
    .order('scanned_at', { ascending: false })
    .limit(15);

  const flaggedUnits = units || [];
  const logs = scanLogs || [];

  async function handleRevoke(formData: FormData) {
    'use server';
    const code = formData.get('unitCode') as string;
    if (!code) return;
    const client = createAdminClient();
    await client.from('tracked_units').update({ verification_status: 'REVOKED', fraud_flag: true }).eq('unique_unit_code', code);
    revalidatePath('/admin/fraud');
  }

  async function handleBlacklist(formData: FormData) {
    'use server';
    const code = formData.get('unitCode') as string;
    if (!code) return;
    const client = createAdminClient();
    await client.from('tracked_units').update({ verification_status: 'COUNTERFEIT', fraud_flag: true }).eq('unique_unit_code', code);
    revalidatePath('/admin/fraud');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showCategoryMenu={false} />

      <div className="container mx-auto px-4 py-10 flex-1 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar />

          <main className="flex-1 space-y-10">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold uppercase tracking-wider mb-2">
                <ShieldAlert className="w-3.5 h-3.5" /> Fraud Controls
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Trust & Fraud Controls Center
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Moderating counterfeit observations, impossible-travel flags, and dynamic unit key states.
              </p>
            </div>

            {/* High-Risk Units Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> High-Risk Serial Passports
                </h2>
                <span className="text-xs text-gray-400">Trigger thresholds: Scans &gt; 5 or Active Flag</span>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Identity Code</th>
                        <th className="px-6 py-4 font-semibold">Product</th>
                        <th className="px-6 py-4 font-semibold">State</th>
                        <th className="px-6 py-4 text-center font-semibold">Scans</th>
                        <th className="px-6 py-4 font-semibold">Last Location</th>
                        <th className="px-6 py-4 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {flaggedUnits.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                            No suspicious unit metrics tracked currently.
                          </td>
                        </tr>
                      ) : (
                        flaggedUnits.map((u) => {
                          const p = u.product as any;
                          const s = u.seller as any;
                          const isCounterfeit = u.verification_status === 'COUNTERFEIT';

                          return (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-mono">
                                <Link href={`/verify/${u.unique_unit_code}`} className="text-red-600 hover:underline block font-bold">
                                  {u.unique_unit_code}
                                </Link>
                                <span className="text-gray-400 text-[10px] block mt-0.5">{u.serial_number}</span>
                              </td>
                              <td className="px-6 py-4 max-w-xs truncate">
                                <p className="text-gray-900 font-medium">{p?.name || 'General Product'}</p>
                                <p className="text-gray-400 text-[10px]">Merchant: {s?.business_name || 'System Source'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full font-semibold text-[9px] uppercase tracking-wider border ${
                                  isCounterfeit ? 'bg-red-50 text-red-600 border-red-100' :
                                  u.verification_status === 'SUSPICIOUS' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  u.verification_status === 'REVOKED' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                  'bg-gray-50 text-gray-500 border-gray-100'
                                }`}>
                                  {u.verification_status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center font-mono font-bold text-gray-700">
                                {u.scan_count}
                              </td>
                              <td className="px-6 py-4 text-gray-500 text-[11px]">
                                {u.last_scan_location || 'Unindexed'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {u.verification_status !== 'REVOKED' && (
                                    <form action={handleRevoke}>
                                      <input type="hidden" name="unitCode" value={u.unique_unit_code} />
                                      <button type="submit" title="Revoke passport access"
                                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-100 rounded-lg font-medium transition-colors text-xs">
                                        Revoke
                                      </button>
                                    </form>
                                  )}
                                  {u.verification_status !== 'COUNTERFEIT' && (
                                    <form action={handleBlacklist}>
                                      <input type="hidden" name="unitCode" value={u.unique_unit_code} />
                                      <button type="submit" title="Mark as Counterfeit"
                                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg font-bold transition-colors text-xs">
                                        Blacklist
                                      </button>
                                    </form>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Audit Logs & Reports */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Telemetry Logs */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Recent Telemetry Scans</h3>

                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 max-h-96 overflow-y-auto shadow-sm">
                  {logs.length === 0 ? (
                    <p className="text-gray-400 text-xs text-center py-4">No scan queries captured in log.</p>
                  ) : (
                    logs.map((l) => (
                      <div key={l.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-mono">
                        <div className="space-y-0.5 truncate flex-1 pr-2">
                          <span className="text-red-600 block truncate font-bold">{l.unit_code}</span>
                          <span className="text-gray-400 font-sans block">{l.geolocation || 'Unknown Area'} • {l.ip_address || 'IP Anonymous'}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold block mb-0.5 border ${l.status === 'VERIFIED' ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
                            {l.status}
                          </span>
                          <span className="text-gray-400 block">{new Date(l.scanned_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* User Reports */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900">User Reported Discrepancies</h3>

                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 max-h-96 overflow-y-auto shadow-sm">
                  {reports?.length === 0 ? (
                    <p className="text-gray-400 text-xs text-center py-8">No open dispute logs recorded.</p>
                  ) : (
                    reports?.map((report) => (
                      <div key={report.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-gray-900">{report.reason}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-red-50 border border-red-100 text-red-600 uppercase tracking-widest font-semibold">
                            {report.reported_type}
                          </span>
                        </div>
                        <p className="text-gray-500">{report.description || 'No description provided'}</p>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-gray-400">
                          <span className="font-mono">ID: {report.reported_id.slice(0, 10)}...</span>
                          <div className="flex gap-2">
                            {report.status !== 'resolved' && (
                              <form action={async () => {
                                'use server';
                                await resolveReport(report.id, 'resolved');
                              }}>
                                <button className="text-green-600 hover:text-green-700 font-medium transition-colors">Mark Resolved</button>
                              </form>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
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
