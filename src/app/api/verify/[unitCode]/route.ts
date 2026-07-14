import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { parseVerificationId } from '@/lib/verification-id';
import { getSession } from '@/lib/auth';

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX       = 20;         // max verifications per IP per window

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ unitCode: string }> }
) {
  try {
    const { unitCode } = await params;
    const supabase = createAdminClient();

    const ip          = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
                        ?? request.headers.get('x-real-ip')
                        ?? '127.0.0.1';
    const userAgent   = request.headers.get('user-agent') ?? 'Unknown';
    const country     = request.headers.get('cf-ipcountry') ?? request.headers.get('x-vercel-ip-country') ?? 'US';
    const city        = request.headers.get('x-vercel-ip-city') ?? 'Localhost';
    const location    = `${country} / ${city}`;

    // ── 1. Rate limiting ─────────────────────────────────────
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: recentCount } = await supabase
      .from('verification_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('attempted_at', windowStart);

    if ((recentCount ?? 0) >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { success: false, status: 'RATE_LIMITED', message: 'Too many verification requests. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    // Log this attempt (non-blocking – fire-and-forget)
    supabase.from('verification_attempts').insert({ ip_address: ip }).then(() => {});

    // ── 2. Format validation ──────────────────────────────────
    const parsed = parseVerificationId(unitCode);

    if (!parsed) {
      // Fall back to legacy tracked_units lookup for old-format codes
      return legacyVerify(unitCode, supabase, ip, userAgent, location, country);
    }

    // ── 3. Look up product_units table ────────────────────────
    const { data: unit } = await supabase
      .from('product_units')
      .select(`
        id,
        verification_id,
        unit_number,
        status,
        owner_id,
        verification_count,
        last_verified_at,
        secret_suffix,
        product_id,
        variant_id,
        product:products(
          id, name, description, category, thumbnail, images,
          brand, model_number, country_of_origin, warranty,
          seller:sellers(id, business_name, trust_score, verification_status)
        ),
        variant:product_variants(
          id, variant_code, attributes, color, storage, size, thumbnail
        )
      `)
      .eq('verification_id', unitCode.toUpperCase())
      .single();

    // Log verification attempt in verification_logs
    const logInsert = {
      unit_code: unitCode,
      ip_address: ip,
      device_fingerprint: Buffer.from(userAgent).toString('base64').substring(0, 32),
      geolocation: location,
      country,
    };

    // ── 4. NOT FOUND ──────────────────────────────────────────
    if (!unit) {
      await supabase.from('verification_logs').insert({ ...logInsert, status: 'INVALID', risk_score: 100 });
      return NextResponse.json({
        success: false,
        status: 'NOT_FOUND',
        message: 'This verification ID is not registered in the Trusta registry. It may be counterfeit.',
      }, { status: 404 });
    }

    // ── 5. Determine current user (optional – for ownership check) ────
    let currentUserId: string | null = null;
    try {
      const session = await getSession();
      currentUserId = session?.userId ?? null;
    } catch { /* not logged in */ }

    // ── 6. CLAIMED BY ANOTHER PERSON ─────────────────────────
    if (unit.status === 'sold' && unit.owner_id && unit.owner_id !== currentUserId) {
      // Auto-raise fraud report for this re-scan attempt
      await supabase.from('fraud_reports').insert({
        reporter_id:   currentUserId ?? null,
        reported_type: 'unit',
        reported_id:   unit.id,
        reason:        'Verification ID already claimed by another user',
        description:   `Re-scan of unit ${unitCode} from IP ${ip} at ${location}. Unit is owned by a different account.`,
        status:        'open',
      });

      await supabase.from('verification_logs').insert({ ...logInsert, product_unit_id: unit.id, status: 'SUSPICIOUS', risk_score: 80 });

      return NextResponse.json({
        success: true,
        status: 'CLAIMED',
        message: 'This unit has already been registered to another buyer. A fraud report has been filed automatically.',
        data: {
          authenticityState: 'SUSPICIOUS',
          unit: { verification_id: unit.verification_id, unit_number: unit.unit_number },
          product: unit.product,
          variant: unit.variant,
        },
      });
    }

    // ── 7. VERIFIED ───────────────────────────────────────────
    const newCount = (unit.verification_count ?? 0) + 1;
    await supabase.from('product_units').update({
      verification_count: newCount,
      last_verified_at: new Date().toISOString(),
    }).eq('id', unit.id);

    await supabase.from('verification_logs').insert({ ...logInsert, product_unit_id: unit.id, status: 'VERIFIED', risk_score: 0 });

    const seller = (unit.product as any)?.seller;
    const sellerApproved = seller?.verification_status === 'approved';

    return NextResponse.json({
      success: true,
      status: 'VERIFIED',
      data: {
        authenticityState: sellerApproved ? 'VERIFIED' : 'SUSPICIOUS',
        fraudScore: sellerApproved ? 0 : 30,
        reasons: sellerApproved ? [] : ['Brand owner account is not fully approved.'],
        unit: {
          id:               unit.id,
          verification_id:  unit.verification_id,
          unit_number:      unit.unit_number,
          status:           unit.status,
          is_owned:         !!unit.owner_id,
          owned_by_me:      unit.owner_id === currentUserId,
          verification_count: newCount,
          last_verified_at:   new Date().toISOString(),
        },
        product: unit.product,
        variant: unit.variant,
        warrantyState: (unit.product as any)?.warranty ?? 'Standard 1-Year Coverage',
        scanSummary: {
          totalScans:       newCount,
          lastScanLocation: location,
          lastScanAt:       new Date().toISOString(),
        },
      },
    });

  } catch (error: any) {
    console.error('Verification route error:', error);
    return NextResponse.json({
      success: false,
      status: 'ERROR',
      message: 'Internal verification error',
      error:   error?.message,
    }, { status: 500 });
  }
}

// ── Legacy: handle old tracked_units format (TRU-YYYY-XXXXXX) ────────
async function legacyVerify(
  unitCode: string,
  supabase: ReturnType<typeof createAdminClient>,
  ip: string,
  userAgent: string,
  location: string,
  country: string,
) {
  const deviceFingerprint = Buffer.from(userAgent).toString('base64').substring(0, 32);

  const { data: unit } = await supabase
    .from('tracked_units')
    .select('*, product:products(*), variant:product_variants(*), seller:sellers(*)')
    .eq('unique_unit_code', unitCode)
    .single();

  if (!unit) {
    await supabase.from('verification_logs').insert({
      unit_code: unitCode, ip_address: ip, device_fingerprint: deviceFingerprint,
      geolocation: location, country, status: 'INVALID', risk_score: 100,
    });
    return NextResponse.json({
      success: false,
      status: 'INVALID_FORMAT',
      message: 'Verification ID format is not recognised. Expected format: TRU-MODEL-VARIANT-0001-K7QF',
    }, { status: 400 });
  }

  // Reuse the old fraud-scoring logic for legacy units
  let fraudScore = 0;
  const reasons: string[] = [];

  if (unit.scan_count > 15)           { fraudScore += 40; reasons.push('Excessive scan volume for a single unit.'); }
  else if (unit.scan_count > 5)         fraudScore += 15;
  if (unit.counterfeit_reports_count > 2) { fraudScore += 50; reasons.push('Multiple counterfeit reports.'); }
  else if (unit.counterfeit_reports_count > 0) fraudScore += 25;
  const sellerStatus = unit.seller?.verification_status;
  if (sellerStatus === 'suspended' || sellerStatus === 'rejected') { fraudScore += 60; reasons.push('Seller account suspended/rejected.'); }
  else if (sellerStatus !== 'approved') fraudScore += 20;
  if (unit.fraud_flag) { fraudScore += 50; reasons.push('Unit manually flagged as high-risk.'); }
  if (unit.last_scan_location && !unit.last_scan_location.startsWith(country) && unit.scan_count > 1) {
    fraudScore += 30; reasons.push('Geographical hopping detected.');
  }
  fraudScore = Math.min(100, fraudScore);

  const authenticityState = fraudScore >= 70 ? 'COUNTERFEIT' : fraudScore >= 40 ? 'SUSPICIOUS' : 'VERIFIED';

  await supabase.from('tracked_units').update({
    scan_count: unit.scan_count + 1,
    last_scan_location: location,
    last_scan_at: new Date().toISOString(),
    fraud_flag: fraudScore >= 50 || unit.fraud_flag,
  }).eq('unique_unit_code', unitCode);

  await supabase.from('verification_logs').insert({
    unit_code: unitCode, ip_address: ip, device_fingerprint: deviceFingerprint,
    geolocation: location, country, status: authenticityState, risk_score: fraudScore,
  });

  const warrantyState = unit.warranty_expiry && new Date(unit.warranty_expiry) < new Date()
    ? 'Expired' : unit.warranty_expiry ? 'Active' : 'Standard 1-Year Included';

  return NextResponse.json({
    success: true,
    data: {
      unit: { ...unit, scan_count: unit.scan_count + 1, last_scan_location: location, last_scan_at: new Date().toISOString() },
      authenticityState, fraudScore, reasons, warrantyState,
      scanSummary: { totalScans: unit.scan_count + 1, lastScanLocation: location, lastScanAt: new Date().toISOString() },
    },
  });
}
