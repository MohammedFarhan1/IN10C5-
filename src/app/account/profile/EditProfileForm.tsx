'use client';

import { useActionState } from 'react';
import { updateProfile } from '@/app/actions/user';
import { Loader2, Save } from 'lucide-react';

export default function EditProfileForm({ profile }: { profile: any }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  const inputCls = 'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500/30 focus:border-red-400 focus:outline-none transition text-sm';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
      {state?.message && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {state.message}
        </div>
      )}
      {state?.success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
          Profile updated successfully!
        </div>
      )}

      <form action={action} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input name="name" defaultValue={profile?.name || ''} required className={inputCls} placeholder="Your full name" />
            {state?.errors?.name && <p className="text-red-600 text-xs mt-1">{state.errors.name[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
            <input name="mobile" defaultValue={profile?.mobile || ''} required className={inputCls} placeholder="9876543210" />
            {state?.errors?.mobile && <p className="text-red-600 text-xs mt-1">{state.errors.mobile[0]}</p>}
          </div>
        </div>

        <div className="pt-5 border-t border-gray-100 flex justify-end">
          <button type="submit" disabled={pending}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-7 py-2.5 rounded-xl font-semibold transition-colors shadow-sm text-sm">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {pending ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
