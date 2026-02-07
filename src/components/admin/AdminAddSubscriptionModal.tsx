import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  subscriptionPresets,
  currencies,
  findPreset,
  generateSlug,
  Currency,
} from "@/data/subscriptionPresets";
import { Calendar, Link2, Palette, Mail, CreditCard } from "lucide-react";
import { format, addMonths, addYears } from "date-fns";

interface AdminAddSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AdminAddSubscriptionModal = ({
  open,
  onOpenChange,
  onSuccess,
}: AdminAddSubscriptionModalProps) => {
  const [userEmail, setUserEmail] = useState("");
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  
  // Plan & Price State
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [customPrice, setCustomPrice] = useState("");
  const [customCurrency, setCustomCurrency] = useState<Currency>("USD");
  
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cardColor, setCardColor] = useState("#E50914");
  const [isLoading, setIsLoading] = useState(false);

  // Derived state
  const selectedPlan = useMemo(() => 
    plans.find(p => p.id.toString() === selectedPlanId), 
  [plans, selectedPlanId]);

  // Price logic: If plans exist, price comes from plan (or 0 if none selected).
  // If no plans (custom), price comes from customPrice.
  const activePrice = useMemo(() => {
    if (plans.length > 0) {
      return selectedPlan ? selectedPlan.price : 0;
    }
    return customPrice;
  }, [plans.length, selectedPlan, customPrice]);

  // Currency logic: Similar to price
  const activeCurrency = useMemo(() => {
    if (plans.length > 0) {
      return selectedPlan ? (selectedPlan.currency as Currency) : "USD";
    }
    return customCurrency;
  }, [plans.length, selectedPlan, customCurrency]);

  // Auto-fill URL/Color when name changes
  useEffect(() => {
    const preset = findPreset(name);
    if (preset) {
      setWebsiteUrl(preset.url);
      setCardColor(preset.color);
    }
  }, [name]);

  // Fetch plans from DB
  useEffect(() => {
    const fetchPlans = async () => {
      if (!name) {
        setPlans([]);
        return;
      }

      // Only fetch if it matches a known preset (optional, but good for performance)
      // or just fetch for any name to support dynamic adding in future
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('id, plan_name, price, currency')
          .eq('service_name', name)
          .eq('currency', customCurrency);

        if (error) throw error;

        if (data) {
           setPlans(data);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      }
    };

    fetchPlans();
  }, [name, customCurrency]);

  // Handle currency change
  const handleCurrencyChange = (newCurrency: Currency) => {
    setSelectedPlanId(""); // Reset plan when currency changes
    setCustomCurrency(newCurrency);
  };

  const calculateNextPayment = (): string => {
    const start = new Date(startDate);
    return format(
      billingCycle === "monthly" ? addMonths(start, 1) : addYears(start, 1),
      "yyyy-MM-dd"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEmail || !name || !activePrice) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (plans.length > 0 && !selectedPlanId) {
       toast.error("Please select a plan");
       return;
    }

    setIsLoading(true);

    // Find user by email (admin function would be better, but we'll query profiles)
    // In a real app, you'd have an edge function that looks up users by email
    const { data: authData, error: authError } = await supabase.auth.admin?.listUsers?.() || {};
    
    // For now, we'll try to find the user through their subscriptions or a workaround
    // This is a simplified approach - in production, use an edge function
    
    // Let's search for an existing subscription with this pattern
    // Better approach: create an edge function that can look up users by email
    
    toast.error("Admin user lookup requires an edge function. Please implement one.");
    setIsLoading(false);
    
    // Placeholder for when edge function is ready:
    /*
    const { data, error } = await supabase.from("subscriptions").insert({
      user_id: foundUserId,
      name,
      slug: generateSlug(name),
      price: parseFloat(activePrice),
      currency: activeCurrency,
      billing_cycle: billingCycle,
      start_date: startDate,
      next_payment_date: calculateNextPayment(),
      website_url: websiteUrl || null,
      card_color: cardColor,
    });

    if (error) {
      toast.error("Failed to add subscription");
      console.error(error);
    } else {
      toast.success(`Subscription added for ${userEmail}`);
      onSuccess();
      onOpenChange(false);
      resetForm();
    }
    */
  };

  const resetForm = () => {
    setUserEmail("");
    setName("");
    setWebsiteUrl("");
    setPlans([]);
    setSelectedPlanId("");
    setCustomPrice("");
    setCustomCurrency("USD");
    setBillingCycle("monthly");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setCardColor("#E50914");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Add Subscription for User
          </DialogTitle>
          <DialogDescription>
            Create a subscription for any registered user by their email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Email */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              User Email *
            </Label>
            <Input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="user@example.com"
              className="input-ruby"
              required
            />
          </div>

          {/* Subscription Name */}
          <div className="space-y-2">
            <Label>Subscription Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Netflix, Spotify"
              className="input-ruby"
              list="presets"
              required
            />
            <datalist id="presets">
              {subscriptionPresets.map((preset) => (
                <option key={preset.slug} value={preset.name} />
              ))}
            </datalist>
          </div>

          {/* Plan Selection */}
          {plans.length > 0 && (
            <div className="space-y-2">
              <Label>Plan <span className="text-red-500">*</span></Label>
              <Select 
                value={selectedPlanId} 
                onValueChange={(val) => setSelectedPlanId(val)}
              >
                <SelectTrigger className={!selectedPlanId ? "border-red-300 input-ruby" : "input-ruby"}>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.plan_name} ({getCurrencySymbol(p.currency)}{p.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedPlanId && (
                <p className="text-xs text-red-500">Please select a plan to continue</p>
              )}
            </div>
          )}

          {/* Website URL */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-muted-foreground" />
              Website URL
            </Label>
            <Input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://..."
              className="input-ruby"
            />
          </div>

          {/* Price and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={activePrice === 0 ? "" : activePrice}
                onChange={(e) => {
                  if (plans.length === 0) {
                    setCustomPrice(e.target.value);
                  }
                }}
                placeholder="9.99"
                className={plans.length > 0 ? "input-ruby bg-muted cursor-not-allowed" : "input-ruby"}
                disabled={plans.length > 0}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select 
                value={activeCurrency} 
                onValueChange={(v) => {
                  if (plans.length === 0) {
                    handleCurrencyChange(v as Currency);
                  }
                }}
                disabled={plans.length > 0}
              >
                <SelectTrigger className="input-ruby">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Billing Cycle */}
          <div className="space-y-2">
            <Label>Billing Cycle</Label>
            <Select
              value={billingCycle}
              onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}
            >
              <SelectTrigger className="input-ruby">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Start Date
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-ruby"
            />
          </div>

          {/* Card Color */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              Card Color
            </Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={cardColor}
                onChange={(e) => setCardColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={cardColor}
                onChange={(e) => setCardColor(e.target.value)}
                className="input-ruby flex-1"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong transition-all"
            disabled={isLoading || !name || !activePrice || !userEmail}
          >
            {isLoading ? "Adding..." : "Add Subscription"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
