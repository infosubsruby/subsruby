import { isSupabaseConfigured } from "@/lib/supabase/client";

export type DataMode = "mock" | "supabase";

const readModeOverride = (): DataMode | null => {
  const override = import.meta.env.VITE_DATA_MODE;
  if (override === "mock" || override === "supabase") {
    return override;
  }
  return null;
};

export const getDataMode = (): DataMode => {
  const override = readModeOverride();
  if (override === "mock") return "mock";
  if (override === "supabase" && isSupabaseConfigured()) return "supabase";
  return isSupabaseConfigured() ? "supabase" : "mock";
};

export const isMockMode = (): boolean => getDataMode() === "mock";

export const isSupabaseMode = (): boolean => getDataMode() === "supabase";

