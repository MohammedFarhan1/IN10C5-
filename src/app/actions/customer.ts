'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ── Cart ──────────────────────────────────────────────────────────

export async function addToCart(productId: string, quantity = 1) {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  const { error } = await supabase.from('cart_items').upsert(
    { user_id: session.userId, product_id: productId, quantity },
    { onConflict: 'user_id,product_id', ignoreDuplicates: false }
  );

  if (error) return { success: false, error: error.message };
  revalidatePath('/cart');
  return { success: true };
}

export async function updateCartItem(productId: string, quantity: number) {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  if (quantity <= 0) {
    await supabase.from('cart_items').delete()
      .eq('user_id', session.userId).eq('product_id', productId);
  } else {
    await supabase.from('cart_items').update({ quantity })
      .eq('user_id', session.userId).eq('product_id', productId);
  }

  revalidatePath('/cart');
  return { success: true };
}

export async function clearCart() {
  const session = await requireRole('customer');
  const supabase = createAdminClient();
  await supabase.from('cart_items').delete().eq('user_id', session.userId);
  revalidatePath('/cart');
  return { success: true };
}

// ── Wishlist ──────────────────────────────────────────────────────

export async function toggleWishlist(productId: string) {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  const { data: existing } = await supabase.from('wishlist_items')
    .select('id').eq('user_id', session.userId).eq('product_id', productId).single();

  if (existing) {
    await supabase.from('wishlist_items').delete()
      .eq('user_id', session.userId).eq('product_id', productId);
    revalidatePath('/account/wishlist');
    return { success: true, wishlisted: false };
  } else {
    await supabase.from('wishlist_items').insert({ user_id: session.userId, product_id: productId });
    revalidatePath('/account/wishlist');
    return { success: true, wishlisted: true };
  }
}

// ── Orders ────────────────────────────────────────────────────────

import { generateOrderNumber } from '@/lib/serial';

export async function placeOrder(formData: FormData) {
  const session = await requireRole('customer');
  const supabase = createAdminClient();
  const addressId = formData.get('addressId') as string;
  const notes = formData.get('notes') as string;

  // Get address
  const { data: address } = await supabase.from('addresses')
    .select('*').eq('id', addressId).eq('user_id', session.userId).single();
  if (!address) return { success: false, error: 'Address not found' };

  // Get cart
  const { data: cart } = await supabase.from('cart_items')
    .select('*, product:products(id, name, price, thumbnail, quantity, seller_id)')
    .eq('user_id', session.userId);
  if (!cart || cart.length === 0) return { success: false, error: 'Cart is empty' };

  // Calculate totals
  const subtotal = cart.reduce((s, i) => s + (i.product as { price: number }).price * i.quantity, 0);
  const total = subtotal; // shipping + discounts applied later

  // Create order
  const { data: order, error: orderError } = await supabase.from('orders').insert({
    order_number: generateOrderNumber(),
    user_id: session.userId,
    shipping_address: address,
    status: 'pending',
    payment_status: 'pending',
    subtotal,
    shipping_fee: 0,
    discount: 0,
    total,
    notes: notes || null,
  }).select().single();

  if (orderError || !order) return { success: false, error: 'Failed to create order' };

  // Create order items
  const items = cart.map((i) => ({
    order_id: order.id,
    product_id: (i.product as { id: string }).id,
    seller_id: (i.product as { seller_id: string }).seller_id,
    product_name: (i.product as { name: string }).name,
    product_image: (i.product as { thumbnail: string }).thumbnail,
    unit_price: (i.product as { price: number }).price,
    quantity: i.quantity,
    total: (i.product as { price: number }).price * i.quantity,
  }));

  await supabase.from('order_items').insert(items);

  // Decrement product quantities
  for (const i of cart) {
    await supabase.from('products').update({
      quantity: Math.max(0, (i.product as { quantity: number }).quantity - i.quantity),
      sold_count: (i.product as { sold_count?: number }).sold_count ?? 0 + i.quantity,
    }).eq('id', (i.product as { id: string }).id);
  }

  // Clear cart
  await supabase.from('cart_items').delete().eq('user_id', session.userId);

  revalidatePath('/account/orders');
  return { success: true, orderId: order.id, orderNumber: order.order_number };
}

export async function cancelOrder(orderId: string, reason: string) {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  const { data: order } = await supabase.from('orders')
    .select('status, user_id').eq('id', orderId).single();

  if (!order || order.user_id !== session.userId) return { success: false, error: 'Order not found' };
  if (!['pending', 'confirmed'].includes(order.status)) {
    return { success: false, error: 'This order cannot be cancelled at this stage' };
  }

  await supabase.from('orders').update({
    status: 'cancelled',
    cancel_reason: reason,
    cancelled_at: new Date().toISOString(),
  }).eq('id', orderId);

  revalidatePath('/account/orders');
  return { success: true };
}

export async function requestReturn(orderId: string, reason: string) {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  const { data: order } = await supabase.from('orders')
    .select('status, user_id').eq('id', orderId).single();

  if (!order || order.user_id !== session.userId) return { success: false, error: 'Order not found' };
  if (order.status !== 'delivered') {
    return { success: false, error: 'Only delivered orders can be returned' };
  }

  await supabase.from('orders').update({
    status: 'return_requested',
    cancel_reason: reason,
  }).eq('id', orderId);

  revalidatePath('/account/orders');
  return { success: true };
}

// ── Addresses ─────────────────────────────────────────────────────

export async function addAddress(formData: FormData) {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  const address = {
    user_id: session.userId,
    name: formData.get('name') as string,
    mobile: formData.get('mobile') as string,
    line1: formData.get('line1') as string,
    line2: (formData.get('line2') as string) || null,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    pincode: formData.get('pincode') as string,
    is_default: formData.get('is_default') === 'on',
  };

  if (address.is_default) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', session.userId);
  }

  const { data, error } = await supabase.from('addresses').insert(address).select().single();
  if (error) return { success: false, error: error.message };

  revalidatePath('/checkout');
  revalidatePath('/account');
  return { success: true, address: data };
}
