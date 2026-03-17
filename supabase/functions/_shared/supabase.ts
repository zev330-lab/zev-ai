import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Creates a Supabase client with service_role privileges.
 * Used by all TOLA Edge Functions for full database access.
 */
export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}
