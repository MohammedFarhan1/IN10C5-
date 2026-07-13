import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin client using service role key.
 * ONLY import in Server Actions or API Routes — NEVER in client components.
 * Bypasses Row Level Security.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
