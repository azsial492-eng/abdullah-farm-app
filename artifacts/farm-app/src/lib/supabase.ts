import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isHttpUrl = (value?: string) => /^https?:\/\//i.test(value ?? "");

export const isConfigured = Boolean(rawUrl && rawKey && isHttpUrl(rawUrl));

export const supabase: SupabaseClient | null = isConfigured && rawUrl && rawKey
  ? createClient(rawUrl, rawKey)
  : null;
