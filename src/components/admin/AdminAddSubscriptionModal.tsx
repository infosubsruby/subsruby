import { useState, useEffect } from "react";
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
  getPlanPrice,
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
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cardColor, setCardColor] = useState("#E50914");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreset, setIsPreset] = useState(false);

  // Auto-fill when name changes
  useEffect(() => {
    const preset = findPreset(name);
    if (preset) {
      setWebsiteUrl(preset.url);
      setCardColor(preset.color);
      // Use the default plan price
      setPrice(getPlanPrice(preset, preset.defaultPlan, currency).toString());
      setIsPreset(true);
    } else {
      setIsPreset(false);
    }
  }, [name]);

  // Update price when currency changes (for presets)
  useEffect(() => {
    const preset = findPreset(name);
    if (preset) {
      setPrice(getPlanPrice(preset, preset.defaultPlan, currency).toString());
    }
  }, [currency, name]);

  const calculateNextPayment = (): string => {
    const start = new Date(startDate);
    return format(
      billingCycle === "monthly" ? addMonths(start, 1) : addYears(start, 1),
      "yyyy-MM-dd"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEmail || !name || !price) {
      toast.error("Please fill in all required fields");
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
      price: parseFloat(price),
      currency,
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
    setPrice("");
    setCurrency("USD");
    setBillingCycle("monthly");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setCardColor("#E50914");
    setIsPreset(false);
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="9.99"
                className="input-ruby"
                disabled={isPreset}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
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
            disabled={isLoading || !name || !price || !userEmail}
          >
            {isLoading ? "Adding..." : "Add Subscription"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
