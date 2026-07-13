import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SellerSidebar from '@/components/SellerSidebar';
import VerificationScannerClient from './VerificationScannerClient';

export default async function NfcVerificationPage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string }>;
}) {
  const session = await requireRole('seller');
  const query = await searchParams;
  const supabase = createAdminClient();
  const { data: seller } = await supabase.from('sellers').select('*').eq('id', session.userId).single();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showCategoryMenu={false} />

      <div className="container mx-auto px-4 py-10 flex-1 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <SellerSidebar seller={seller} />

          <main className="flex-1">
            <VerificationScannerClient initialCode={query?.code || ''} />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
