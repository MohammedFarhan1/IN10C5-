import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import UnitClient from './UnitClient';

export default async function AdminUnitsPage() {
  await requireRole('admin');
  const supabase = createAdminClient();

  const { data: units } = await supabase.from('tracked_units').select(`
      *,
      product:products(name),
      variant:product_variants(variant_id, seller_sku, attributes)
    `).order('created_at', { ascending: false }).limit(100);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showCategoryMenu={false} />

      <div className="container mx-auto px-4 py-10 flex-1 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar />

          <main className="flex-1">
            <UnitClient
              initialUnits={units || []}
            />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
