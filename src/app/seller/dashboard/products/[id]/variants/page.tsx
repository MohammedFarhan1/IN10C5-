import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SellerSidebar from '@/components/SellerSidebar';
import Link from 'next/link';
import { ArrowLeft, Layers, Package } from 'lucide-react';
import { redirect } from 'next/navigation';
import VariantForm from './VariantForm';
import VariantCard from './VariantCard';

export default async function ProductVariantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole('seller');
  const supabase = createAdminClient();
  const { id: productId } = await params;

  const [{ data: seller }, { data: product }, { data: variants }] = await Promise.all([
    supabase.from('sellers').select('*').eq('id', session.userId).single(),
    supabase.from('products').select('*').eq('id', productId).eq('seller_id', session.userId).single(),
    supabase.from('product_variants').select('*').eq('product_id', productId).eq('is_active', true).order('created_at'),
  ]);

  if (!product) redirect('/seller/dashboard/products');
  if (seller?.verification_status !== 'approved') redirect('/seller/dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showCategoryMenu={false} />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <SellerSidebar seller={seller} />

          <main className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <Link href="/seller/dashboard/products" className="text-gray-400 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-6 h-6 text-red-600" />
                  Manage Variants
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Product: <span className="text-gray-900 font-medium">{product.name}</span>
                </p>
              </div>
            </div>

            <p className="text-gray-400 text-xs mb-8 ml-9">
              Product ID: <code className="font-mono text-gray-500">{product.id}</code>
            </p>

            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2">
                <VariantForm productId={productId} />
              </div>

              <div className="lg:col-span-3">
                <h2 className="text-gray-900 font-bold text-lg mb-4">
                  Existing Variants
                  <span className="ml-2 text-sm text-gray-400 font-normal">({variants?.length ?? 0})</span>
                </h2>

                {!variants?.length ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-2xl text-center shadow-sm">
                    <Package className="w-12 h-12 text-gray-200 mb-4" />
                    <p className="text-gray-500 font-medium">No variants yet</p>
                    <p className="text-gray-400 text-sm mt-1">Use the form to add your first variant.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {variants.map((v) => (
                      <VariantCard key={v.id} variant={v} productId={productId} />
                    ))}
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
