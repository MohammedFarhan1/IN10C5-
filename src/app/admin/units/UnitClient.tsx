'use client';

import { useState } from 'react';
import { Download, Printer, QrCode, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

type UnitRow = {
  id?: string;
  unique_unit_code: string;
  serial_number?: string | null;
  qr_code_url?: string | null;
  verification_status?: string | null;
  product?: { name?: string | null } | null;
  variant?: {
    variant_id?: string | null;
    seller_sku?: string | null;
    attributes?: Record<string, unknown> | null;
  } | null;
};

type SelectedQrUnit = UnitRow & {
  computedQrUrl: string;
  pName: string;
  vSku?: string | null;
};

export default function UnitClient({ initialUnits }: { initialUnits: UnitRow[] }) {
  const [units, setUnits] = useState<UnitRow[]>(initialUnits);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitForQr, setSelectedUnitForQr] = useState<SelectedQrUnit | null>(null);

  const handleRevokeStatus = async (unitCode: string) => {
    try {
      setUnits((prev) =>
        prev.map((u) => (u.unique_unit_code === unitCode ? { ...u, verification_status: 'REVOKED' } : u))
      );
      toast.success(`Revoked unit credentials: ${unitCode}`);
    } catch {
      toast.error('State modification failure.');
    }
  };

  const filteredUnits = units.filter((u) => {
    const codeStr = (u.unique_unit_code || '').toLowerCase();
    const serialStr = (u.serial_number || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return codeStr.includes(query) || serialStr.includes(query);
  });

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search serial number or unique unit code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 font-mono transition"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {filteredUnits.length} passport entities
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="px-6 py-4">Unit Code / Serial</th>
                <th className="px-6 py-4">Product / Variant</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">QR</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No passport nodes match the search string.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u) => {
                  const pName = u.product?.name || 'Unknown Product';
                  const vAttrs = u.variant?.attributes;
                  const vSku = u.variant?.seller_sku || u.variant?.variant_id;
                  const qrTarget = u.qr_code_url || `${window.location.origin}/verify/${u.unique_unit_code}`;

                  return (
                    <tr key={u.id || u.unique_unit_code} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono">
                        <Link href={`/verify/${u.unique_unit_code}`} className="text-red-600 hover:underline block font-bold select-all">
                          {u.unique_unit_code}
                        </Link>
                        <span className="text-gray-400 text-[10px] block mt-0.5 select-all">{u.serial_number}</span>
                      </td>

                      <td className="px-6 py-4 max-w-xs truncate">
                        <p className="text-gray-900 font-medium">{pName}</p>
                        {vSku && (
                          <span className="text-[10px] text-purple-600 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded font-mono uppercase mr-1">
                            SKU: {vSku}
                          </span>
                        )}
                        {vAttrs && Object.keys(vAttrs).length > 0 && (
                          <span className="text-[10px] text-gray-400">
                            ({Object.entries(vAttrs).map(([, val]) => `${val}`).join('/')})
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider border
                          ${u.verification_status === 'VERIFIED' ? 'bg-green-50 text-green-600 border-green-100' :
                            u.verification_status === 'REVOKED' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                            u.verification_status === 'COUNTERFEIT' ? 'bg-red-50 text-red-600 border-red-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'}`}
                        >
                          {u.verification_status || 'VERIFIED'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedUnitForQr({ ...u, computedQrUrl: qrTarget, pName, vSku })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 font-bold transition text-[11px]"
                        >
                          <QrCode className="w-3.5 h-3.5" /> View QR
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {u.verification_status !== 'REVOKED' ? (
                          <button
                            onClick={() => handleRevokeStatus(u.unique_unit_code)}
                            className="text-gray-400 hover:text-red-600 text-[11px] font-medium transition"
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="text-gray-300 text-[10px] italic">Revoked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUnitForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedUnitForQr(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition font-bold"
            >
              ×
            </button>

            <div className="text-center">
              <span className="text-[10px] text-red-600 font-mono uppercase bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-bold">
                Print-Ready Label
              </span>
              <h3 className="text-lg font-black text-gray-900 mt-2 leading-tight">
                {selectedUnitForQr.pName}
              </h3>
              <p className="text-gray-400 text-xs mt-0.5 font-mono">
                {selectedUnitForQr.serial_number}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center shadow-inner relative border-4 border-gray-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedUnitForQr.computedQrUrl)}`}
                alt="Verification QR code"
                className="w-48 h-48 object-contain"
              />
              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-3 block text-center">
                Scan to authenticate product
              </span>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Unit Code:</span>
                <span className="text-red-600 truncate max-w-[200px]">
                  {selectedUnitForQr.unique_unit_code}
                </span>
              </div>
              {selectedUnitForQr.vSku && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Variant SKU:</span>
                  <span className="text-purple-600 font-bold">{selectedUnitForQr.vSku}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4 text-gray-400" /> Print Label
              </button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(selectedUnitForQr.computedQrUrl)}`}
                target="_blank"
                rel="noreferrer"
                download={`QR_${selectedUnitForQr.unique_unit_code}.png`}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition text-center shadow-sm"
              >
                <Download className="w-4 h-4 text-white" /> Download QR
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
