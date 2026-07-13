'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ── User Management ───────────────────────────────────────────────

export async function banUser(userId: string, banned: boolean) {
  await requireRole('admin');
  const supabase = createAdminClient();
  await supabase.from('profiles').update({ banned }).eq('id', userId);
  revalidatePath('/admin/users');
  return { success: true };
}

export async function resetUserAccount(userId: string) {
  await requireRole('admin');
  const supabase = createAdminClient();

  const { data: user } = await supabase.auth.admin.getUserById(userId);
  if (!user.user?.email) return { success: false, error: 'User not found' };

  await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: user.user.email,
  });

  return { success: true };
}

export async function deleteUserAccount(userId: string) {
  await requireRole('admin');
  const supabase = createAdminClient();

  // Deletes the user from Supabase auth.users completely.
  // Note: This requires ON DELETE CASCADE on the database foreign keys
  // (like profiles, products, cart_items, etc) to fully wipe the user data.
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'seller' | 'admin';
}) {
  await requireRole('admin');
  const supabase = createAdminClient();

  const { data: authData, error } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { name: data.name, role: data.role },
  });

  if (error) return { success: false, error: error.message };

  await supabase.from('profiles').upsert({
    id: authData.user.id,
    name: data.name,
    role: data.role,
  });

  revalidatePath('/admin/users');
  return { success: true };
}

// ── Seller Verification ───────────────────────────────────────────

export async function verifySeller(sellerId: string) {
  await requireRole('admin');
  const supabase = createAdminClient();

  await supabase.from('sellers').update({
    verification_status: 'approved',
    verified_at: new Date().toISOString(),
    rejection_reason: null,
  }).eq('id', sellerId);

  // Update profile role to seller (in case it wasn't set)
  await supabase.from('profiles').update({ role: 'seller' }).eq('id', sellerId);

  revalidatePath('/admin/sellers');
  return { success: true };
}

export async function rejectSeller(sellerId: string, reason: string) {
  await requireRole('admin');
  const supabase = createAdminClient();

  await supabase.from('sellers').update({
    verification_status: 'rejected',
    rejection_reason: reason,
  }).eq('id', sellerId);

  revalidatePath('/admin/sellers');
  return { success: true };
}

export async function suspendSeller(sellerId: string) {
  await requireRole('admin');
  const supabase = createAdminClient();

  await supabase.from('sellers').update({
    verification_status: 'suspended',
  }).eq('id', sellerId);

  revalidatePath('/admin/sellers');
  return { success: true };
}

// ── Product Moderation ────────────────────────────────────────────

export async function flagProduct(productId: string, active: boolean) {
  await requireRole('admin');
  const supabase = createAdminClient();
  await supabase.from('products').update({ is_active: active }).eq('id', productId);
  revalidatePath('/admin/products');
  return { success: true };
}

// ── Fraud Reports ─────────────────────────────────────────────────

export async function resolveReport(reportId: string, status: 'resolved' | 'dismissed') {
  const session = await requireRole('admin');
  const supabase = createAdminClient();

  await supabase.from('fraud_reports').update({
    status,
    resolved_by: session.userId,
    resolved_at: new Date().toISOString(),
  }).eq('id', reportId);

  revalidatePath('/admin/fraud');
  return { success: true };
}
