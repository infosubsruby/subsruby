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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Upgrade to Pro</h1>
        <p className="text-gray-500 mb-6">
          Unlock unlimited tracking, smart insights, and full financial control.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`py-2 rounded-lg border text-sm font-medium transition ${
              billingCycle === "monthly"
                ? "border-black bg-black text-white"
                : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`py-2 rounded-lg border text-sm font-medium transition ${
              billingCycle === "yearly"
                ? "border-black bg-black text-white"
                : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            Yearly
          </button>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Continue to Checkout"}
        </button>
      </div>
    </div>
  );
}
