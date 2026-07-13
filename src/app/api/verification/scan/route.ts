import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

type VerificationIdentityRow = {
  id: string;
  product_id: string;
  seller_id: string;
  verification_id: string;
  verification_status: string;
  activation_status: string;
  total_scans: number;
  successful_verifications: number;
  failed_verifications: number;
  duplicate_attempts: number;
  high_risk_device_count: number;
  product?: {
    id: string;
    product_id?: string | null;
    name?: string | null;
    brand?: string | null;
    category?: string | null;
    batch_number?: string | null;
    manufacturing_details?: string | null;
    country_of_origin?: string | null;
    specifications?: Record<string, unknown> | null;
    thumbnail?: string | null;
  } | null;
};

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json().catch(() => ({}));
  const verificationId = String(body.verificationId || body.code || '').trim();

  if (!verificationId) {
    return NextResponse.json({ success: false, message: 'Verification ID is required' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const country = request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || 'Unknown';
  const city = request.headers.get('x-vercel-ip-city') || 'Unknown';
  const geolocation = `${country} / ${city}`;
  const deviceType = inferDevice(userAgent);
  const platformType = inferPlatform(userAgent);

  const { data: identity } = await supabase
    .from('verification_identities')
    .select(`
      *,
      product:products(
        id,
        product_id,
        name,
        brand,
        category,
        batch_number,
        manufacturing_details,
        country_of_origin,
        specifications,
        thumbnail
      )
    `)
    .or(`verification_id.eq.${verificationId},qr_id.eq.${verificationId},barcode_id.eq.${verificationId},nfc_id.eq.${verificationId}`)
    .single<VerificationIdentityRow>();

  if (!identity) {
    await supabase.from('verification_logs').insert({
      verification_id: verificationId,
      scan_result: 'failed',
      device_type: deviceType,
      platform_type: platformType,
      geolocation,
      country,
      ip_address: ip,
      user_agent: userAgent,
      risk_score: 100,
      risk_reasons: ['Unknown or invalid verification identity'],
      metadata: { source: 'nfc_verification_page' },
    });

    return NextResponse.json({
      success: false,
      status: 'Blocked',
      message: 'No matching product verification identity was found.',
    }, { status: 404 });
  }

  const { data: recentLogs } = await supabase
    .from('verification_logs')
    .select('country, ip_address, device_type, scanned_at')
    .eq('verification_identity_id', identity.id)
    .order('scanned_at', { ascending: false })
    .limit(25);

  const reasons: string[] = [];
  let riskScore = 0;
  const hasManyScans = identity.total_scans >= 20;
  const hasCountryDrift = Boolean(recentLogs?.some((log) => log.country && log.country !== country && log.country !== 'Unknown'));
  const hasDuplicateIp = Boolean(recentLogs?.some((log) => log.ip_address === ip));
  const highRiskDevice = /bot|crawler|spider|headless|curl|postman/i.test(userAgent);

  if (hasManyScans) {
    riskScore += 35;
    reasons.push('Excessive scan attempts detected');
  }
  if (hasCountryDrift) {
    riskScore += 30;
    reasons.push('Abnormal geo-location pattern detected');
  }
  if (hasDuplicateIp && identity.total_scans > 3) {
    riskScore += 20;
    reasons.push('Duplicate verification attempts from the same network');
  }
  if (highRiskDevice) {
    riskScore += 35;
    reasons.push('High-risk device or automation signature detected');
  }
  if (identity.activation_status !== 'Active' || identity.verification_status === 'Blocked') {
    riskScore += 70;
    reasons.push('Verification identity is inactive or blocked');
  }

  riskScore = Math.min(100, riskScore);
  const scanResult = riskScore >= 70 ? 'failed' : 'success';
  const nextStatus = identity.verification_status === 'Blocked'
    ? 'Blocked'
    : riskScore >= 70
      ? 'Blocked'
      : riskScore >= 40
        ? 'Suspicious'
        : 'Active';

  await supabase.from('verification_logs').insert({
    verification_identity_id: identity.id,
    verification_id: identity.verification_id,
    product_id: identity.product_id,
    seller_id: identity.seller_id,
    scan_result: scanResult,
    device_type: deviceType,
    platform_type: platformType,
    geolocation,
    country,
    ip_address: ip,
    user_agent: userAgent,
    risk_score: riskScore,
    risk_reasons: reasons,
    metadata: { source: 'nfc_verification_page' },
  });

  await supabase.from('verification_identities').update({
    total_scans: identity.total_scans + 1,
    successful_verifications: identity.successful_verifications + (scanResult === 'success' ? 1 : 0),
    failed_verifications: identity.failed_verifications + (scanResult === 'failed' ? 1 : 0),
    duplicate_attempts: identity.duplicate_attempts + (hasDuplicateIp ? 1 : 0),
    high_risk_device_count: identity.high_risk_device_count + (highRiskDevice ? 1 : 0),
    last_scan_at: new Date().toISOString(),
    verification_status: nextStatus,
  }).eq('id', identity.id);

  if (riskScore >= 40) {
    const alertType = riskScore >= 70 ? 'fake_cloned_tag_alert' : 'suspicious_scan_activity';
    await supabase.from('fraud_logs').insert({
      verification_identity_id: identity.id,
      product_id: identity.product_id,
      seller_id: identity.seller_id,
      alert_type: alertType,
      severity: riskScore >= 70 ? 'critical' : 'high',
      description: reasons.join(', ') || 'Suspicious verification activity detected.',
      evidence: { verificationId: identity.verification_id, country, ip, deviceType, platformType, riskScore },
    });

    await supabase.from('notifications').insert({
      seller_id: identity.seller_id,
      type: 'fraud_alert',
      title: 'Suspicious verification activity',
      message: `${identity.product?.name || 'A product'} triggered a ${riskScore}% verification risk score.`,
      entity_type: 'verification_identity',
      entity_id: identity.id,
    });
  }

  await supabase.from('analytics_data').upsert({
    seller_id: identity.seller_id,
    product_id: identity.product_id,
    metric_date: new Date().toISOString().slice(0, 10),
    daily_scans: 1,
    weekly_scans: 1,
    monthly_scans: 1,
    consumer_engagement: 1,
    region_activity: { [country]: 1 },
    fraud_score: riskScore,
  }, { onConflict: 'seller_id,product_id,metric_date', ignoreDuplicates: false });

  return NextResponse.json({
    success: true,
    status: nextStatus,
    authenticityState: scanResult === 'success' ? 'Authentic' : 'High risk',
    riskScore,
    reasons,
    product: identity.product,
    verification: {
      verificationId: identity.verification_id,
      activationStatus: identity.activation_status,
      lastScanAt: new Date().toISOString(),
    },
  });
}

function inferDevice(userAgent: string) {
  if (/mobile|iphone|android/i.test(userAgent)) return 'Mobile';
  if (/ipad|tablet/i.test(userAgent)) return 'Tablet';
  if (/bot|crawler|spider|headless|curl|postman/i.test(userAgent)) return 'Automation';
  return 'Desktop';
}

function inferPlatform(userAgent: string) {
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ios/i.test(userAgent)) return 'iOS';
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac os|macintosh/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  return 'Unknown';
}
