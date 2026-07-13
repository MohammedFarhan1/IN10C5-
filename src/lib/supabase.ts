import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client (uses anon key + reads session cookie).
 * Import in Server Components, Server Actions, and Route Handlers.
 */
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
