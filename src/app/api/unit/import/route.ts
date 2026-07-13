import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.role !== 'seller' && session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized execution attempt' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const defaultProductId = formData.get('productId') as string;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No CSV file payload found' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      return NextResponse.json({ success: false, message: 'CSV file contains insufficient rows' }, { status: 400 });
    }

    // Skip header row
    const rowsToInsert = [];
    const supabase = createAdminClient();

    // Cache verified products map
    const productCache: Record<string, string> = {};

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(s => s.trim());
      // Expecting CSV layout: unique_unit_code, serial_number, product_id
      const unitCode = parts[0];
      const serialNum = parts[1];
      const prodId = parts[2] || defaultProductId;

      if (!unitCode || !serialNum || !prodId) continue;

      // Determine seller ID matching this product
      let sellerId = productCache[prodId];
      if (!sellerId) {
        const { data: p } = await supabase.from('products').select('seller_id').eq('id', prodId).single();
        if (p) {
          sellerId = p.seller_id;
          productCache[prodId] = sellerId;
        }
      }

      if (!sellerId) continue;
      // Authorize access
      if (session.role === 'seller' && sellerId !== session.userId) continue;

      const qrUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/verify/${unitCode}`;

      rowsToInsert.push({
        product_id: prodId,
        seller_id: sellerId,
        unique_unit_code: unitCode,
        serial_number: serialNum,
        qr_code_url: qrUrl,
        verification_status: 'VERIFIED',
        ownership_status: 'UNCLAIMED'
      });
    }

    if (rowsToInsert.length === 0) {
      return NextResponse.json({ success: false, message: 'No authorized/valid serial records extracted' }, { status: 400 });
    }

    const { error } = await supabase.from('tracked_units').insert(rowsToInsert);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Successfully batch parsed and imported ${rowsToInsert.length} tracked product units`,
      count: rowsToInsert.length
    });

  } catch (error: any) {
    console.error('CSV Import route failure:', error);
    return NextResponse.json({
      success: false,
      message: 'Processing error during CSV file ingestion',
      error: error?.message
    }, { status: 500 });
  }
}
