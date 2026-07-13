import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SellerSidebar from '@/components/SellerSidebar';
import SellerUnitClient from './SellerUnitClient';
import { redirect } from 'next/navigation';

export default async function SellerUnitsPage() {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  const [
    { data: seller },
    { data: units },
  ] = await Promise.all([
    supabase.from('sellers').select('*').eq('id', session.userId).single(),
    supabase.from('tracked_units').select(`
      *,
      product:products(name),
      variant:product_variants(variant_id, seller_sku, attributes)
    `).eq('seller_id', session.userId).order('created_at', { ascending: false }).limit(200),
  ]);

  if (seller?.verification_status !== 'approved') {
    redirect('/seller/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showCategoryMenu={false} />

      <div className="container mx-auto px-4 py-10 flex-1 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <SellerSidebar seller={seller} />

          <main className="flex-1">
            <SellerUnitClient
              initialUnits={units || []}
            />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
