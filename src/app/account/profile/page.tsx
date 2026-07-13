import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EditProfileForm from './EditProfileForm';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';

export default async function ProfilePage() {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.userId)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/account" className="text-gray-400 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Profile Information</h1>
          </div>

          <div className="mb-8 p-6 bg-white border border-gray-200 rounded-2xl flex items-center gap-6 shadow-sm">
            <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center shadow-sm">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-red-600 font-semibold text-xs uppercase tracking-widest">Account Status</p>
              <h2 className="text-gray-900 text-xl font-bold mt-0.5">Customer Verified</h2>
              <p className="text-gray-500 text-sm mt-1">{session.email}</p>
            </div>
          </div>

          <EditProfileForm profile={profile} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
