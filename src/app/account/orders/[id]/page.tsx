import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OrderDetailClient from './OrderDetailClient';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole('customer');
  const { id }  = await params;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      user_id,
      status,
      payment_status,
      payment_method,
      subtotal,
      shipping_fee,
      discount,
      total,
      notes,
      cancel_reason,
      cancelled_at,
      delivered_at,
      created_at,
      updated_at,
      shipping_address,
      order_items(
        id,
        product_id,
        product_name,
        product_image,
        unit_price,
        quantity,
        total,
        unit_code,
        item_status
      )
    `)
    .eq('id', id)
    .eq('user_id', session.userId)
    .single();

  if (!order) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <OrderDetailClient initialOrder={order as any} />
      </main>
      <Footer />
    </div>
  );
}
