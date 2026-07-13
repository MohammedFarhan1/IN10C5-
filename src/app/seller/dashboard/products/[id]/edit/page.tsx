import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SellerSidebar from '@/components/SellerSidebar';
import EditProductForm from './EditProductForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('seller');
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: product }, { data: seller }, { data: units }, { data: variants }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).eq('seller_id', session.userId).single(),
    supabase.from('sellers').select('*').eq('id', session.userId).single(),
    supabase.from('tracked_units').select('*, variant:product_variants(variant_id, seller_sku, attributes)').eq('product_id', id).order('created_at', { ascending: false }),
    supabase.from('product_variants').select('*').eq('product_id', id).eq('is_active', true),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-10 flex-1 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <SellerSidebar seller={seller} />

          <main className="flex-1 space-y-8">
            <div className="flex items-center gap-4">
              <Link href="/seller/dashboard/products" className="text-gray-400 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Product & QR Passports</h1>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <EditProductForm product={product} initialUnits={units || []} variants={variants || []} />
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
