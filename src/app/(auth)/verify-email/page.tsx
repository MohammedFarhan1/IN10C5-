import { MailCheck } from 'lucide-react';
import Link from 'next/link';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const displayEmail = email || 'your email';

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <MailCheck className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h1>
        <p className="text-gray-500 text-sm mb-1">We sent a verification link to</p>
        <p className="text-red-600 font-semibold mb-6">{displayEmail}</p>
        <p className="text-gray-400 text-sm mb-6">
          Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it.
        </p>
        <Link href="/login"
          className="inline-block px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm shadow-sm">
          Go to Login
        </Link>
      </div>
    </div>
  );
}
