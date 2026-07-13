'use client';

import { useActionState, useEffect, useState } from 'react';
import { updateProduct } from '@/app/actions/seller';
import { Loader2, Save, QrCode, Plus, RefreshCw, Printer, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EditProductForm({
  product,
  initialUnits = [],
  variants = [],
}: {
  product: any;
  initialUnits?: any[];
  variants?: any[];
}) {
  const router = useRouter();
  const updateProductWithId = updateProduct.bind(null, product.id);
  const [state, action, pending] = useActionState(updateProductWithId, undefined);

  const [units, setUnits] = useState<any[]>(initialUnits);
  const [selectedUnitForPreview, setSelectedUnitForPreview] = useState<any | null>(initialUnits[0] || null);

  const [mintCount, setMintCount] = useState(5);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    if (state?.success) {
      toast.success('Product updated successfully!');
      const timer = setTimeout(() => {
        router.push('/seller/dashboard/products');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  const handleMintInline = async () => {
    setIsMinting(true);
    try {
      const res = await fetch('/api/unit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariantId || undefined,
          count: Number(mintCount),
          prefix: 'ITEM'
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        toast.success(`Generated ${data.data.length} authenticated units.`);
        const merged = [...data.data, ...units];
        setUnits(merged);
        if (!selectedUnitForPreview) {
          setSelectedUnitForPreview(data.data[0]);
        }
      } else {
        toast.error(data.message || 'Minting failed.');
      }
    } catch {
      toast.error('Network error.');
    } finally {
      setIsMinting(false);
    }
  };

  const previewTargetUrl = selectedUnitForPreview?.qr_code_url ||
    (selectedUnitForPreview ? `${window.location.origin}/verify/${selectedUnitForPreview.unique_unit_code}` : '');

  const inputCls = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      {/* Product Form */}
      <form action={action} className="space-y-6 lg:col-span-7">
        <div>
          <span className="text-xs text-red-600 font-semibold uppercase tracking-wider">Product Settings</span>
          <h2 className="text-lg font-bold text-gray-900 mt-1">Product Properties</h2>
          <p className="text-gray-400 text-xs">Modify attributes, pricing, and stock quantities.</p>
        </div>

        {state?.message && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
            {state.message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Custom Product ID / Code</label>
            <input name="product_id" defaultValue={product.product_id || ''} placeholder="e.g. SKU-PROD-2026"
              className={`${inputCls} font-mono`} />
            {state?.errors?.product_id && <p className="text-red-600 text-xs mt-1">{state.errors.product_id[0]}</p>}
          </div>

          <div className="col-span-2">
            <label className={labelCls}>Product Title</label>
            <input name="name" required defaultValue={product.name} placeholder="Premium Running Shoes"
              className={inputCls} />
            {state?.errors?.name && <p className="text-red-600 text-xs mt-1">{state.errors.name[0]}</p>}
          </div>

          <div className="col-span-2">
            <label className={labelCls}>Description</label>
            <textarea name="description" required rows={3} defaultValue={product.description} placeholder="Product description..."
              className={inputCls} />
            {state?.errors?.description && <p className="text-red-600 text-xs mt-1">{state.errors.description[0]}</p>}
          </div>

          <div>
            <label className={labelCls}>Category</label>
            <select name="category" required defaultValue={product.category} className={inputCls}>
              <option value="electronics">Electronics</option>
              <option value="fashion">Fashion & Apparel</option>
              <option value="home">Home Living</option>
              <option value="automotive">Automotive</option>
            </select>
            {state?.errors?.category && <p className="text-red-600 text-xs mt-1">{state.errors.category[0]}</p>}
          </div>

          <div>
            <label className={labelCls}>Stock Quantity</label>
            <input name="quantity" type="number" required min="0" defaultValue={product.quantity} placeholder="100"
              className={`${inputCls} font-mono`} />
            {state?.errors?.quantity && <p className="text-red-600 text-xs mt-1">{state.errors.quantity[0]}</p>}
          </div>

          <div>
            <label className={labelCls}>Base Price (₹)</label>
            <input name="price" type="number" required min="0" defaultValue={product.price} placeholder="4999"
              className={`${inputCls} font-mono font-bold`} />
            {state?.errors?.price && <p className="text-red-600 text-xs mt-1">{state.errors.price[0]}</p>}
          </div>

          <div>
            <label className={labelCls}>Compare Price</label>
            <input name="compare_price" type="number" min="0" defaultValue={product.compare_price || ''} placeholder="5999"
              className={`${inputCls} font-mono`} />
          </div>

          <div className="col-span-2">
            <label className={labelCls}>Image URLs</label>
            <textarea name="image_url" rows={2} defaultValue={product.images?.join('\n') || ''} placeholder="https://domain.com/asset.jpg"
              className={`${inputCls} font-mono`} />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <Link href="/seller/dashboard/products" className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-900 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={pending} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center gap-1.5">
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {pending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* QR Passport Panel */}
      <div className="lg:col-span-5 space-y-6 pt-8 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-8 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-xs font-semibold mb-1">
              <QrCode className="w-3 h-3" /> Live Identity Engine
            </div>
            <h3 className="text-sm font-bold text-gray-900">Serialized Inventory Passports</h3>
            <p className="text-gray-400 text-xs">
              Every generated unit gets its own unique QR cryptographic label.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            {selectedUnitForPreview ? (
              <div className="space-y-3 w-full">
                <span className="text-xs text-gray-400 font-semibold uppercase block">
                  Active Unit Preview
                </span>

                <div className="bg-white p-4 rounded-xl inline-block border border-gray-200 shadow-sm mx-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(previewTargetUrl)}`}
                    alt="QR code for unit"
                    className="w-36 h-36 object-contain"
                  />
                </div>

                <div className="bg-gray-100 p-2 rounded-lg border border-gray-200 text-left text-xs font-mono space-y-0.5">
                  <div className="flex justify-between text-gray-500">
                    <span>Serial:</span>
                    <span className="text-gray-900 font-bold">{selectedUnitForPreview.serial_number}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Code:</span>
                    <span className="text-red-600 truncate max-w-[120px]">{selectedUnitForPreview.unique_unit_code}</span>
                  </div>
                  {selectedUnitForPreview.variant && (
                    <div className="flex justify-between text-gray-500">
                      <span>Variant:</span>
                      <span className="text-purple-600">{selectedUnitForPreview.variant.seller_sku || 'Standard'}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <Printer className="w-3 h-3" /> Print
                  </button>
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(previewTargetUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    download={`LABEL_${selectedUnitForPreview.unique_unit_code}.png`}
                    className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors text-center"
                  >
                    <Download className="w-3 h-3" /> PNG
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-12 text-gray-400 text-xs">
                No units generated for this product yet.
              </div>
            )}
          </div>

          {units.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Select Unit ({units.length})
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {units.map((u) => {
                  const isSelected = selectedUnitForPreview?.unique_unit_code === u.unique_unit_code;
                  return (
                    <button
                      key={u.unique_unit_code}
                      type="button"
                      onClick={() => setSelectedUnitForPreview(u)}
                      className={`p-1.5 rounded-lg border text-left text-xs font-mono truncate transition ${
                        isSelected
                          ? 'bg-red-50 border-red-400 text-red-600 font-bold'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {u.serial_number}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Inline Generator */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 mt-4 shadow-sm">
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-1">
            <Plus className="w-3 h-3" /> Generate Units
          </span>

          {variants.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bind to Variant</label>
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              >
                <option value="">Base Configuration (No variant)</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.seller_sku || v.variant_id || 'SKU'} — ({Object.values(v.attributes || {}).join('/')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                max={50}
                value={mintCount}
                onChange={(e) => setMintCount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
            <button
              type="button"
              onClick={handleMintInline}
              disabled={isMinting}
              className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-40 h-[30px]"
            >
              {isMinting ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Mint'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
