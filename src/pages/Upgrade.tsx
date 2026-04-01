import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function Upgrade() {
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in first.");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: user.id,
          plan: billingCycle,
        }),
      });

      const data = await response.json();
      const checkoutUrl = data?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error("Checkout URL not returned");
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error(error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-card border border-border p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Upgrade to Pro</h1>
        <p className="text-muted-foreground mb-6">
          Unlock unlimited tracking, smart insights, and full financial control.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`py-2 rounded-lg border border-border text-sm font-medium transition ${
              billingCycle === "monthly"
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`py-2 rounded-lg border border-border text-sm font-medium transition ${
              billingCycle === "yearly"
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            Yearly
          </button>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Continue to Checkout"}
        </button>
      </div>
    </div>
  );
}
