import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ unitCode: string }> }
) {
  try {
    const { unitCode } = await params;
    const supabase = createAdminClient();

    // Extract device/geo context from headers
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown Device';
    // Simple mock hash for device fingerprint
    const deviceFingerprint = Buffer.from(userAgent).toString('base64').substring(0, 32);
    const country = request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || 'US';
    const city = request.headers.get('x-vercel-ip-city') || 'Localhost';
    const locationString = `${country} / ${city}`;

    // 1. Fetch tracked unit with product and seller joins
    const { data: unit } = await supabase
      .from('tracked_units')
      .select(`
        *,
        product:products(*),
        variant:product_variants(*),
        seller:sellers(*)
      `)
      .eq('unique_unit_code', unitCode)
      .single();

    if (!unit) {
      // Log invalid scan attempt
      await supabase.from('verification_logs').insert({
        unit_code: unitCode,
        ip_address: ip,
        device_fingerprint: deviceFingerprint,
        geolocation: locationString,
        country,
        status: 'INVALID',
        risk_score: 100
      });

      return NextResponse.json({
        success: false,
        status: 'INVALID',
        message: 'No physical product matching this serialized unit code exists in the trust registry.',
      }, { status: 404 });
    }

    if (unit.verification_status === 'REVOKED') {
      await supabase.from('verification_logs').insert({
        unit_code: unitCode,
        ip_address: ip,
        device_fingerprint: deviceFingerprint,
        geolocation: locationString,
        country,
        status: 'REVOKED',
        risk_score: 90
      });

      return NextResponse.json({
        success: true,
        data: {
          unit,
          authenticityState: 'REVOKED',
          fraudScore: 90,
          warrantyState: 'Revoked',
          scanSummary: {
            totalScans: unit.scan_count + 1,
            lastScanLocation: locationString,
            lastScanAt: new Date().toISOString()
          }
        }
      });
    }

    // 2. Fraud scoring calculation
    let fraudScore = 0;
    const reasons: string[] = [];

    // Factor A: Excessive scans
    if (unit.scan_count > 15) {
      fraudScore += 40;
      reasons.push('Excessive scan volume detected for a single unit passport.');
    } else if (unit.scan_count > 5) {
      fraudScore += 15;
    }

    // Factor B: Counterfeit reports count
    if (unit.counterfeit_reports_count > 2) {
      fraudScore += 50;
      reasons.push('Multiple counterfeit reports flagged by certified consumers.');
    } else if (unit.counterfeit_reports_count > 0) {
      fraudScore += 25;
    }

    // Factor C: Blacklisted or Unverified Seller
    const sellerStatus = unit.seller?.verification_status;
    if (sellerStatus === 'suspended' || sellerStatus === 'rejected') {
      fraudScore += 60;
      reasons.push('Issuing vendor accreditation state is currently suspended/invalid.');
    } else if (sellerStatus !== 'approved') {
      fraudScore += 20;
    }

    // Factor D: Fraud flags on unit row directly
    if (unit.fraud_flag) {
      fraudScore += 50;
      reasons.push('Unit code manually marked as high-risk audit flag.');
    }

    // Factor E: Impossible travel logic check (mock simulation comparing location strings)
    if (unit.last_scan_location && !unit.last_scan_location.startsWith(country) && unit.scan_count > 1) {
      fraudScore += 30;
      reasons.push('Rapid geographical hopping identified across international borders.');
    }

    // Cap at 100
    fraudScore = Math.min(100, fraudScore);

    // Determine target Authenticity Status based on dynamic rules
    let authenticityState = 'VERIFIED';
    if (fraudScore >= 70) {
      authenticityState = 'COUNTERFEIT';
    } else if (fraudScore >= 40) {
      authenticityState = 'SUSPICIOUS';
    }

    // Warranty calculation
    let warrantyState = 'Active';
    if (unit.warranty_expiry && new Date(unit.warranty_expiry) < new Date()) {
      warrantyState = 'Expired';
    } else if (!unit.warranty_expiry) {
      warrantyState = 'Standard 1-Year Included';
    }

    // 3. Update unit row counts and last scan metadata
    await supabase
      .from('tracked_units')
      .update({
        scan_count: unit.scan_count + 1,
        last_scan_location: locationString,
        last_scan_at: new Date().toISOString(),
        verification_status: authenticityState === 'VERIFIED' ? unit.verification_status : authenticityState,
        fraud_flag: fraudScore >= 50 || unit.fraud_flag
      })
      .eq('unique_unit_code', unitCode);

    // 4. Log detailed secure verification log row
    await supabase.from('verification_logs').insert({
      unit_code: unitCode,
      ip_address: ip,
      device_fingerprint: deviceFingerprint,
      geolocation: locationString,
      country,
      status: authenticityState,
      risk_score: fraudScore
    });

    // Update product dynamic counters if authentic
    if (authenticityState === 'VERIFIED' && unit.product_id) {
      // Background incremental telemetry trigger
      // Note: non-blocking or simple update
    }

    return NextResponse.json({
      success: true,
      data: {
        unit: {
          ...unit,
          scan_count: unit.scan_count + 1,
          last_scan_location: locationString,
          last_scan_at: new Date().toISOString()
        },
        authenticityState,
        fraudScore,
        reasons,
        warrantyState,
        scanSummary: {
          totalScans: unit.scan_count + 1,
          lastScanLocation: locationString,
          lastScanAt: new Date().toISOString()
        }
      }
    });

  } catch (error: any) {
    console.error('Verification route error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal verification engine failure',
      error: error?.message
    }, { status: 500 });
  }
}
