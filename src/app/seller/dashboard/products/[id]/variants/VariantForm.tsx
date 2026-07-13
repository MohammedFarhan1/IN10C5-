'use client';

import { useState } from 'react';
import { createVariant } from '@/app/actions/variants';
import { useActionState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';

const COMMON_ATTRIBUTE_KEYS = ['Color', 'Size', 'Storage', 'Weight', 'Material', 'Style', 'Pattern'];

export default function VariantForm({ productId }: { productId: string }) {
  const createVariantForProduct = createVariant.bind(null, productId);
  const [state, action, pending] = useActionState(createVariantForProduct, undefined);

  const [attrs, setAttrs] = useState<{ key: string; value: string }[]>([
    { key: 'Color', value: '' },
  ]);

  const addAttr = () => setAttrs((a) => [...a, { key: '', value: '' }]);
  const removeAttr = (i: number) => setAttrs((a) => a.filter((_, idx) => idx !== i));
  const updateAttr = (i: number, field: 'key' | 'value', val: string) =>
    setAttrs((a) => a.map((at, idx) => (idx === i ? { ...at, [field]: val } : at)));

  const attributesJson = JSON.stringify(
    Object.fromEntries(attrs.filter((a) => a.key && a.value).map((a) => [a.key, a.value]))
  );

  const inputCls = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-gray-900 font-bold text-lg mb-5 flex items-center gap-2">
        <Plus className="w-5 h-5 text-red-600" />
        Add New Variant
      </h3>

      {state?.message && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {state.message}
        </div>
      )}
      {state?.success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
          Variant created successfully!
        </div>
      )}

      <form action={action} className="space-y-5">
        <input type="hidden" name="attributes_raw" value={attributesJson} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Variant Attributes</label>
          <div className="space-y-2">
            {attrs.map((attr, i) => (
              <div key={i} className="flex gap-2">
                <select
                  value={attr.key}
                  onChange={(e) => updateAttr(i, 'key', e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-red-500/30 focus:border-red-400 focus:outline-none transition"
                >
                  <option value="">Select attribute...</option>
                  {COMMON_ATTRIBUTE_KEYS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => updateAttr(i, 'value', e.target.value)}
                  placeholder="e.g. Red, 128GB, XL..."
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:ring-2 focus:ring-red-500/30 focus:border-red-400 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => removeAttr(i)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAttr}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors mt-2 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add attribute
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹) *</label>
            <input name="price" type="number" min="0" step="0.01" required placeholder="999"
              className={inputCls} />
            {state?.errors?.price && <p className="text-red-600 text-xs mt-1">{state.errors.price[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Compare Price (₹)</label>
            <input name="compare_price" type="number" min="0" step="0.01" placeholder="1299"
              className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity *</label>
            <input name="quantity" type="number" min="0" required placeholder="50"
              className={inputCls} />
            {state?.errors?.quantity && <p className="text-red-600 text-xs mt-1">{state.errors.quantity[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand Owner SKU</label>
            <input name="seller_sku" type="text" placeholder="MY-SKU-001"
              className={`${inputCls} font-mono`} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Variant ID (optional)</label>
            <input name="variant_id" type="text" placeholder="PROD-001-V1"
              className={`${inputCls} font-mono`} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Variant Image URLs</label>
            <p className="text-gray-400 text-xs mb-2">Comma or newline separated. First URL becomes thumbnail.</p>
            <textarea name="image_url" rows={2} placeholder="https://cdn.example.com/red-xl.jpg"
              className={`${inputCls} font-mono`} />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={pending}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-sm text-sm">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {pending ? 'Adding...' : 'Add Variant'}
          </button>
        </div>
      </form>
    </div>
  );
}
