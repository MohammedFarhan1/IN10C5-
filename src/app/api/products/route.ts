import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { ProductFilters } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const verified = searchParams.get('verified');
    const search = searchParams.get('search');
    const sortBy = (searchParams.get('sortBy') as ProductFilters['sortBy']) || 'featured';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const from = (page - 1) * limit;

    const supabase = createAdminClient();
    let query = supabase
      .from('products')
      .select('*, seller:sellers(id, business_name, trust_score, verification_status, logo_url)', { count: 'exact' })
      .eq('is_active', true);

    if (category) query = query.eq('category', category.toLowerCase());
    if (verified === 'true') query = query.eq('authenticity_verified', true);
    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
    if (search) query = query.textSearch('name', search, { type: 'websearch' });

    switch (sortBy) {
      case 'featured':   query = query.order('featured', { ascending: false }); break;
      case 'trending':   query = query.order('trending', { ascending: false }); break;
      case 'price_asc':  query = query.order('price', { ascending: true }); break;
      case 'price_desc': query = query.order('price', { ascending: false }); break;
      case 'newest':     query = query.order('created_at', { ascending: false }); break;
      case 'rating':     query = query.order('avg_rating', { ascending: false }); break;
      default:           query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: { total: count ?? 0, page, pages: Math.ceil((count ?? 0) / limit) },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}
