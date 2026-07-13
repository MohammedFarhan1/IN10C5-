'use client';

import { useActionState, useState } from 'react';
import { login } from '@/app/actions/auth';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  const inputCls = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition text-sm';

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm">Sign in to your Trusta account</p>
        </div>

        {state?.message && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
            {state.message}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              id="email" name="email" type="email"
              autoComplete="email" required
              placeholder="you@example.com"
              className={inputCls}
            />
            {state?.errors?.email && (
              <p className="mt-1 text-red-600 text-xs">{state.errors.email[0]}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-red-600 hover:text-red-700 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password" name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password" required
                placeholder="••••••••"
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {state?.errors?.password && (
              <p className="mt-1 text-red-600 text-xs">{state.errors.password[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors shadow-sm mt-2"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-red-600 hover:text-red-700 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
