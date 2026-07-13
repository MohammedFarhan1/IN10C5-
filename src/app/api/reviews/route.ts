import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const productId = new URL(req.url).searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('*, profile:profiles(name, avatar_url)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, unitCode, orderId, rating, title, comment, images } = body;

    if (!productId || !rating) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verified purchase gate: check that user owns a valid unrevoked passport unit of this product
    let verifiedPurchase = false;

    // Check tracked_units direct ownership binding
    const { data: ownedUnits } = await supabase
      .from('tracked_units')
      .select('id, verification_status')
      .eq('product_id', productId)
      .eq('current_owner_id', session.userId);

    if (ownedUnits && ownedUnits.some(u => u.verification_status === 'VERIFIED')) {
      verifiedPurchase = true;
    } else if (orderId) {
      // Legacy order confirmation check fallback
      const { data: orderItem } = await supabase
        .from('order_items')
        .select('id, order:orders(user_id, status)')
        .eq('order_id', orderId)
        .eq('product_id', productId)
        .single();

      const order = orderItem?.order as any;
      if (order?.user_id === session.userId && order?.status === 'delivered') {
        verifiedPurchase = true;
      }
    }

    // Strict system rule: Only verified product owners can review products.
    if (!verifiedPurchase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Review access restricted strictly to cryptographically verified product owners.' 
      }, { status: 403 });
    }

    const { data, error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: session.userId,
      order_id: orderId || null,
      unit_code: unitCode || null,
      rating,
      title: title || null,
      comment: comment || null,
      images: images || [],
      verified_purchase: verifiedPurchase,
    }).select().single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'You have already reviewed this product' }, { status: 409 });
      }
      throw error;
    }

    // Update product avg_rating + verified_buyer_reviews count
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating, verified_purchase')
      .eq('product_id', productId);

    if (allReviews) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      const verifiedCount = allReviews.filter((r) => r.verified_purchase).length;
      await supabase.from('products').update({
        avg_rating: Math.round(avg * 100) / 100,
        verified_buyer_reviews: verifiedCount,
      }).eq('id', productId);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ success: false, error: 'Failed to create review' }, { status: 500 });
  }
}
