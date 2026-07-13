'use client';

import { useActionState } from 'react';
import { saveAddress } from '@/app/actions/user';
import { Loader2, Plus, MapPin } from 'lucide-react';

export default function AddressForm() {
  const [state, action, pending] = useActionState(saveAddress, undefined);

  const inputCls = 'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:ring-2 focus:ring-red-500/30 focus:border-red-400 focus:outline-none transition';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-red-600" />
        Add New Address
      </h2>

      {state?.message && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {state.message}
        </div>
      )}
      {state?.success && (
        <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
          Address saved successfully!
        </div>
      )}

      <form action={action} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Receiver Name</label>
            <input name="name" required placeholder="John Doe" className={inputCls} />
            {state?.errors?.name && <p className="text-red-600 text-xs mt-1">{state.errors.name[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
            <input name="mobile" required placeholder="9876543210" className={inputCls} />
            {state?.errors?.mobile && <p className="text-red-600 text-xs mt-1">{state.errors.mobile[0]}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address (House No, Building, Street, Area)</label>
            <textarea name="line1" required rows={3} placeholder="123, Blue Tower, MG Road"
              className={`${inputCls} resize-none`} />
            {state?.errors?.line1 && <p className="text-red-600 text-xs mt-1">{state.errors.line1[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
            <input name="city" required placeholder="Mumbai" className={inputCls} />
            {state?.errors?.city && <p className="text-red-600 text-xs mt-1">{state.errors.city[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
            <input name="state" required placeholder="Maharashtra" className={inputCls} />
            {state?.errors?.state && <p className="text-red-600 text-xs mt-1">{state.errors.state[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode</label>
            <input name="pincode" required placeholder="400001" className={inputCls} />
            {state?.errors?.pincode && <p className="text-red-600 text-xs mt-1">{state.errors.pincode[0]}</p>}
          </div>
          <div className="flex items-center gap-3 self-end pb-1">
            <input type="checkbox" name="is_default" id="is_default"
              className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 accent-red-600" />
            <label htmlFor="is_default" className="text-sm text-gray-700">Set as default address</label>
          </div>
        </div>

        <div className="pt-5 border-t border-gray-100 flex justify-end">
          <button type="submit" disabled={pending}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-7 py-2.5 rounded-xl font-semibold transition-colors shadow-sm text-sm">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {pending ? 'Saving…' : 'Add Address'}
          </button>
        </div>
      </form>
    </div>
  );
}
