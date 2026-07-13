'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(10, 'Enter a valid mobile number'),
});

const AddressSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  mobile: z.string().min(10, 'Mobile is required'),
  line1: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Pincode is required'),
  is_default: z.boolean().optional(),
});

export async function updateProfile(state: any, formData: FormData) {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  const raw = Object.fromEntries(formData);
  const parsed = ProfileSchema.safeParse(raw);

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { error } = await supabase.from('profiles').update({
    name: parsed.data.name,
    mobile: parsed.data.mobile,
  }).eq('id', session.userId);

  if (error) return { message: error.message };

  revalidatePath('/account');
  return { success: true };
}

export async function saveAddress(state: any, formData: FormData) {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  const raw = Object.fromEntries(formData);
  const isDefault = formData.get('is_default') === 'on';
  const parsed = AddressSchema.safeParse({ ...raw, is_default: isDefault });

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  if (isDefault) {
    // Unset other defaults
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', session.userId);
  }

  const { error } = await supabase.from('addresses').insert({
    user_id: session.userId,
    ...parsed.data,
  });

  if (error) return { message: error.message };

  revalidatePath('/account/addresses');
  return { success: true };
}

export async function deleteAddress(addressId: string) {
  const session = await requireRole('customer');
  const supabase = createAdminClient();

  await supabase.from('addresses').delete().eq('id', addressId).eq('user_id', session.userId);
  revalidatePath('/account/addresses');
}
