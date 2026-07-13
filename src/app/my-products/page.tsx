import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Shield, CheckCircle, Package } from 'lucide-react';

export default async function MyProductsPage() {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  const { data: units } = await supabase
    .from('serialized_units')
    .select('*, product:products(id, name, thumbnail, category, trust_score, certificate_id, authenticity_verified)')
    .eq('owner_id', session.userId)
    .eq('status', 'sold')
    .order('sold_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Products</h1>
          <p className="text-gray-500 text-sm">Verified products you own — each with a unique serial number and authenticity proof</p>
        </div>

        {!units?.length ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <Shield className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-xl text-gray-500 mb-2">No owned products yet</p>
            <p className="text-gray-400 text-sm">Products you purchase will appear here with ownership proof</p>
            <Link href="/products" className="inline-block mt-6 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-sm">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {units.map((unit) => {
              const product = unit.product as {
                id: string; name: string; thumbnail: string;
                category: string; trust_score: number;
                certificate_id: string; authenticity_verified: boolean;
              };
              return (
                <Link key={unit.id} href={`/my-products/${unit.unit_code}`}
                  className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md rounded-2xl overflow-hidden transition-all group">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                    {product?.thumbnail ? (
                      <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-12 h-12 text-gray-300" />
                    )}
                    {product?.authenticity_verified && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{product?.category}</p>
                    <h3 className="text-gray-900 font-semibold mb-3 group-hover:text-red-600 transition-colors line-clamp-1">
                      {product?.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-xs">Serial Number</p>
                        <p className="text-red-600 font-mono text-sm font-medium">{unit.unit_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-xs">Trust Score</p>
                        <p className="text-green-600 font-bold">{product?.trust_score}%</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
