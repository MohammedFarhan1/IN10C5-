'use client';

import { useState, useTransition, useActionState, useEffect } from 'react';
import { deleteVariant, updateVariant } from '@/app/actions/variants';
import { Trash2, Edit3, X, Save, Plus } from 'lucide-react';
import { ProductVariant } from '@/types';
import toast from 'react-hot-toast';

export default function VariantCard({ variant, productId }: { variant: ProductVariant; productId: string }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  const updateVariantBound = updateVariant.bind(null, variant.id);
  const [state, action, pendingUpdate] = useActionState(updateVariantBound, undefined);

  const initialAttrs = Object.entries(variant.attributes ?? {}).map(([k, v]) => ({ key: k, value: v }));
  const [attrs, setAttrs] = useState<{ key: string; value: string }[]>(
    initialAttrs.length > 0 ? initialAttrs : [{ key: 'Color', value: '' }]
  );

  const addAttr = () => setAttrs((a) => [...a, { key: '', value: '' }]);
  const removeAttr = (i: number) => setAttrs((a) => a.filter((_, idx) => idx !== i));
  const updateAttr = (i: number, field: 'key' | 'value', val: string) =>
    setAttrs((a) => a.map((at, idx) => (idx === i ? { ...at, [field]: val } : at)));

  const computedAttributesJson = JSON.stringify(
    Object.fromEntries(attrs.filter((a) => a.key && a.value).map((a) => [a.key, a.value]))
  );

  useEffect(() => {
    if (state?.success) {
      toast.success('Variant updated successfully.');
    }
  }, [state?.success]);

  const handleDelete = () => {
    if (!confirm('Permanently delete this variant?')) return;
    startTransition(() => {
      void deleteVariant(variant.id, productId);
    });
  };

  const attrEntries = Object.entries(variant.attributes ?? {});

  const miniInputCls = 'w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition';

  return (
    <div className={`bg-white border ${isEditing ? 'border-red-300 shadow-md' : 'border-gray-200'} rounded-2xl p-5 transition relative overflow-hidden shadow-sm ${isPending ? 'opacity-40' : ''}`}>
      {isEditing ? (
        <form action={action} className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              Edit Variant
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {state?.message && (
            <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs">
              {state.message}
            </div>
          )}

          <input type="hidden" name="attributes_raw" value={computedAttributesJson} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Variant Code</label>
              <input name="variant_code" defaultValue={(variant as any).variant_code || ''} placeholder="BLK"
                maxLength={8}
                className={`${miniInputCls} font-mono uppercase`} />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Variant ID</label>
              <input name="variant_id" defaultValue={variant.variant_id || ''} placeholder="PROD-RED-XL"
                className={`${miniInputCls} font-mono`} />
              {state?.errors?.variant_id && <p className="text-red-600 text-[9px] mt-0.5">{state.errors.variant_id[0]}</p>}
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">SKU</label>
              <input name="seller_sku" defaultValue={variant.seller_sku || ''} placeholder="SKU-89021"
                className={`${miniInputCls} font-mono`} />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Price (₹)</label>
              <input name="price" type="number" required min="1" defaultValue={variant.price}
                className={`${miniInputCls} font-mono font-bold`} />
              {state?.errors?.price && <p className="text-red-600 text-[9px] mt-0.5">{state.errors.price[0]}</p>}
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Compare Price</label>
              <input name="compare_price" type="number" min="0" defaultValue={variant.compare_price || ''}
                className={`${miniInputCls} font-mono`} />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Stock Quantity</label>
              <input name="quantity" type="number" required min="0" defaultValue={variant.quantity}
                className={`${miniInputCls} font-mono font-bold`} />
              {state?.errors?.quantity && <p className="text-red-600 text-[9px] mt-0.5">{state.errors.quantity[0]}</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Image URLs</label>
              <textarea name="image_url" rows={2} defaultValue={variant.images?.join('\n') || ''} placeholder="https://domain.com/var.jpg"
                className={`${miniInputCls} font-mono`} />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] text-gray-400 uppercase font-semibold">
                Attributes
              </label>
              <button
                type="button"
                onClick={addAttr}
                className="text-red-600 hover:text-red-700 text-[10px] font-semibold flex items-center gap-0.5 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {attrs.map((at, idx) => (
                <div key={idx} className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    placeholder="Key"
                    value={at.key}
                    onChange={(e) => updateAttr(idx, 'key', e.target.value)}
                    className="w-1/3 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-400"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={at.value}
                    onChange={(e) => updateAttr(idx, 'value', e.target.value)}
                    className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttr(idx)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100 justify-end">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-xl text-gray-500 hover:text-gray-900 transition-colors text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pendingUpdate}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1 shadow-sm disabled:opacity-40 transition-colors"
            >
              {pendingUpdate ? 'Saving...' : <><Save className="w-3.5 h-3.5" /> Save</>}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="absolute top-4 right-4 flex items-center gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-xl transition-colors border border-gray-200"
              title="Edit Variant"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors border border-red-100 disabled:opacity-40"
              title="Delete Variant"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pr-20 mb-4">
            {attrEntries.map(([key, value]) => (
              <span key={key}
                className="px-2.5 py-0.5 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-medium">
                {key}: <span className="text-gray-900 font-bold">{value as string}</span>
              </span>
            ))}
            {attrEntries.length === 0 && (
              <span className="text-gray-400 text-xs italic">No attributes</span>
            )}
          </div>

          {variant.thumbnail && (
            <div className="bg-gray-50 rounded-xl p-2 mb-4 border border-gray-100 flex items-center justify-center">
              <img src={variant.thumbnail} alt="Variant" className="w-full h-32 object-contain rounded-lg" />
            </div>
          )}

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-gray-900 text-xl font-extrabold">₹{variant.price.toLocaleString()}</span>
            {variant.compare_price && (
              <span className="text-gray-400 line-through text-xs">₹{variant.compare_price.toLocaleString()}</span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-3 mt-2">
            <span className={`font-bold ${variant.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {variant.quantity > 0 ? `${variant.quantity} in stock` : 'Out of stock'}
            </span>

            <div className="text-right font-mono text-gray-400 space-y-0.5">
              {variant.variant_id && <span className="block">ID: {variant.variant_id}</span>}
              {variant.seller_sku && <span className="block">SKU: {variant.seller_sku}</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
