import 'server-only';
import { nanoid } from 'nanoid';

/**
 * Generates a unique product serial number.
 * Format: TRU-YYYY-XXXXXX (uppercase alphanumeric)
 */
export function generateSerialNumber(): string {
  const year = new Date().getFullYear();
  const code = nanoid(6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  return `TRU-${year}-${code}`;
}

/**
 * Generates an order number.
 * Format: TRU-ORD-YYYYMMDD-XXXXX
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = nanoid(5).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  return `TRU-ORD-${dateStr}-${suffix}`;
}

/**
 * Generates a short unique verification identity for one physical item.
 * The prefix is intentionally human-readable so sellers can search it quickly.
 */
export function generateVerificationId(productCode?: string | null): string {
  const cleanedPrefix = (productCode || 'WB')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6) || 'WB';
  const suffix = nanoid(8).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  return `${cleanedPrefix}-${suffix}`;
}

export function generateNfcId(verificationId: string): string {
  const suffix = nanoid(6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  return `NFC-${verificationId}-${suffix}`;
}
