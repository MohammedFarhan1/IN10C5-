import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import BulkUploadForm from './BulkUploadForm';
import { redirect } from 'next/navigation';

export default async function BulkUploadPage() {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  const { data: seller } = await supabase
    .from('sellers')
    .select('*')
    .eq('id', session.userId)
    .single();

  if (seller?.verification_status !== 'approved') {
    redirect('/seller/dashboard');
  }

  return <BulkUploadForm seller={seller} />;
}
