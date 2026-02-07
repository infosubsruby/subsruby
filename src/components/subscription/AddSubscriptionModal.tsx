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
  defaultService?: string;
}

type Step = "select" | "configure";

export const AddSubscriptionModal = ({ open, onOpenChange, defaultService }: AddSubscriptionModalProps) => {
  const { createSubscription, canAddSubscription, subscriptions } = useSubscriptions();
  const { communityData } = useCommunityData();
  
  // Step management
  const [step, setStep] = useState<Step>("select");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Recommended services state (separated from form selection)
  const [recommendedServices, setRecommendedServices] = useState<SubscriptionPreset[]>([]);

  // Derive recommended services from allServices - userSubscriptions
  useEffect(() => {
    if (open) {
      const subscribedNames = new Set((subscriptions || []).map(s => s.name.toLowerCase()));
      const derived = subscriptionPresets.filter(p => !subscribedNames.has(p.name.toLowerCase()));
      setRecommendedServices(derived);
    }
  }, [open, subscriptions]);

  // Form state
  const [selectedPreset, setSelectedPreset] = useState<SubscriptionPreset | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [billingDay, setBillingDay] = useState(new Date().getDate());
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1);
  const [cardColor, setCardColor] = useState("#E50914");
  const [isLoading, setIsLoading] = useState(false);

  // --- NEW ARCHITECTURE STATE ---
  const [serviceName, setServiceName] = useState<string>(""); // Used to fetch plans
  const [plans, setPlans] = useState<any[]>([]); // Fetched plans
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  
  // Custom price/currency (used when no plan is selected or for custom subscriptions)
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("USD");

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

  // Currency logic: simplified to use single source of truth
  const activeCurrency = selectedCurrency;

  // Track which fields were auto-filled by community data (kept for UI compatibility)
  const [priceSuggestedByCommunity, setPriceSuggestedByCommunity] = useState(false);
  const [urlSuggestedByCommunity, setUrlSuggestedByCommunity] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isUserTypingRef = useRef(false);

  // Filtered services based on search
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return recommendedServices;
    const query = searchQuery.toLowerCase();
    return recommendedServices.filter(
      (preset) =>
        preset.name.toLowerCase().includes(query) ||
        preset.category.toLowerCase().includes(query)
    );
  }, [searchQuery, recommendedServices]);

  const resetForm = () => {
    setSelectedPreset(null);
    setIsCustom(false);
    setName("");
    setWebsiteUrl("");
    setCardColor("#E50914");
    setBillingCycle("monthly");
    setBillingDay(new Date().getDate());
    setBillingMonth(new Date().getMonth() + 1);
    
    setServiceName("");
    setPlans([]);
    setSelectedPlanId("");
    setCustomPrice("");
    setSelectedCurrency("USD");
    
    setStep("select");
    setSearchQuery("");
  };


  // Fetch plans from DB when serviceName or selectedCurrency changes
  useEffect(() => {
    const fetchPlans = async () => {
      if (!serviceName) {
        setPlans([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('id, plan_name, price, currency')
          .eq('service_name', serviceName)
          .eq('currency', selectedCurrency.toUpperCase()); // Normalize currency

        if (error) throw error;

        if (data) {
           setPlans(data);
        }
      } catch (error) {
        console.error('Error fetching plans from DB:', error);
      }
    };

    fetchPlans();
  }, [serviceName, selectedCurrency]);

  // Handle currency change
  const handleCurrencyChange = useCallback((newCurrency: Currency) => {
    setSelectedPlanId(""); // Reset plan selection
    setCustomPrice(""); // Reset custom price
    setSelectedCurrency(newCurrency); // Update currency to trigger re-fetch
  }, []);

  const handleUrlChange = useCallback((value: string) => {
    setWebsiteUrl(value);
  }, []);

  // Handle service selection
  const handleSelectService = (preset: SubscriptionPreset) => {
    setSelectedPreset(preset);
    setIsCustom(false);
    setName(preset.name);
    setWebsiteUrl(preset.url);
    setCardColor(preset.color);
    
    // Set service name for fetching plans
    setServiceName(preset.name);
    
    // Reset selection
    setSelectedPlanId("");
    setCustomPrice("");
    setCustomCurrency("USD"); // Or default for that service?
    
    setStep("configure");
  };

  // Handle custom subscription
  const handleCustomSubscription = () => {
    setSelectedPreset(null);
    setIsCustom(true);
    setName("");
    setWebsiteUrl("");
    setCardColor("#6366F1");
    
    setServiceName(""); // No service name for custom
    setPlans([]);
    setSelectedPlanId("");
    setCustomPrice("");
    
    setStep("configure");
  };

  // Initialize with defaultService if provided
  useEffect(() => {
    if (open && defaultService) {
      const preset = findPreset(defaultService);
      if (preset) {
        handleSelectService(preset);
      } else {
        // Treat as custom with pre-filled name
        setSelectedPreset(null);
        setIsCustom(false);
        setName(defaultService);
        setWebsiteUrl(generateFallbackUrl(defaultService));
        setCardColor("#E50914");
        setServiceName("");
        setStep("configure");
      }
    }
  }, [open, defaultService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !activePrice) return;
    if (!canAddSubscription()) return;

    setIsLoading(true);

    try {
      const finalUrl = websiteUrl || generateFallbackUrl(name);
      const startDate = calculateStartDate(billingDay, billingMonth, billingCycle);
      const nextPaymentDate = calculateNextPaymentDate(billingDay, billingMonth, billingCycle);

      const data: CreateSubscriptionData = {
        name,
        slug: generateSlug(name),
        price: Number(activePrice),
        currency: activeCurrency,
        billing_cycle: billingCycle,
        start_date: startDate,
        next_payment_date: nextPaymentDate,
        website_url: finalUrl,
        card_color: cardColor,
      };

      const result = await createSubscription(data);
      
      if (result.success) {
        resetForm();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to create subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const currencySymbol = currencies.find((c) => c.value === activeCurrency)?.symbol || "$";
  const accentColor = selectedPreset?.color || cardColor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                className="pl-10 input-ruby"
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              {filteredServices.map((preset) => (
                <ServiceCard
                  key={preset.slug}
                  preset={preset}
                  onClick={() => handleSelectService(preset)}
                />
              ))}
              
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
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Enter service name"
                  className="input-ruby"
                  autoFocus={isCustom}
                  autoComplete="off"
                  readOnly={!isCustom}
                />
              </div>
            </div>

            {(!isCustom && serviceName) && (
              <div className="space-y-2">
                <Label>Plan <span className="text-red-500">*</span></Label>
                {plans.length > 0 ? (
                  <>
                    <Select 
                      value={selectedPlanId} 
                      onValueChange={(val) => setSelectedPlanId(val)}
                    >
                      <SelectTrigger className={!selectedPlanId ? "border-red-300" : ""}>
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
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/50 flex flex-col gap-2">
                    <p>No plans found for this currency.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCustomSubscription}
                      className="w-full"
                    >
                      Switch to Custom Mode
                    </Button>
                  </div>
                )}
              </div>
            )}

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
                    value={activePrice === 0 ? "" : activePrice}
                    onChange={(e) => {
                      if (plans.length === 0 && isCustom) {
                        setCustomPrice(e.target.value);
                      }
                    }}
                    className={cn(
                      "pl-8 input-ruby",
                      priceSuggestedByCommunity && "ring-1 ring-primary/50",
                      (plans.length > 0 || (!isCustom && !!serviceName)) && "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                    placeholder="0.00"
                    readOnly={plans.length > 0 || (!isCustom && !!serviceName)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select 
                  value={selectedCurrency} 
                  onValueChange={(v) => {
                    handleCurrencyChange(v as Currency);
                  }}
                >
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

            <BillingDayPicker
              billingCycle={billingCycle}
              billingDay={billingDay}
              billingMonth={billingMonth}
              onBillingDayChange={setBillingDay}
              onBillingMonthChange={setBillingMonth}
            />

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

            <Button 
              type="submit" 
              className="w-full border-0 shadow-lg transition-all text-white"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
              }}
              disabled={isLoading || !name || !activePrice}
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
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ backgroundColor: preset.color }}
      >
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center line-clamp-1">
        {preset.name}
      </span>
    </button>
  );
};
