import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    // Allow sellers or admins to bulk generate passports
    if (session.role !== 'seller' && session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized permission level' }, { status: 403 });
    }

    const body = await request.json();
    const { productId, variantId, count = 1, prefix = 'UNIT', warrantyMonths = 12 } = body;

    if (!productId || typeof count !== 'number' || count <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid bulk parameters provided' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify product belongs to current seller if role is seller
    const { data: product } = await supabase
      .from('products')
      .select('id, seller_id, name')
      .eq('id', productId)
      .single();

    if (!product) {
      return NextResponse.json({ success: false, message: 'Specified product does not exist' }, { status: 404 });
    }

    if (session.role === 'seller' && product.seller_id !== session.userId) {
      return NextResponse.json({ success: false, message: 'Forbidden access to non-owned products' }, { status: 403 });
    }

    // Verify variant if passed
    if (variantId) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('id')
        .eq('id', variantId)
        .eq('product_id', productId)
        .single();
      
      if (!variant) {
        return NextResponse.json({ success: false, message: 'Specified variant does not belong to this product' }, { status: 404 });
      }
    }

    // Calculate future warranty date
    const warrantyExpiry = new Date();
    warrantyExpiry.setMonth(warrantyExpiry.getMonth() + warrantyMonths);

    const insertedRows = [];
    const timestamp = Date.now().toString(36).toUpperCase();

    // Generate loop securely avoiding collisions
    for (let i = 0; i < count; i++) {
      const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
      const uniqueUnitCode = `${prefix}-${timestamp}-${randomHex}-${i + 1}`;
      const serialNumber = `SN-${product.id.substring(0, 4).toUpperCase()}-${variantId ? variantId.substring(0, 4).toUpperCase() : 'BASE'}-${timestamp}-${randomHex}`;
      const qrUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/verify/${uniqueUnitCode}`;

      insertedRows.push({
        product_id: productId,
        seller_id: product.seller_id,
        variant_id: variantId || null,
        unique_unit_code: uniqueUnitCode,
        serial_number: serialNumber,
        qr_code_url: qrUrl,
        verification_status: 'VERIFIED',
        ownership_status: 'UNCLAIMED',
        warranty_expiry: warrantyExpiry.toISOString()
      });
    }

    // Perform bulk batch insert
    const { data, error } = await supabase
      .from('tracked_units')
      .insert(insertedRows)
      .select('id, unique_unit_code, serial_number, qr_code_url, created_at');

    if (error) {
      throw error;
    }

    // Update product active verified units count if needed
    return NextResponse.json({
      success: true,
      message: `Successfully manufactured ${count} secure unit passports`,
      data: data
    });

  } catch (error: any) {
    console.error('Bulk generation service error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to complete unit generation batch',
      error: error?.message
    }, { status: 500 });
  }
}
