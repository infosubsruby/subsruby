import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BillingDayPicker } from "./BillingDayPicker";
import { CommunitySuggestionBadge } from "./CommunitySuggestionBadge";
import { supabase } from "@/integrations/supabase/client";
import { 
  subscriptionPresets, 
  currencies, 
  generateSlug,
  getPlansForPreset,
  getPlanPrice,
  formatPlanName,
  generateFallbackUrl,
  findPreset,
  type Currency,
  type SubscriptionPreset 
} from "@/data/subscriptionPresets";
import { useSubscriptions, type CreateSubscriptionData } from "@/hooks/useSubscriptions";
import { useCommunityData } from "@/hooks/useCommunityData";
import { calculateNextPaymentDate, calculateStartDate } from "@/lib/dateUtils";
import { getCurrencySymbol } from "@/lib/currency";
import { Search, ArrowLeft, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "select" | "configure";

export const AddSubscriptionModal = ({ open, onOpenChange }: AddSubscriptionModalProps) => {
  const { createSubscription, canAddSubscription } = useSubscriptions();
  const { communityData, isLoading: isCommunityLoading, fetchCommunityData, clearCommunityData } = useCommunityData();
  
  // Step management
  const [step, setStep] = useState<Step>("select");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [selectedPreset, setSelectedPreset] = useState<SubscriptionPreset | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [billingDay, setBillingDay] = useState(new Date().getDate());
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [cardColor, setCardColor] = useState("#E50914");
  const [isLoading, setIsLoading] = useState(false);

  // Smart Fill State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingPlans, setIsSearchingPlans] = useState(false);
  const isUserTypingRef = useRef(false);

  // Track which fields were auto-filled by community data
  const [priceSuggestedByCommunity, setPriceSuggestedByCommunity] = useState(false);
  const [urlSuggestedByCommunity, setUrlSuggestedByCommunity] = useState(false);

  // Featured services for the grid (first 10)
  const featuredServices = useMemo(() => {
    return subscriptionPresets.slice(0, 10);
  }, []);

  // Filtered services based on search
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return featuredServices;
    const query = searchQuery.toLowerCase();
    return subscriptionPresets.filter(
      (preset) =>
        preset.name.toLowerCase().includes(query) ||
        preset.category.toLowerCase().includes(query)
    );
  }, [searchQuery, featuredServices]);

  // Available plans for selected preset
  const availablePlans = useMemo(() => {
    if (!selectedPreset) return [];
    return getPlansForPreset(selectedPreset);
  }, [selectedPreset]);

  // Reset modal state when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("select");
        setSearchQuery("");
        setSelectedPreset(null);
        setIsCustom(false);
        setName("");
        setWebsiteUrl("");
        setPrice("");
        setCurrency("USD");
        setBillingCycle("monthly");
        setBillingDay(new Date().getDate());
        setBillingMonth(new Date().getMonth() + 1);
        setSelectedPlan("");
        setCardColor("#E50914");
        clearCommunityData();
        setPriceSuggestedByCommunity(false);
        setUrlSuggestedByCommunity(false);
        setSuggestions([]);
        setShowSuggestions(false);
        isUserTypingRef.current = false;
      }, 200);
    }
  }, [open, clearCommunityData]);

  // Plan Search Effect
  useEffect(() => {
    if (!isCustom || !name || name.length < 2 || !isUserTypingRef.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPlans(true);
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .ilike('name', `%${name}%`)
          .eq('currency', currency)
          .limit(5);
        
        if (data && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error("Error searching plans:", err);
      } finally {
        setIsSearchingPlans(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [name, isCustom, currency]);

  const handleSelectPlan = (plan: any) => {
    isUserTypingRef.current = false;
    setName(plan.name);
    setPrice(plan.price);
    if (currencies.some(c => c.value === plan.currency)) {
      setCurrency(plan.currency);
    }
    setShowSuggestions(false);
  };

  // Fetch community data when name or currency changes (for custom subscriptions)
  const handleFetchCommunityData = useCallback(async (serviceName: string, selectedCurrency: Currency) => {
    if (!serviceName.trim() || serviceName.length < 2) {
      clearCommunityData();
      return;
    }

    // Don't fetch if it's a known preset - use preset data instead
    const existingPreset = findPreset(serviceName);
    if (existingPreset) {
      clearCommunityData();
      return;
    }

    const data = await fetchCommunityData(serviceName, selectedCurrency);
    
    if (data) {
      // Auto-fill price if we have a suggestion and price is empty
      if (data.suggestedPrice !== null && price === "") {
        setPrice(data.suggestedPrice);
        setPriceSuggestedByCommunity(true);
      }
      
      // Auto-fill URL if we have a suggestion and URL is empty
      if (data.suggestedUrl && !websiteUrl) {
        setWebsiteUrl(data.suggestedUrl);
        setUrlSuggestedByCommunity(true);
      }
    }
  }, [fetchCommunityData, clearCommunityData, price, websiteUrl]);

  // Handle name blur event (for custom subscriptions)
  const handleNameBlur = useCallback(() => {
    if (isCustom && name.trim()) {
      handleFetchCommunityData(name, currency);
    }
  }, [isCustom, name, currency, handleFetchCommunityData]);

  // Handle currency change
  const handleCurrencyChange = useCallback((newCurrency: Currency) => {
    setCurrency(newCurrency);
    
    // Reset community suggestions when currency changes
    setPriceSuggestedByCommunity(false);
    
    // If custom subscription, fetch new community data for the new currency
    if (isCustom && name.trim()) {
      // Clear price if it was community suggested (to allow new suggestion)
      if (priceSuggestedByCommunity) {
        setPrice("");
      }
      handleFetchCommunityData(name, newCurrency);
    }
  }, [isCustom, name, priceSuggestedByCommunity, handleFetchCommunityData]);

  // Clear community suggestion flag when user manually edits
  const handlePriceChange = useCallback((value: string) => {
    setPrice(value ? Number(value) : "");
    setPriceSuggestedByCommunity(false);
  }, []);

  const handleUrlChange = useCallback((value: string) => {
    setWebsiteUrl(value);
    setUrlSuggestedByCommunity(false);
  }, []);

  // Handle service selection
  const handleSelectService = (preset: SubscriptionPreset) => {
    setSelectedPreset(preset);
    setIsCustom(false);
    setName(preset.name);
    setWebsiteUrl(preset.url);
    setCardColor(preset.color);
    setSelectedPlan(preset.defaultPlan);
    setPrice(getPlanPrice(preset, preset.defaultPlan, currency));
    clearCommunityData();
    setPriceSuggestedByCommunity(false);
    setUrlSuggestedByCommunity(false);
    setStep("configure");
  };

  // Handle custom subscription
  const handleCustomSubscription = () => {
    setSelectedPreset(null);
    setIsCustom(true);
    setName("");
    setWebsiteUrl("");
    setCardColor("#6366F1");
    setPrice("");
    setSelectedPlan("");
    clearCommunityData();
    setPriceSuggestedByCommunity(false);
    setUrlSuggestedByCommunity(false);
    setStep("configure");
  };

  // Update price when currency or plan changes for preset
  useEffect(() => {
    if (selectedPreset && selectedPlan) {
      setPrice(getPlanPrice(selectedPreset, selectedPlan, currency));
    }
  }, [currency, selectedPlan, selectedPreset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !price) return;
    if (!canAddSubscription()) return;

    setIsLoading(true);

    try {
      // Ensure we have a URL - generate fallback for custom subscriptions
      const finalUrl = websiteUrl || generateFallbackUrl(name);
      
      // Calculate dates based on billing day/month
      const startDate = calculateStartDate(billingDay, billingMonth, billingCycle);
      const nextPaymentDate = calculateNextPaymentDate(billingDay, billingMonth, billingCycle);

      const data: CreateSubscriptionData = {
        name,
        slug: generateSlug(name),
        price: Number(price),
        currency,
        billing_cycle: billingCycle,
        start_date: startDate,
        next_payment_date: nextPaymentDate,
        website_url: finalUrl,
        card_color: cardColor,
      };

      const result = await createSubscription(data);
      
      if (result.success) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to create subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currencySymbol = currencies.find((c) => c.value === currency)?.symbol || "$";
  const accentColor = selectedPreset?.color || cardColor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Dynamic Header with Service Color */}
        <DialogHeader 
          className="p-6 pb-4"
          style={{ 
            background: step === "configure" 
              ? `linear-gradient(135deg, ${accentColor}20, ${accentColor}05)` 
              : undefined 
          }}
        >
          <DialogTitle className="flex items-center gap-3 font-display text-xl">
            {step === "configure" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2"
                onClick={() => setStep("select")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {step === "select" ? (
              <>
                <Plus className="w-5 h-5 text-primary" />
                Add Subscription
              </>
            ) : (
              <>
                {selectedPreset && (
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: accentColor }}
                  >
                    <selectedPreset.icon className="w-4 h-4 text-white" />
                  </div>
                )}
                <span style={{ color: accentColor }}>{name || "Custom Subscription"}</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Add a new subscription to your dashboard.
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          <div className="p-6 pt-2 space-y-5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                className="pl-10 input-ruby"
              />
            </div>

            {/* Service Grid */}
            <div className="grid grid-cols-4 gap-3">
              {filteredServices.map((preset) => (
                <ServiceCard
                  key={preset.slug}
                  preset={preset}
                  onClick={() => handleSelectService(preset)}
                />
              ))}
              
              {/* Custom Subscription Card */}
              <button
                onClick={handleCustomSubscription}
                className="group flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all aspect-square"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center">
                  Custom
                </span>
              </button>
            </div>

            {filteredServices.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  No services found. Try a different search or add a custom subscription.
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-5">
            {/* Name (only editable for custom) */}
            {isCustom && (
              <div className="space-y-2 relative">
                <Label>Subscription Name</Label>
                <div className="relative">
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      isUserTypingRef.current = true;
                    }}
                    onBlur={() => {
                      // Small delay to allow click on suggestion
                      setTimeout(() => setShowSuggestions(false), 200);
                      handleNameBlur();
                    }}
                    placeholder="Enter service name"
                    className="input-ruby"
                    autoFocus
                    autoComplete="off"
                  />
                  {/* Suggestions Overlay */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden animate-in fade-in-0 zoom-in-95">
                      <div className="max-h-[200px] overflow-y-auto">
                        {suggestions.map((plan, index) => (
                          <button
                            key={index}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between"
                            onClick={() => handleSelectPlan(plan)}
                          >
                            <span className="font-medium">{plan.name}</span>
                            <span className="text-muted-foreground text-xs">
                              {getCurrencySymbol(plan.currency)}{plan.price}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {isCommunityLoading && !showSuggestions && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Searching community data...
                  </p>
                )}
              </div>
            )}

            {/* Plan Selector for presets */}
            {selectedPreset && availablePlans.length > 0 && (
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="input-ruby">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {availablePlans.map((plan) => {
                      const planPrice = getPlanPrice(selectedPreset, plan, currency);
                      return (
                        <SelectItem key={plan} value={plan}>
                          {formatPlanName(plan)} ({currencySymbol}{planPrice.toFixed(2)})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Price and Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Price</Label>
                  {priceSuggestedByCommunity && communityData && (
                    <CommunitySuggestionBadge matchCount={communityData.priceCount} />
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className={cn(
                      "pl-8 input-ruby",
                      priceSuggestedByCommunity && "ring-1 ring-primary/50"
                    )}
                    placeholder="0.00"
                    readOnly={!!selectedPreset && !!selectedPlan}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(v) => handleCurrencyChange(v as Currency)}>
                  <SelectTrigger className="input-ruby">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {currencies.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Billing Cycle - Radio Buttons */}
            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <RadioGroup 
                value={billingCycle} 
                onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="font-normal cursor-pointer">Monthly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yearly" id="yearly" />
                  <Label htmlFor="yearly" className="font-normal cursor-pointer">Yearly</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Billing Day/Month Picker */}
            <BillingDayPicker
              billingCycle={billingCycle}
              billingDay={billingDay}
              billingMonth={billingMonth}
              onBillingDayChange={setBillingDay}
              onBillingMonthChange={setBillingMonth}
            />

            {/* Management URL (only for custom) */}
            {isCustom && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Management URL (optional)</Label>
                  {urlSuggestedByCommunity && communityData && (
                    <CommunitySuggestionBadge matchCount={communityData.urlCount} />
                  )}
                </div>
                <Input
                  value={websiteUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://..."
                  className={cn(
                    "input-ruby",
                    urlSuggestedByCommunity && "ring-1 ring-primary/50"
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to auto-generate a search link
                </p>
              </div>
            )}

            {/* Color Picker (only for custom) */}
            {isCustom && (
              <div className="space-y-2">
                <Label>Card Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={cardColor}
                    onChange={(e) => setCardColor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border-2 border-border"
                  />
                  <Input
                    value={cardColor}
                    onChange={(e) => setCardColor(e.target.value)}
                    className="input-ruby flex-1"
                    placeholder="#6366F1"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full border-0 shadow-lg transition-all text-white"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
              }}
              disabled={isLoading || !name || !price}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                "Add Subscription"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Service Card Component
interface ServiceCardProps {
  preset: SubscriptionPreset;
  onClick: () => void;
}

const ServiceCard = ({ preset, onClick }: ServiceCardProps) => {
  const Icon = preset.icon;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center justify-center gap-2 p-4 rounded-xl",
        "border border-border hover:border-transparent",
        "transition-all duration-200 aspect-square",
        "hover:scale-105 hover:shadow-lg"
      )}
      style={{
        background: `linear-gradient(135deg, ${preset.color}15, ${preset.color}05)`,
      }}
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ backgroundColor: preset.color }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center line-clamp-1">
        {preset.name}
      </span>
    </button>
  );
};
