'use client';

import { useActionState } from 'react';
import { signupCustomer } from '@/app/actions/auth';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { useState } from 'react';

export default function CustomerSignupPage() {
  const [state, action, pending] = useActionState(signupCustomer, undefined);
  const [showPassword, setShowPassword] = useState(false);

  const inputCls = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition';

  const Field = ({
    id, name, label, type = 'text', placeholder, autoComplete, error, ...rest
  }: {
    id: string; name: string; label: string; type?: string;
    placeholder?: string; autoComplete?: string; error?: string[];
    [k: string]: unknown;
  }) => (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input
        id={id} name={name} type={type} placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${inputCls}${error ? ' border-red-300 bg-red-50' : ''}`}
        {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
      />
      {error && <p className="mt-1 text-red-600 text-xs">{error[0]}</p>}
    </div>
  );

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Customer Account</h1>
          <p className="text-gray-500 text-sm">Start shopping verified products today</p>
        </div>

        {state?.message && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
            {state.message}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field id="name"   name="name"   label="Full Name"      placeholder="Rahul Sharma"  error={state?.errors?.name} />
            <Field id="mobile" name="mobile" label="Mobile Number"  placeholder="9876543210" type="tel" error={state?.errors?.mobile} />
          </div>

          <Field id="email" name="email" label="Email Address" type="email" placeholder="you@example.com" autoComplete="email" error={state?.errors?.email} />

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
            <div className="relative">
              <input
                id="password" name="password" type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters" autoComplete="new-password"
                className={`${inputCls} pr-11`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {state?.errors?.password && <p className="mt-1 text-red-600 text-xs">{state.errors.password[0]}</p>}
          </div>

          <div className="pt-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Default Delivery Address</p>
            <div className="space-y-3">
              <Field id="line1" name="line1" label="Address Line" placeholder="Flat 4B, Sunshine Apartments, MG Road" error={state?.errors?.line1} />
              <div className="grid grid-cols-3 gap-3">
                <Field id="city"    name="city"    label="City"    placeholder="Mumbai"      error={state?.errors?.city} />
                <Field id="state"   name="state"   label="State"   placeholder="Maharashtra" error={state?.errors?.state} />
                <Field id="pincode" name="pincode" label="Pincode" placeholder="400001"      error={state?.errors?.pincode} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={pending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors shadow-sm mt-2">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {pending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-red-600 hover:text-red-700 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
