import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', id)
      .eq('verification_status', 'approved')
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });
    }

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ success: true, data: { seller: data, products: products ?? [] } });
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch seller' }, { status: 500 });
  }
}
