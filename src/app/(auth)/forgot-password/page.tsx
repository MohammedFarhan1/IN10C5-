'use client';

import { useActionState } from 'react';
import { forgotPassword } from '@/app/actions/auth';
import Link from 'next/link';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, undefined);
  const success = state?.message?.includes('sent');

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        {success ? (
          <div className="text-center py-4">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-500 text-sm mb-6">{state?.message}</p>
            <Link href="/login" className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors">
              ← Back to login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h1>
              <p className="text-gray-500 text-sm">Enter your email and we'll send a reset link</p>
            </div>

            {state?.message && !success && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                {state.message}
              </div>
            )}

            <form action={action} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input id="email" name="email" type="email" required placeholder="you@example.com"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition" />
                {state?.errors?.email && <p className="mt-1 text-red-600 text-xs">{state.errors.email[0]}</p>}
              </div>

              <button type="submit" disabled={pending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors shadow-sm">
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {pending ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <Link href="/login" className="mt-5 flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
