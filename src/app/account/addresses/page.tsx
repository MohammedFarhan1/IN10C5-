import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AddressForm from './AddressForm';
import Link from 'next/link';
import { ArrowLeft, MapPin, Trash2, CheckCircle2 } from 'lucide-react';
import { deleteAddress } from '@/app/actions/user';

export default async function AddressesPage() {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', session.userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/account" className="text-gray-400 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Manage Addresses</h1>
          </div>

          <AddressForm />

          <h2 className="text-lg font-bold text-gray-900 mb-5">Your Saved Addresses</h2>

          <div className="grid md:grid-cols-2 gap-5">
            {!addresses?.length ? (
              <div className="col-span-2 py-14 text-center bg-white border border-gray-200 rounded-2xl">
                <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">You haven't saved any addresses yet.</p>
              </div>
            ) : (
              addresses.map((address) => (
                <div key={address.id} className={`p-6 rounded-2xl border transition relative ${
                  address.is_default
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}>
                  {address.is_default && (
                    <div className="absolute top-5 right-5 flex items-center gap-1.5 text-red-600 text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" /> Default
                    </div>
                  )}

                  <div className="pr-20">
                    <p className="text-gray-900 font-bold text-base mb-0.5">{address.name}</p>
                    <p className="text-gray-500 text-sm mb-3">{address.mobile}</p>

                    <div className="space-y-0.5 text-gray-600 text-sm leading-relaxed">
                      <p>{address.line1}</p>
                      <p>{address.city}, {address.state}</p>
                      <p className="font-mono text-gray-400">{address.pincode}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-100 flex justify-end">
                    <form action={async () => { 'use server'; await deleteAddress(address.id); }}>
                      <button type="submit" className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors px-3 py-1.5 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
