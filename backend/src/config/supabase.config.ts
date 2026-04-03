import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client using the anon key.
 * Used for server-side JWT verification (auth.getUser) and
 * operations that should respect RLS policies.
 */
export function createSupabaseClient(
  config: ConfigService,
): SupabaseClient {
  const url = config.getOrThrow<string>('SUPABASE_URL');
  const anonKey = config.getOrThrow<string>('SUPABASE_ANON_KEY');

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Creates a Supabase admin client using the service role key.
 * Bypasses RLS — use only for trusted backend operations
 * (e.g. creating users, syncing profiles, admin actions).
 */
export function createSupabaseAdmin(
  config: ConfigService,
): SupabaseClient {
  const url = config.getOrThrow<string>('SUPABASE_URL');
  const serviceRoleKey = config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
