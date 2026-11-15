/**
 * SAM Portfolio configuration
 * Leave these blank for LOCAL PREVIEW MODE (browser-only storage).
 * To publish with real admin/inquiries, connect Supabase using README.md.
 * Supabase anon/publishable key is safe for the browser ONLY with correct RLS.
 * Never place service_role keys here.
 */
export const CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};

export const connected = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
