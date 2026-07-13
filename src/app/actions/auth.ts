'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { createSession, deleteSession } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase-admin';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Schemas ───────────────────────────────────────────────────────

const CustomerSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  mobile: z.string().min(10, 'Enter a valid mobile number'),
  line1: z.string().min(5, 'Enter your address'),
  city: z.string().min(2, 'Enter your city'),
  state: z.string().min(2, 'Enter your state'),
  pincode: z.string().min(6, 'Enter a valid pincode'),
});

const SellerSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  business_name: z.string().min(2, 'Business name is required'),
  gst_number: z.string().optional(),
  contact_phone: z.string().min(10, 'Enter a valid phone number'),
  address: z.string().min(5, 'Enter your business address'),
  city: z.string().min(2, 'Enter your city'),
  state: z.string().min(2, 'Enter your state'),
  pincode: z.string().min(6, 'Enter a valid pincode'),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Action types ──────────────────────────────────────────────────

export type AuthState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

// ── Customer Signup ───────────────────────────────────────────────

export async function signupCustomer(
  state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = Object.fromEntries(formData);
  const parsed = CustomerSignupSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, mobile, line1, city, state: addrState, pincode } = parsed.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role: 'customer' },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
    },
  });

  if (error) {
    return { message: error.message };
  }

  if (!data.user) {
    return { message: 'Signup failed. Please try again.' };
  }

  // Update profile with additional info
  const admin = createAdminClient();
  await admin.from('profiles').update({ name, mobile }).eq('id', data.user.id);

  // Save default address
  await admin.from('addresses').insert({
    user_id: data.user.id,
    label: 'Home',
    name,
    mobile,
    line1,
    city,
    state: addrState,
    pincode,
    is_default: true,
  });

  redirect('/verify-email?email=' + encodeURIComponent(email));
}

// ── Seller Signup ─────────────────────────────────────────────────

export async function signupSeller(
  state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = Object.fromEntries(formData);
  const parsed = SellerSignupSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, business_name, gst_number, contact_phone, address, city, state: sellerState, pincode } = parsed.data;

  // Create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role: 'seller' },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
    },
  });

  if (error) return { message: error.message };
  if (!data.user) return { message: 'Signup failed. Please try again.' };

  const admin = createAdminClient();

  // Update profile role to seller
  await admin.from('profiles').update({ name, role: 'seller' }).eq('id', data.user.id);

  // Handle GST doc upload
  let gst_doc_url: string | null = null;
  const gstFile = formData.get('gst_doc') as File | null;
  if (gstFile && gstFile.size > 0) {
    const ext = gstFile.name.split('.').pop();
    const path = `${data.user.id}/gst.${ext}`;
    const { error: uploadError } = await admin.storage
      .from('gst-documents')
      .upload(path, gstFile, { upsert: true });
    if (!uploadError) {
      const { data: urlData } = admin.storage.from('gst-documents').getPublicUrl(path);
      gst_doc_url = urlData.publicUrl;
    }
  }

  // Create seller record
  await admin.from('sellers').insert({
    id: data.user.id,
    business_name,
    gst_number: gst_number || null,
    gst_doc_url,
    contact_email: email,
    contact_phone,
    address,
    city,
    state: sellerState,
    pincode,
    verification_status: 'pending',
  });

  redirect('/verify-email?email=' + encodeURIComponent(email));
}

// ── Login ─────────────────────────────────────────────────────────

export async function login(
  state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = Object.fromEntries(formData);
  const parsed = LoginSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { message: 'Invalid email or password.' };
  if (!data.user) return { message: 'Login failed. Please try again.' };

  // Fetch role from profiles
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role, name, banned')
    .eq('id', data.user.id)
    .single();

  if (!profile) return { message: 'Account not found.' };
  if (profile.banned) return { message: 'Your account has been suspended. Contact support.' };

  await createSession({
    userId: data.user.id,
    role: profile.role as 'customer' | 'seller' | 'admin',
    email: data.user.email!,
  });

  // Role-based redirect
  if (profile.role === 'admin') redirect('/admin');
  else if (profile.role === 'seller') redirect('/seller/dashboard');
  else redirect('/account');
}

// ── Logout ────────────────────────────────────────────────────────

export async function logout() {
  await supabase.auth.signOut();
  await deleteSession();
  redirect('/');
}

// ── Forgot Password ───────────────────────────────────────────────

export async function forgotPassword(
  state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string;
  if (!email) return { errors: { email: ['Email is required'] } };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) return { message: error.message };
  return { message: 'Password reset link sent to your email.' };
}
