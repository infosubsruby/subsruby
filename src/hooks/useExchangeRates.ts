import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExchangeRate {
  currency_code: string;
  rate: number;
  last_updated: string;
}

export const useExchangeRates = () => {
  return useQuery({
    queryKey: ["exchangeRates"],
    queryFn: async () => {
      // 1. Try to invoke the Edge Function
      const { data, error } = await supabase.functions.invoke("get-exchange-rates");
      
      if (error) {
        console.error("Edge Function fetch error:", error);
        // Fallback: Try to fetch from table directly if function fails (or is not deployed)
        const { data: tableData, error: tableError } = await supabase
          .from("exchange_rates")
          .select("*");
          
        if (tableError) throw tableError;
        return tableData as ExchangeRate[];
      }
      
      return data as ExchangeRate[];
    },
    // Cache for 1 hour locally, as the backend caches for 6 hours
    staleTime: 1000 * 60 * 60, 
  });
};
