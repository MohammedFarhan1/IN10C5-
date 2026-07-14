'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateSecretSuffix, buildVerificationId } from '@/lib/verification-id';

const VariantSchema = z.object({
  variant_id:    z.string().optional(),
  variant_code:  z.string().optional(),
  seller_sku:    z.string().optional(),
  price:         z.coerce.number().positive('Price must be positive'),
  compare_price: z.coerce.number().optional(),
  quantity:      z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  image_url:     z.string().optional(),
  attributes_raw: z.string().optional(),
});

// ── Create Variant ─────────────────────────────────────────
export async function createVariant(productId: string, state: unknown, formData: FormData) {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  const { data: product } = await supabase
    .from('products')
    .select('id, seller_id')
    .eq('id', productId)
    .eq('seller_id', session.userId)
    .single();

  if (!product) return { message: 'Product not found or access denied.' };

  const raw = Object.fromEntries(formData);
  const parsed = VariantSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { variant_id, variant_code, seller_sku, price, compare_price, quantity, image_url, attributes_raw } = parsed.data;

  const imageUrls: string[] = image_url
    ? image_url.split(/[\n,]+/).map((u) => u.trim()).filter((u) => u.length > 0)
    : [];

  let attributes: Record<string, string> = {};
  try {
    if (attributes_raw) attributes = JSON.parse(attributes_raw);
  } catch {
    return { message: 'Invalid attributes format. Please use valid JSON.' };
  }

  const sanitizedCode = variant_code?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || null;

  const { data: newVariant, error } = await supabase.from('product_variants').insert({
    product_id:    productId,
    variant_id:    variant_id || null,
    variant_code:  sanitizedCode,
    seller_sku:    seller_sku || null,
    price,
    compare_price: compare_price || null,
    quantity,
    images:        imageUrls,
    thumbnail:     imageUrls[0] || null,
    attributes,
  }).select('id, variant_code').single();

  if (error) return { message: 'Failed to create variant: ' + error.message };

  await supabase.from('products').update({ has_variants: true }).eq('id', productId);

  revalidatePath(`/seller/dashboard/products/${productId}/variants`);
  return { success: true, variantId: newVariant.id, variantCode: newVariant.variant_code };
}

// ── Update Variant ─────────────────────────────────────────
export async function updateVariant(variantId: string, state: unknown, formData: FormData) {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  const { data: variant } = await supabase
    .from('product_variants')
    .select('product_id, products!inner(seller_id)')
    .eq('id', variantId)
    .single();

  if (!variant || (variant.products as any)?.seller_id !== session.userId) {
    return { message: 'Variant not found or access denied.' };
  }

  const raw = Object.fromEntries(formData);
  const parsed = VariantSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { variant_id, variant_code, seller_sku, price, compare_price, quantity, image_url, attributes_raw } = parsed.data;

  const imageUrls: string[] = image_url
    ? image_url.split(/[\n,]+/).map((u) => u.trim()).filter((u) => u.length > 0)
    : [];

  let attributes: Record<string, string> = {};
  try {
    if (attributes_raw) attributes = JSON.parse(attributes_raw);
  } catch {
    return { message: 'Invalid attributes format.' };
  }

  const sanitizedCode = variant_code?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || null;

  const { error } = await supabase.from('product_variants').update({
    variant_id:    variant_id || null,
    variant_code:  sanitizedCode,
    seller_sku:    seller_sku || null,
    price,
    compare_price: compare_price || null,
    quantity,
    images:        imageUrls,
    thumbnail:     imageUrls[0] || null,
    attributes,
  }).eq('id', variantId);

  if (error) return { message: 'Failed to update variant: ' + error.message };

  revalidatePath(`/seller/dashboard/products/${variant.product_id}/variants`);
  return { success: true };
}

// ── Delete Variant ─────────────────────────────────────────
export async function deleteVariant(variantId: string, productId: string) {
  await requireRole('seller');
  const supabase = createAdminClient();

  await supabase
    .from('product_variants')
    .update({ is_active: false })
    .eq('id', variantId);

  const { count } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)
    .eq('is_active', true);

  if (!count || count === 0) {
    await supabase.from('products').update({ has_variants: false }).eq('id', productId);
  }

  revalidatePath(`/seller/dashboard/products/${productId}/variants`);
  return { success: true };
}

// ── Generate Verification IDs ───────────────────────────────
// Batch-creates product_units rows for a variant and returns the verification IDs.
export async function generateVariantIds(
  variantId: string,
  quantity: number,
): Promise<{ success: boolean; ids?: string[]; error?: string }> {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  if (quantity < 1 || quantity > 1000) {
    return { success: false, error: 'Quantity must be between 1 and 1,000.' };
  }

  const { data: variant } = await supabase
    .from('product_variants')
    .select('id, product_id, variant_code, unit_counter, products!inner(id, product_code, seller_id)')
    .eq('id', variantId)
    .single();

  if (!variant || (variant.products as any).seller_id !== session.userId) {
    return { success: false, error: 'Access denied or variant not found.' };
  }

  const productCode = (variant.products as any).product_code as string | null;
  if (!productCode) {
    return { success: false, error: 'Set a Model Code on the product before generating IDs.' };
  }
  if (!variant.variant_code) {
    return { success: false, error: 'Set a Variant Code on this variant before generating IDs.' };
  }

  const startSeq = (variant.unit_counter as number) ?? 0;

  // Atomically claim the next N unit numbers via optimistic lock on unit_counter
  const { data: locked } = await supabase
    .from('product_variants')
    .update({ unit_counter: startSeq + quantity })
    .eq('id', variantId)
    .eq('unit_counter', startSeq)
    .select('unit_counter');

  if (!locked?.length) {
    return { success: false, error: 'Counter conflict – another batch may be generating. Please try again.' };
  }

  const units = Array.from({ length: quantity }, (_, i) => {
    const unitNumber = startSeq + i + 1;
    const secret = generateSecretSuffix();
    const verificationId = buildVerificationId(productCode, variant.variant_code!, unitNumber, secret);
    return {
      product_id:      variant.product_id,
      variant_id:      variantId,
      verification_id: verificationId,
      unit_number:     unitNumber,
      secret_suffix:   secret,
      status:          'available' as const,
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from('product_units')
    .insert(units)
    .select('verification_id');

  if (insertError) {
    // Roll back the counter increment
    await supabase
      .from('product_variants')
      .update({ unit_counter: startSeq })
      .eq('id', variantId);
    return { success: false, error: insertError.message };
  }

  revalidatePath(`/seller/dashboard/products/${variant.product_id}/variants`);
  return { success: true, ids: inserted.map((u) => u.verification_id) };
}
