import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const UpdatePricesButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      // Changed to the new regional function
      const { data, error } = await supabase.functions.invoke('update-regional-plans');

      if (error) throw error;

      toast.success(`Fiyatlar güncellendi! (${data.stats.success} başarılı, ${data.stats.failed} başarısız)`);
      console.log("Update details:", data);
    } catch (error) {
      console.error("Error updating prices:", error);
      toast.error("Fiyat güncelleme işlemi başarısız oldu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleUpdate} 
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {isLoading ? "Güncelleniyor..." : "Fiyatları Güncelle"}
    </Button>
  );
};
