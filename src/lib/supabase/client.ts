import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let hasWarnedMissingConfig = false;

export const isSupabaseConfigured = (): boolean => Boolean(supabaseUrl && supabaseAnonKey);

export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  if (!isSupabaseConfigured()) {
    if (!hasWarnedMissingConfig && typeof window !== "undefined" && import.meta.env.DEV) {
      console.warn(
        "[Ruby] Supabase is not configured. Running in mock/demo mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Supabase mode."
      );
      hasWarnedMissingConfig = true;
    }
    return null;
  }
  return supabase;
};

export const hasSupabaseEnv = isSupabaseConfigured();
