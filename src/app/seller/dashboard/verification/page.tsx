import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SellerSidebar from '@/components/SellerSidebar';
import VerificationSearchClient from './VerificationSearchClient';

export default async function ProductVerificationPage() {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  const [{ data: seller }, { data: identities }, { data: logs }, { data: fraudLogs }, { data: notifications }] = await Promise.all([
    supabase.from('sellers').select('*').eq('id', session.userId).single(),
    supabase
      .from('verification_identities')
      .select(`
        *,
        product:products(
          id,
          product_id,
          name,
          brand,
          category,
          batch_number,
          manufacturing_details,
          country_of_origin,
          specifications,
          thumbnail,
          images,
          trust_score,
          avg_rating,
          verified_buyer_reviews
        )
      `)
      .eq('seller_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('verification_logs')
      .select('id, verification_identity_id, verification_id, product_id, scan_result, device_type, platform_type, scanned_at')
      .eq('seller_id', session.userId)
      .order('scanned_at', { ascending: false })
      .limit(20),
    supabase
      .from('fraud_logs')
      .select('id, alert_type, severity, created_at')
      .eq('seller_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('notifications')
      .select('id, title, message, created_at, read_at')
      .eq('seller_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showCategoryMenu={false} />

      <div className="container mx-auto px-4 py-10 flex-1 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <SellerSidebar seller={seller} />

          <main className="flex-1">
            <VerificationSearchClient
              identities={identities || []}
              logs={logs || []}
              fraudLogs={fraudLogs || []}
              notifications={notifications || []}
            />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
