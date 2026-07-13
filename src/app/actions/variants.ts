'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const VariantSchema = z.object({
  variant_id: z.string().optional(),
  seller_sku: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  compare_price: z.coerce.number().optional(),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  image_url: z.string().optional(),
  attributes_raw: z.string().optional(), // JSON string of { "Color": "Red", "Size": "XL" }
});

// ── Create Variant ─────────────────────────────────────────
export async function createVariant(productId: string, state: unknown, formData: FormData) {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  // Verify the product belongs to this seller
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

  const { variant_id, seller_sku, price, compare_price, quantity, image_url, attributes_raw } = parsed.data;

  const imageUrls: string[] = image_url
    ? image_url.split(/[\n,]+/).map((u) => u.trim()).filter((u) => u.length > 0)
    : [];

  let attributes: Record<string, string> = {};
  try {
    if (attributes_raw) attributes = JSON.parse(attributes_raw);
  } catch {
    return { message: 'Invalid attributes format. Please use valid JSON.' };
  }

  const { error } = await supabase.from('product_variants').insert({
    product_id: productId,
    variant_id: variant_id || null,
    seller_sku: seller_sku || null,
    price,
    compare_price: compare_price || null,
    quantity,
    images: imageUrls,
    thumbnail: imageUrls[0] || null,
    attributes,
  });

  if (error) return { message: 'Failed to create variant: ' + error.message };

  // Mark product as having variants
  await supabase.from('products').update({ has_variants: true }).eq('id', productId);

  revalidatePath(`/seller/dashboard/products/${productId}/variants`);
  return { success: true };
}

// ── Update Variant ─────────────────────────────────────────
export async function updateVariant(variantId: string, state: unknown, formData: FormData) {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  // Verify ownership via join
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

  const { variant_id, seller_sku, price, compare_price, quantity, image_url, attributes_raw } = parsed.data;

  const imageUrls: string[] = image_url
    ? image_url.split(/[\n,]+/).map((u) => u.trim()).filter((u) => u.length > 0)
    : [];

  let attributes: Record<string, string> = {};
  try {
    if (attributes_raw) attributes = JSON.parse(attributes_raw);
  } catch {
    return { message: 'Invalid attributes format.' };
  }

  const { error } = await supabase.from('product_variants').update({
    variant_id: variant_id || null,
    seller_sku: seller_sku || null,
    price,
    compare_price: compare_price || null,
    quantity,
    images: imageUrls,
    thumbnail: imageUrls[0] || null,
    attributes,
  }).eq('id', variantId);

  if (error) return { message: 'Failed to update variant: ' + error.message };

  revalidatePath(`/seller/dashboard/products/${variant.product_id}/variants`);
  return { success: true };
}

// ── Delete Variant ─────────────────────────────────────────
export async function deleteVariant(variantId: string, productId: string) {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  // Soft-delete by deactivating
  await supabase
    .from('product_variants')
    .update({ is_active: false })
    .eq('id', variantId);

  // Check if any active variants remain
  const { count } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)
    .eq('is_active', true);

  // If none remain, mark product has_variants = false
  if (!count || count === 0) {
    await supabase.from('products').update({ has_variants: false }).eq('id', productId);
  }

  revalidatePath(`/seller/dashboard/products/${productId}/variants`);
  return { success: true };
}
