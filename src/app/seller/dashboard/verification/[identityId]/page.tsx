import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SellerSidebar from '@/components/SellerSidebar';
import ProductVerificationClient from '../ProductVerificationClient';

export default async function VerificationDetailsPage({
  params,
}: {
  params: Promise<{ identityId: string }>;
}) {
  const [{ identityId }, session] = await Promise.all([params, requireRole('seller')]);
  const supabase = createAdminClient();

  const [{ data: seller }, { data: selectedIdentity }] = await Promise.all([
    supabase.from('sellers').select('*').eq('id', session.userId).single(),
    supabase
      .from('verification_identities')
      .select('id')
      .eq('seller_id', session.userId)
      .eq('id', identityId)
      .single(),
  ]);

  if (!selectedIdentity) notFound();

  const [{ data: identities }, { data: logs }, { data: fraudLogs }, { data: notifications }] = await Promise.all([
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
      .select('*')
      .eq('seller_id', session.userId)
      .order('scanned_at', { ascending: false })
      .limit(1000),
    supabase
      .from('fraud_logs')
      .select('*')
      .eq('seller_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('notifications')
      .select('*')
      .eq('seller_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const productIds = Array.from(new Set((identities || []).map((identity) => identity.product_id).filter(Boolean)));
  const [{ data: wishlistItems }, { data: reviews }, { data: activity }] = await Promise.all([
    productIds.length > 0
      ? supabase.from('wishlist_items').select('product_id').in('product_id', productIds)
      : Promise.resolve({ data: [] }),
    productIds.length > 0
      ? supabase.from('reviews').select('product_id, rating, title, comment, created_at').in('product_id', productIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    productIds.length > 0
      ? supabase.from('consumer_activity').select('*').in('product_id', productIds).order('created_at', { ascending: false }).limit(200)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showCategoryMenu={false} />

      <div className="container mx-auto px-4 py-10 flex-1 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <SellerSidebar seller={seller} />

          <main className="flex-1">
            <ProductVerificationClient
              identities={identities || []}
              logs={logs || []}
              fraudLogs={fraudLogs || []}
              wishlistItems={wishlistItems || []}
              reviews={reviews || []}
              activity={activity || []}
              notifications={notifications || []}
              detailIdentityId={identityId}
            />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
