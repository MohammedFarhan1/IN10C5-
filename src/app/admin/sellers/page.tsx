import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { verifySeller, rejectSeller, suspendSeller } from '@/app/actions/admin';
import { CheckCircle, XCircle, PauseCircle, ExternalLink, Clock } from 'lucide-react';
import RejectSellerButton from './RejectSellerButton';

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  await requireRole('admin');
  const supabase = createAdminClient();
  const filter = searchParams?.filter;

  let query = supabase.from('sellers').select('*, profile:profiles(name)').order('created_at', { ascending: false });
  if (filter === 'pending') query = query.eq('verification_status', 'pending');

  const { data: sellers } = await query;

  const STATUS_BADGE: Record<string, string> = {
    pending:   'bg-amber-50 text-amber-600 border-amber-100',
    approved:  'bg-green-50 text-green-600 border-green-100',
    rejected:  'bg-red-50 text-red-600 border-red-100',
    suspended: 'bg-orange-50 text-orange-600 border-orange-100',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showCategoryMenu={false} />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar />

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Brand Owner Management</h1>
              <div className="flex gap-1.5 bg-white border border-gray-200 rounded-xl p-1">
                {['all', 'pending', 'approved', 'rejected', 'suspended'].map((f) => (
                  <a key={f} href={f === 'all' ? '/admin/sellers' : `/admin/sellers?filter=${f}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      (filter || 'all') === f
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}>{f}</a>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-gray-400 text-xs uppercase tracking-widest">
                      <th className="px-6 py-3 text-left font-semibold">Business</th>
                      <th className="px-6 py-3 text-left font-semibold">Contact</th>
                      <th className="px-6 py-3 text-left font-semibold">GST</th>
                      <th className="px-6 py-3 text-left font-semibold">Status</th>
                      <th className="px-6 py-3 text-left font-semibold">Trust</th>
                      <th className="px-6 py-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sellers?.map((seller) => (
                      <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-gray-900 font-medium">{seller.business_name}</p>
                          <p className="text-gray-400 text-xs">{new Date(seller.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700">{(seller.profile as { name: string; email: string })?.name}</p>
                          <p className="text-gray-400 text-xs">{seller.contact_email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {seller.gst_number && <span className="text-gray-600 font-mono text-xs">{seller.gst_number}</span>}
                            {seller.gst_doc_url && (
                              <a href={seller.gst_doc_url} target="_blank" rel="noopener noreferrer"
                                className="text-red-600 hover:text-red-700 transition-colors">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_BADGE[seller.verification_status] || STATUS_BADGE.pending}`}>
                            {seller.verification_status}
                          </span>
                          {seller.rejection_reason && (
                            <p className="text-red-600 text-xs mt-1">{seller.rejection_reason}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-semibold">{seller.trust_score}%</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {seller.verification_status !== 'approved' && (
                              <form action={async () => { 'use server'; await verifySeller(seller.id); }}>
                                <button type="submit" title="Approve"
                                  className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              </form>
                            )}
                            {seller.verification_status === 'pending' && (
                              <RejectSellerButton sellerId={seller.id} />
                            )}
                            {seller.verification_status === 'approved' && (
                              <form action={async () => { 'use server'; await suspendSeller(seller.id); }}>
                                <button type="submit" title="Suspend"
                                  className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors">
                                  <PauseCircle className="w-4 h-4" />
                                </button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!sellers?.length && (
                  <div className="py-14 text-center">
                    <Clock className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400">No brand owners found</p>
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
