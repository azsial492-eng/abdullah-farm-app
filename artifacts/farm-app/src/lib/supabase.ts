import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Always create a client — use placeholder values when env vars are absent
// so the app loads without crashing. The context guards all DB calls with
// `isConfigured` so the placeholder client is never actually called.
export const supabase = createClient(
  isConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  isConfigured ? supabaseAnonKey : "placeholder-anon-key",
);
