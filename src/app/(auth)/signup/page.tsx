import Link from 'next/link';
import { User, Store, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create an account</h1>
          <p className="text-gray-500 text-sm">Choose how you want to use Trusta</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/signup/customer"
            className="flex items-center gap-4 p-5 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-red-50 group-hover:bg-red-100 border border-red-100 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <User className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-gray-900 font-semibold mb-0.5">Customer</h2>
              <p className="text-gray-500 text-sm">Shop verified products, track orders, and own authentic items</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/signup/seller"
            className="flex items-center gap-4 p-5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <Store className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-gray-900 font-semibold mb-0.5">Brand Owner</h2>
              <p className="text-gray-500 text-sm">List products, manage inventory, and build buyer trust</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-red-600 hover:text-red-700 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
