// Verification ID utilities – safe for both server and client imports.
// Format: TRU-{model_code}-{variant_code}-{unit_number}-{secret}
// Example: TRU-SNY-XM5-BLK-0001-K7QF
//
// model_code    : [A-Z0-9-]+ (may contain dashes, ≥2 chars)
// variant_code  : [A-Z0-9]+  (no dashes, 2-8 chars)
// unit_number   : zero-padded decimal, 4-6 digits
// secret        : [A-Z0-9]{4} ambiguity-free chars
//
// Parsing is done right-to-left so multi-segment model_codes work.

export interface ParsedVerificationId {
  modelCode: string;
  variantCode: string;
  unitNumber: number;
  secret: string;
}

/** Returns null when the ID doesn't match the expected format. */
export function parseVerificationId(raw: string): ParsedVerificationId | null {
  const id = raw.trim().toUpperCase();
  if (!id.startsWith('TRU-')) return null;

  const parts = id.split('-');
  // Minimum segments: TRU + ≥1 model part + variantCode + unitNumber + secret = 5
  if (parts.length < 5) return null;

  const secret      = parts[parts.length - 1];
  const unitStr     = parts[parts.length - 2];
  const variantCode = parts[parts.length - 3];
  const modelCode   = parts.slice(1, parts.length - 3).join('-');

  if (!/^[A-Z0-9]{4}$/.test(secret))         return null;
  if (!/^\d{4,6}$/.test(unitStr))             return null;
  if (!/^[A-Z0-9]{2,8}$/.test(variantCode))  return null;
  if (modelCode.length < 2 || modelCode.length > 20) return null;
  if (!/^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$/.test(modelCode) && !/^[A-Z0-9]{2}$/.test(modelCode)) return null;

  return { modelCode, variantCode, unitNumber: parseInt(unitStr, 10), secret };
}

/** 4-character secret using visually unambiguous characters. */
export function generateSecretSuffix(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

export function buildVerificationId(
  modelCode: string,
  variantCode: string,
  unitNumber: number,
  secret: string,
): string {
  return [
    'TRU',
    modelCode.toUpperCase().replace(/[^A-Z0-9-]/g, ''),
    variantCode.toUpperCase().replace(/[^A-Z0-9]/g, ''),
    String(unitNumber).padStart(4, '0'),
    secret.toUpperCase(),
  ].join('-');
}

/** Sanitize a model code (allows dashes) or variant code (no dashes) input. */
export function sanitizeCode(value: string, allowDash = false): string {
  const pattern = allowDash ? /[^A-Z0-9-]/g : /[^A-Z0-9]/g;
  return value.toUpperCase().replace(pattern, '').slice(0, 20);
}
