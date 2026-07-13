import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { unitCode, reason, description } = body;

    if (!unitCode || !reason) {
      return NextResponse.json({ success: false, message: 'Unit code and reporting classification required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Check unit passport
    const { data: unit } = await supabase
      .from('tracked_units')
      .select('id, counterfeit_reports_count, verification_status')
      .eq('unique_unit_code', unitCode)
      .single();

    if (!unit) {
      return NextResponse.json({ success: false, message: 'Invalid unit identity specified' }, { status: 404 });
    }

    // 2. Insert row into fraud_reports table
    await supabase.from('fraud_reports').insert({
      reporter_id: session?.userId || null,
      reported_type: 'unit',
      reported_id: unitCode,
      reason,
      description: description || 'Flagged via smart verification alert modal',
      status: 'open'
    });

    // 3. Update tracked unit reports count and logic
    const newCount = unit.counterfeit_reports_count + 1;
    let targetStatus = unit.verification_status;
    
    // Automatically transition states if multiple independent users report counterfeit behaviors
    if (newCount >= 3) {
      targetStatus = 'COUNTERFEIT';
    } else if (newCount >= 1 && targetStatus === 'VERIFIED') {
      targetStatus = 'SUSPICIOUS';
    }

    await supabase
      .from('tracked_units')
      .update({
        counterfeit_reports_count: newCount,
        verification_status: targetStatus,
        fraud_flag: true
      })
      .eq('unique_unit_code', unitCode);

    return NextResponse.json({
      success: true,
      message: 'Fraud incident registered successfully. Auditing alerts generated.',
      newStatus: targetStatus
    });

  } catch (error: any) {
    console.error('Fraud reporting processing error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to record tracking report log',
      error: error?.message
    }, { status: 500 });
  }
}
