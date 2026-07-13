import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const [{ data: product, error }, { data: reviews }, { data: variants }] = await Promise.all([
      supabase
        .from('products')
        .select('*, seller:sellers(*)')
        .eq('id', id)
        .eq('is_active', true)
        .single(),
      supabase
        .from('reviews')
        .select('*, profile:profiles(name, avatar_url)')
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
    ]);

    if (error || !product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        product: { ...product, variants: variants ?? [] },
        reviews: reviews ?? [],
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 });
  }
}

