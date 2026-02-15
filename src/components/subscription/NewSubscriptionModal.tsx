import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { getCurrencySymbol } from "@/lib/currency";

type Service = {
  id: number;
  name: string;
  slug: string | null;
  logo_url: string | null;
  color: string | null;
  category: string | null;
};

type Plan = {
  id: number;
  service_id: number | null;
  plan_name: string;
  currency: string;
  price: number;
  billing_cycle: "monthly" | "yearly" | null;
};

interface NewSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewSubscriptionModal = ({ open, onOpenChange }: NewSubscriptionModalProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [price, setPrice] = useState<number | "">("");

  useEffect(() => {
    if (!open) return;
    const loadServices = async () => {
      setServicesLoading(true);
      const { data, error } = await supabase.from("services").select("*");
      if (!error) setServices(data as Service[]);
      setServicesLoading(false);
    };
    loadServices();
  }, [open]);

  useEffect(() => {
    if (!selectedService) return;
    const loadPlans = async () => {
      setPlansLoading(true);
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id, service_id, plan_name, currency, price, billing_cycle")
        .eq("service_id", selectedService.id);
      if (!error) setPlans((data || []) as Plan[]);
      setPlansLoading(false);
    };
    loadPlans();
  }, [selectedService]);

  const availableCurrencies = useMemo(() => {
    const set = new Set(plans.map(p => p.currency).filter(Boolean));
    return Array.from(set);
  }, [plans]);

  const filteredPlans = useMemo(() => {
    return plans.filter(
      p =>
        (!!selectedCurrency ? p.currency === selectedCurrency : true) &&
        (!!billingCycle ? p.billing_cycle === billingCycle : true)
    );
  }, [plans, selectedCurrency, billingCycle]);

  useEffect(() => {
    if (!customMode) {
      setPrice(selectedPlan ? selectedPlan.price : "");
    }
  }, [selectedPlan, customMode]);

  const handleSelectService = (svc: Service) => {
    setSelectedService(svc);
    setSelectedCurrency("");
    setBillingCycle("monthly");
    setSelectedPlan(null);
    setCustomMode(false);
    setPrice("");
  };

  const handleSave = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-3 font-display text-xl">
            Yeni Abonelik
          </DialogTitle>
          <DialogDescription className="sr-only">Yeni abonelik ekleme akışı</DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-5">
          {!selectedService ? (
            <div className="space-y-3">
              <Label>Servis Seç</Label>
              {servicesLoading ? (
                <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/50">Yükleniyor…</div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {services.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => handleSelectService(svc)}
                      className="group flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 transition-all aspect-square"
                      title={svc.name}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: svc.color || "#222" }}>
                        {svc.logo_url ? (
                          <img src={svc.logo_url} alt={svc.name} className="w-5 h-5 object-contain" />
                        ) : (
                          <span className="text-xs text-muted-foreground">{svc.name[0]}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center line-clamp-1">
                        {svc.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label>Region & Currency</Label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger className="input-ruby">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-[300px]">
                    {availableCurrencies.map((cur) => (
                      <SelectItem key={cur} value={cur}>
                        {cur}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
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

              <div className="space-y-1.5">
                <Label>Plan</Label>
                {plansLoading ? (
                  <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/50">Yükleniyor…</div>
                ) : (
                  <Select
                    value={selectedPlan?.id?.toString() || ""}
                    onValueChange={(val) => {
                      const plan = filteredPlans.find(p => p.id.toString() === val) || null;
                      setSelectedPlan(plan);
                    }}
                  >
                    <SelectTrigger className={!selectedPlan ? "border-red-300" : ""}>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPlans.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.plan_name} ({getCurrencySymbol(p.currency)}{p.price})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Price</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomMode(!customMode)}
                  >
                    {customMode ? "Use Plan Price" : "Custom Mode"}
                  </Button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {getCurrencySymbol(selectedPlan?.currency || selectedCurrency || "USD")}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={customMode ? price : selectedPlan?.price ?? ""}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                    className="pl-8 input-ruby"
                    placeholder="0.00"
                    readOnly={!customMode}
                  />
                </div>
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={!selectedService || !selectedPlan}
                onClick={handleSave}
              >
                Kaydet
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
