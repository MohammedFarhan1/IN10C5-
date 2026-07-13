import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireRole('admin');
    const { unitCode } = await request.json();

    if (!unitCode) {
      return NextResponse.json({ success: false, message: 'Unit verification code parameter missing' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('tracked_units')
      .update({
        verification_status: 'REVOKED',
        fraud_flag: true
      })
      .eq('unique_unit_code', unitCode);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Passport serial unit ${unitCode} revoked successfully.`
    });

  } catch (error: any) {
    console.error('Revocation action failure:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to revoke specified tracking passport',
      error: error?.message
    }, { status: 500 });
  }
}
