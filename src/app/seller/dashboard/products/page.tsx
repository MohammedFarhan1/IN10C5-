import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SellerSidebar from '@/components/SellerSidebar';
import Link from 'next/link';
import { Plus, Edit, Package, Boxes, Upload } from 'lucide-react';
import DeleteProductButton from './DeleteProductButton';

export default async function SellerProductsPage() {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  const [{ data: seller }, { data: products }] = await Promise.all([
    supabase.from('sellers').select('*').eq('id', session.userId).single(),
    supabase.from('products').select('*').eq('seller_id', session.userId).order('created_at', { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <SellerSidebar seller={seller} />

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
              {seller?.verification_status === 'approved' ? (
                <div className="flex items-center gap-3">
                  <Link href="/seller/dashboard/products/bulk"
                    className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl font-medium transition-colors text-sm">
                    <Upload className="w-4 h-4" /> Bulk Upload
                  </Link>
                  <Link href="/seller/dashboard/products/new"
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors shadow-sm text-sm">
                    <Plus className="w-4 h-4" /> Add Product
                  </Link>
                </div>
              ) : (
                <div className="bg-gray-100 border border-gray-200 text-gray-400 px-4 py-2 rounded-xl font-medium cursor-not-allowed flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" /> Add Product (Disabled)
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-gray-400 text-xs uppercase tracking-widest">
                      <th className="px-6 py-3 font-semibold">Product</th>
                      <th className="px-6 py-3 font-semibold">Category</th>
                      <th className="px-6 py-3 font-semibold">Price</th>
                      <th className="px-6 py-3 font-semibold">Stock</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {!products?.length ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                          <Package className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                          <p>No products yet. Start by adding one.</p>
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                                {p.thumbnail
                                  ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                                  : <Package className="w-5 h-5 m-3 text-gray-300" />
                                }
                              </div>
                              <div>
                                <span className="text-gray-900 font-medium block">{p.name}</span>
                                {p.product_id && (
                                  <span className="text-xs text-gray-400 font-mono">ID: {p.product_id}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 capitalize">{p.category}</td>
                          <td className="px-6 py-4 text-gray-900 font-semibold">₹{p.price.toLocaleString()}</td>
                          <td className="px-6 py-4 text-gray-600">{p.quantity}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              p.is_active
                                ? 'bg-green-50 text-green-600 border-green-100'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                              {p.is_active ? 'Active' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/seller/dashboard/products/${p.id}/variants`}
                                title="Manage Variants"
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                <Boxes className="w-4 h-4" />
                              </Link>
                              <Link href={`/seller/dashboard/products/${p.id}/edit`}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Edit className="w-4 h-4" />
                              </Link>
                              <DeleteProductButton productId={p.id} />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
