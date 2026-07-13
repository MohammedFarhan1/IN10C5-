import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  ShieldCheck, Package, ExternalLink, QrCode,
  Calendar, AlertCircle, CheckCircle, RefreshCw, Layers
} from 'lucide-react';

export default async function OwnershipDashboardPage() {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  const { data: units } = await supabase
    .from('tracked_units')
    .select(`
      *,
      product:products(id, name, thumbnail, category, trust_score),
      seller:sellers(id, business_name, trust_score)
    `)
    .eq('current_owner_id', session.userId)
    .order('assigned_at', { ascending: false });

  const ownedUnits = units || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-600 text-xs font-mono uppercase tracking-widest mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Blockchain Authenticity Vault
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              My Verified Products & Certificates
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Digital ownership credentials, scan telemetry histories, and warranty validation tokens
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/products" className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition shadow-sm">
              Explore Certified Items
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] text-gray-400 uppercase block font-bold tracking-wider">Registered Units</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">{ownedUnits.length}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] text-gray-400 uppercase block font-bold tracking-wider">Authentic Passports</span>
            <span className="text-2xl font-black text-green-600 mt-1 block">
              {ownedUnits.filter(u => u.verification_status === 'VERIFIED').length}
            </span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] text-gray-400 uppercase block font-bold tracking-wider">Active Warranties</span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">
              {ownedUnits.filter(u => !u.warranty_expiry || new Date(u.warranty_expiry) > new Date()).length}
            </span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] text-gray-400 uppercase block font-bold tracking-wider">Security Flags</span>
            <span className="text-2xl font-black text-red-600 mt-1 block">
              {ownedUnits.filter(u => u.fraud_flag).length}
            </span>
          </div>
        </div>

        {ownedUnits.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center max-w-xl mx-auto shadow-sm">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Verified Items Owned Yet</h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              When you complete checkout for physical products associated with custom serial strings, your authenticated account receives explicit ownership allocations instantly.
            </p>
            <Link href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition shadow-sm">
              Browse Trust Catalog
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownedUnits.map((unit) => {
              const p = unit.product;
              const s = unit.seller;
              const isVerified = unit.verification_status === 'VERIFIED';
              const hasFlag = unit.fraud_flag;

              return (
                <div
                  key={unit.id}
                  className={`bg-white border ${hasFlag ? 'border-red-300' : isVerified ? 'border-green-200' : 'border-gray-200'} rounded-3xl overflow-hidden flex flex-col justify-between group transition hover:shadow-md shadow-sm`}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-2 mb-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${isVerified ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {unit.verification_status}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        Scans: {unit.scan_count ?? 0}
                      </span>
                    </div>

                    <div className="flex gap-4 items-center mb-5">
                      {p?.thumbnail ? (
                        <img src={p.thumbnail} alt={p?.name || 'Item'} className="w-14 h-14 object-contain rounded-xl bg-gray-50 border border-gray-100 p-1 flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-red-600 uppercase tracking-widest font-medium mb-0.5">
                          {p?.category || 'Category'}
                        </p>
                        <h4 className="text-gray-900 font-bold text-sm line-clamp-1 group-hover:text-red-600 transition">
                          {p?.name || 'Unknown Unit Asset'}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Vendor: {s?.business_name || 'Accredited Source'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-gray-100 font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase block tracking-wider font-sans">Passport Identity Code</span>
                        <span className="text-red-600 select-all font-medium text-[11px] break-all">{unit.unique_unit_code}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase block tracking-wider font-sans">Manufacturer Serial</span>
                        <span className="text-gray-500 select-all text-[11px]">{unit.serial_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                    <Link
                      href={`/verify/${unit.unique_unit_code}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold transition"
                    >
                      <QrCode className="w-3.5 h-3.5 text-red-500" />
                      Inspect Passport
                    </Link>
                    <Link
                      href={`/product/${unit.product_id}`}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-400 hover:text-gray-700 transition flex items-center justify-center"
                      title="View product store page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
