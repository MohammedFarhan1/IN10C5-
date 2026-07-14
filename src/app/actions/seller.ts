'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { requireRole } from '@/lib/auth';
import { generateNfcId, generateSerialNumber, generateVerificationId } from '@/lib/serial';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ProductSchema = z.object({
  product_id: z.string().optional(),
  product_code: z.string().optional(),
  name: z.string().min(2, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  brand: z.string().min(1, 'Brand is required'),
  category: z.string().min(2, 'Category is required'),
  batch_number: z.string().min(1, 'Batch number is required'),
  manufacturing_date: z.string().optional(),
  expiry_date: z.string().optional(),
  manufacturing_details: z.string().min(2, 'Manufacturing details are required'),
  country_of_origin: z.string().min(2, 'Country of origin is required'),
  price: z.coerce.number().positive('Price must be positive'),
  compare_price: z.coerce.number().optional(),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  specifications: z.string().optional(),
  image_url: z.string().optional(),
  verification_id: z.string().optional(),
});

type BulkVariantPayload = Record<string, unknown> & {
  custom_variant_id?: string;
  variant_id?: string;
  price?: number | string;
  mrp?: number | string;
  compare_price?: number | string;
  stock_quantity?: number | string;
  quantity?: number | string;
  seller_sku?: string;
};

type BulkProductPayload = Record<string, unknown> & {
  product_id?: string;
  product_name?: string;
  name?: string;
  description?: string;
  category?: string;
  specifications?: Record<string, string>;
  brand?: string;
  main_image?: string;
  gallery_images?: unknown[];
  variants?: BulkVariantPayload[];
  price?: number | string;
  mrp?: number | string;
  compare_price?: number | string;
  stock_quantity?: number | string;
  quantity?: number | string;
};

// ── Create Product ────────────────────────────────────────────────

export async function createProduct(state: unknown, formData: FormData) {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  // Check verification status
  const { data: seller } = await supabase.from('sellers').select('verification_status').eq('id', session.userId).single();
  if (seller?.verification_status !== 'approved') {
    return { message: 'Your account is pending approval. You cannot add products yet.' };
  }

  const raw = Object.fromEntries(formData);
  const parsed = ProductSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const {
    product_id,
    product_code,
    name,
    description,
    brand,
    category,
    batch_number,
    manufacturing_date,
    expiry_date,
    manufacturing_details,
    country_of_origin,
    price,
    compare_price,
    quantity,
    specifications,
    image_url,
    verification_id,
  } = parsed.data;
  if (!verification_id?.trim()) {
    return { errors: { verification_id: ['Verification ID is required'] } };
  }
  
  const imageUrls: string[] = image_url 
    ? image_url.split(/[\n,]+/).map(u => u.trim()).filter(u => u.length > 0)
    : [];

  let specs: Record<string, string> = {};
  try { specs = JSON.parse(specifications || '{}'); } catch {}

  const customProductId = product_id?.trim() || null;
  const sanitizedProductCode = product_code?.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '') || null;
  const verificationIdBase = verification_id.trim().toUpperCase();
  const uniqueMethods = ['qr', 'barcode', 'nfc'];

  // Create product
  const { data: product, error } = await supabase.from('products').insert({
    seller_id: session.userId,
    product_id: customProductId,
    product_code: sanitizedProductCode,
    name,
    description,
    brand,
    category: category.toLowerCase(),
    batch_number,
    manufacturing_date: manufacturing_date || null,
    expiry_date: expiry_date || null,
    manufacturing_details,
    country_of_origin,
    price,
    compare_price: compare_price || null,
    images: imageUrls,
    thumbnail: imageUrls[0] || null,
    specifications: specs,
    quantity,
    verification_methods: uniqueMethods,
  }).select().single();

  if (error) {
    // Friendly error for unique constraint violation on product_id
    if (error.message.includes('unique') || error.message.includes('duplicate key')) {
      return { message: 'The Product ID entered is already in use. Please choose a unique ID.' };
    }
    return { message: 'Failed to create product: ' + error.message };
  }

  // Generate serialized units
  const units = Array.from({ length: quantity }, () => ({
    unit_code: generateSerialNumber(),
    product_id: product.id,
    seller_id: session.userId,
    status: 'in_stock' as const,
  }));
  const { data: serializedUnits, error: unitError } = units.length > 0
    ? await supabase.from('serialized_units').insert(units).select('id, unit_code')
    : { data: [], error: null };

  if (unitError) {
    return { message: 'Product created, but serialized inventory generation failed: ' + unitError.message };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const totalIdentities = serializedUnits?.length || 0;
  const identities = (serializedUnits || []).map((unit, index) => {
    const verificationId = totalIdentities > 1
      ? `${verificationIdBase}-${String(index + 1).padStart(3, '0')}`
      : verificationIdBase || generateVerificationId(customProductId || product.product_id || batch_number);
    const qrId = uniqueMethods.includes('qr') ? verificationId : null;
    const barcodeId = uniqueMethods.includes('barcode') ? verificationId : null;
    const nfcId = uniqueMethods.includes('nfc') ? generateNfcId(verificationId) : null;

    return {
      product_id: product.id,
      seller_id: session.userId,
      serialized_unit_id: unit.id,
      verification_id: verificationId,
      qr_id: qrId,
      barcode_id: barcodeId,
      nfc_id: nfcId,
      qr_code_url: qrId ? `${appUrl}/nfc-verification?code=${encodeURIComponent(verificationId)}` : null,
      barcode_value: barcodeId,
      methods: uniqueMethods,
      verification_status: 'Active',
      activation_status: 'Active',
      verification_date: new Date().toISOString(),
    };
  });

  if (identities.length > 0) {
    const { error: identityError } = await supabase.from('verification_identities').insert(identities);
    if (identityError) {
      return { message: 'Product created, but verification identity generation failed: ' + identityError.message };
    }
  }

  await supabase.from('notifications').insert({
    user_id: session.userId,
    seller_id: session.userId,
    type: 'new_product_verification',
    title: 'Verification identities generated',
    message: `${identities.length} verification identities were generated for ${name}.`,
    entity_type: 'product',
    entity_id: product.id,
  });

  // Update seller product count
  await supabase.rpc('increment', { table: 'sellers', column: 'total_products', id: session.userId });

  revalidatePath('/seller/dashboard/products');
  revalidatePath('/seller/dashboard/verification');
  return { success: true, productId: product.id };
}

// ── Update Product ────────────────────────────────────────────────

export async function updateProduct(productId: string, state: unknown, formData: FormData) {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  // Check verification status
  const { data: seller } = await supabase.from('sellers').select('verification_status').eq('id', session.userId).single();
  if (seller?.verification_status !== 'approved') {
    return { message: 'Your account is not approved to update products.' };
  }

  const raw = Object.fromEntries(formData);
  const parsed = ProductSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { product_id, name, description, category, price, compare_price, quantity, specifications, image_url } = parsed.data;
  const imageUrls: string[] = image_url 
    ? image_url.split(/[\n,]+/).map(u => u.trim()).filter(u => u.length > 0)
    : [];

  let specs: Record<string, string> = {};
  try { specs = JSON.parse(specifications || '{}'); } catch {}

  const customProductId = product_id?.trim() || null;

  const { error } = await supabase.from('products').update({
    product_id: customProductId,
    name, 
    description, 
    category: category.toLowerCase(),
    price, 
    compare_price: compare_price || null, 
    quantity,
    specifications: specs,
    images: imageUrls,
    thumbnail: imageUrls[0] || null,
  }).eq('id', productId).eq('seller_id', session.userId);

  if (error) {
    if (error.message.includes('unique') || error.message.includes('duplicate key')) {
      return { message: 'The Product ID entered is already in use.' };
    }
    return { message: 'Failed to update product' };
  }

  revalidatePath('/seller/dashboard/products');
  return { success: true };
}

// ── Delete Product ────────────────────────────────────────────────

export async function deleteProduct(productId: string) {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  // First cleanly remove related child entities to avoid foreign key constraint errors
  await supabase.from('cart_items').delete().eq('product_id', productId);
  await supabase.from('wishlist_items').delete().eq('product_id', productId);
  await supabase.from('order_items').delete().eq('product_id', productId);
  await supabase.from('reviews').delete().eq('product_id', productId);
  await supabase.from('tracked_units').delete().eq('product_id', productId);
  await supabase.from('serialized_units').delete().eq('product_id', productId);
  await supabase.from('product_variants').delete().eq('product_id', productId);

  // Permanently remove the product from the database
  const { error } = await supabase.from('products').delete()
    .eq('id', productId).eq('seller_id', session.userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/seller/dashboard/products');
  return { success: true };
}

// ── Bulk Upload ───────────────────────────────────────────────────

export async function bulkUploadProducts(rows: {
  name: string; description: string; category: string;
  price: number; quantity: number; specifications?: Record<string, string>;
}[]) {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  // Check verification status
  const { data: seller } = await supabase.from('sellers').select('verification_status').eq('id', session.userId).single();
  if (seller?.verification_status !== 'approved') {
    return { success: false, error: 'Your account is pending approval.' };
  }

  const products = rows.map((r) => ({
    seller_id: session.userId,
    name: r.name,
    description: r.description,
    category: r.category.toLowerCase(),
    price: r.price,
    quantity: r.quantity,
    specifications: r.specifications || {},
  }));

  const { data: inserted, error } = await supabase.from('products').insert(products).select('id, quantity');
  if (error) return { success: false, error: error.message };

  // Generate serial units for each product
  const allUnits = (inserted ?? []).flatMap((p) =>
    Array.from({ length: p.quantity }, () => ({
      unit_code: generateSerialNumber(),
      product_id: p.id,
      seller_id: session.userId,
      status: 'in_stock' as const,
    }))
  );
  await supabase.from('serialized_units').insert(allUnits);

  revalidatePath('/seller/dashboard/products');
  return { success: true, count: inserted?.length ?? 0 };
}

// ── Update Order Status ───────────────────────────────────────────

export async function updateOrderItemStatus(
  orderItemId: string,
  status: string,
  unitCode?: string
) {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  const update: Record<string, string> = { item_status: status };
  if (unitCode) update.unit_code = unitCode;

  await supabase.from('order_items').update(update)
    .eq('id', orderItemId).eq('seller_id', session.userId);

  revalidatePath('/seller/dashboard/orders');
  return { success: true };
}

// ── Bulk Upload with JSON payload & Variants ──────────────────────

export async function bulkUploadProductsWithVariants(jsonString: string) {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  // Check verification status
  const { data: seller } = await supabase.from('sellers').select('verification_status').eq('id', session.userId).single();
  if (seller?.verification_status !== 'approved') {
    return { success: false, error: 'Your account is pending approval. You cannot upload products yet.' };
  }

  let items: BulkProductPayload[] = [];
  try {
    const parsedPayload = JSON.parse(jsonString) as BulkProductPayload | BulkProductPayload[];
    if (Array.isArray(parsedPayload)) {
      items = parsedPayload;
    } else {
      items = [parsedPayload];
    }
  } catch {
    return { success: false, error: 'Invalid JSON format provided.' };
  }

  if (items.length === 0) {
    return { success: false, error: 'Payload array is empty.' };
  }

  let totalInserted = 0;
  let totalVariants = 0;

  for (const item of items) {
    const customProductId = item.product_id?.trim() || null;
    const name = item.product_name || item.name || 'Untitled Product';
    const description = item.description || '';
    const category = (item.category || 'general').toLowerCase();

    // build specifications object
    const specs: Record<string, string> = { ...item.specifications };
    if (item.brand) {
      specs.Brand = String(item.brand);
    }

    // build images array
    const images: string[] = [];
    if (item.main_image) images.push(String(item.main_image));
    if (Array.isArray(item.gallery_images)) {
      item.gallery_images.forEach((img) => {
        if (img && typeof img === 'string') images.push(img);
      });
    }

    const thumbnail = images[0] || null;
    const variantsList: BulkVariantPayload[] = Array.isArray(item.variants) ? item.variants : [];
    const hasVariants = variantsList.length > 0;

    // determine product level price/stock
    let price = Number(item.price) || 0;
    let comparePrice: number | null = Number(item.mrp || item.compare_price) || null;
    let quantity = Number(item.stock_quantity || item.quantity) || 0;

    if (hasVariants) {
      price = Number(variantsList[0].price) || price;
      comparePrice = Number(variantsList[0].mrp || variantsList[0].compare_price) || comparePrice;
      quantity = variantsList.reduce((sum: number, v: BulkVariantPayload) => sum + (Number(v.stock_quantity || v.quantity) || 0), 0);
    }

    // Insert product
    const { data: product, error: pError } = await supabase.from('products').insert({
      seller_id: session.userId,
      product_id: customProductId,
      name,
      description,
      category,
      price,
      compare_price: comparePrice,
      images,
      thumbnail,
      specifications: specs,
      quantity,
      has_variants: hasVariants,
    }).select().single();

    if (pError) {
      const idLabel = customProductId || name;
      return { success: false, error: `Failed to insert product "${idLabel}": ${pError.message}` };
    }

    totalInserted++;

    // Generate variants if applicable
    if (hasVariants) {
      const variantsToInsert = variantsList.map((v: BulkVariantPayload) => {
        const vId = v.custom_variant_id || v.variant_id || null;
        const vPrice = Number(v.price) || price;
        const vCompare = Number(v.mrp || v.compare_price) || null;
        const vQty = Number(v.stock_quantity || v.quantity) || 0;
        const vSku = v.seller_sku || null;

        // collect attributes (any keys not reserved)
        const reservedKeys = new Set([
          'custom_variant_id', 'variant_id', 'price', 'mrp', 'compare_price', 
          'stock_quantity', 'quantity', 'seller_sku'
        ]);

        const attributes: Record<string, string> = {};
        for (const [k, val] of Object.entries(v)) {
          if (!reservedKeys.has(k) && val !== undefined && val !== null) {
            const formattedKey = k.charAt(0).toUpperCase() + k.slice(1);
            attributes[formattedKey] = String(val);
          }
        }

        return {
          product_id: product.id,
          variant_id: vId,
          seller_sku: vSku,
          attributes,
          price: vPrice,
          compare_price: vCompare,
          quantity: vQty,
          images: images,
          thumbnail: thumbnail,
        };
      });

      const { error: vError } = await supabase.from('product_variants').insert(variantsToInsert);
      if (vError) {
        return { success: false, error: `Failed to insert variants for "${name}": ${vError.message}` };
      }
      totalVariants += variantsToInsert.length;
    }

    // Generate serialized units for total quantity of this product
    if (quantity > 0) {
      const units = Array.from({ length: quantity }, () => ({
        unit_code: generateSerialNumber(),
        product_id: product.id,
        seller_id: session.userId,
        status: 'in_stock' as const,
      }));
      await supabase.from('serialized_units').insert(units);
    }

    // Increment seller product count per successful insert
    await supabase.rpc('increment', { table: 'sellers', column: 'total_products', id: session.userId });
  }

  revalidatePath('/seller/dashboard/products');
  return { success: true, count: totalInserted, variantCount: totalVariants };
}

// ── Delete Tracked Unit Passport Completely ────────────────────────
export async function deleteUnitPassport(unitCode: string) {
  const session = await requireRole('seller');
  const supabase = createAdminClient();

  // Verify ownership to enforce multi-tenant isolation
  const { data: unit } = await supabase
    .from('tracked_units')
    .select('seller_id')
    .eq('unique_unit_code', unitCode)
    .single();

  if (!unit || unit.seller_id !== session.userId) {
    return { success: false, error: 'Access denied or unit token unassigned.' };
  }

  // Decommission and permanently scrub unit and its dependent scan records
  await supabase.from('verification_logs').delete().eq('unit_code', unitCode);
  await supabase.from('ownership_history').delete().eq('unit_code', unitCode);
  const { error } = await supabase.from('tracked_units').delete().eq('unique_unit_code', unitCode);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/seller/dashboard/units');
  return { success: true };
}
