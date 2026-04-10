import { useState } from "react";
import { Subscription, CreateSubscriptionData } from "@/hooks/useSubscriptions";
import { CountdownTimer } from "./CountdownTimer";
import { subscriptionPresets, currencies, generateSlug, generateFallbackUrl } from "@/data/subscriptionPresets";
import { CreditCard, ExternalLink, Edit, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { convertWithDynamicRates, getCurrencySymbol } from "@/lib/currency";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "@/i18n/useTranslations";
import { formatDate } from "@/i18n/date";

interface FlipCardProps {
  subscription: Subscription;
  onUpdate: (id: number, payload: Partial<CreateSubscriptionData>) => Promise<{ success: boolean }>;
  onDelete: (id: number) => Promise<{ success: boolean }>;
}

export const FlipCard = ({ subscription, onUpdate, onDelete }: FlipCardProps) => {
  const t = useTranslations("Dashboard");
  const tProfile = useTranslations("Profile");
  const tSubscriptions = useTranslations("Subscriptions");
  const tModals = useTranslations("Modals");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(subscription.name);
  const [editPrice, setEditPrice] = useState<number | "">(subscription.price);
  const [editCurrency, setEditCurrency] = useState(subscription.currency);
  const [editBillingCycle, setEditBillingCycle] = useState<"monthly" | "yearly">(
    (subscription.billing_cycle as "monthly" | "yearly") || "monthly"
  );

  // Find preset icon
  const preset = subscriptionPresets.find(
    (p) => p.slug === subscription.slug || p.name.toLowerCase() === subscription.name.toLowerCase()
  );
  const IconComponent = preset?.icon || CreditCard;
  
  const symbol = getCurrencySymbol(subscription.currency);

  // Get the management URL - use stored URL, preset URL, or generate fallback
  const getManageUrl = (): string => {
    if (subscription.website_url) return subscription.website_url;
    if (preset?.url) return preset.url;
    return generateFallbackUrl(subscription.name);
  };

  const handleFlip = () => {
    if (!isEditing) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(subscription.name);
    setEditPrice(subscription.price);
    setEditCurrency(subscription.currency);
    setEditBillingCycle((subscription.billing_cycle as "monthly" | "yearly") || "monthly");
    setIsEditing(true);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    
    const updates: Partial<CreateSubscriptionData> = {
      name: editName,
      slug: generateSlug(editName),
      price: Number(editPrice),
      currency: editCurrency,
      billing_cycle: editBillingCycle,
    };

    const result = await onUpdate(subscription.id, updates);
    if (result.success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(subscription.id);
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getManageUrl();
    window.open(url, "_blank");
  };

  const handleToggleUnused = async (checked: boolean) => {
    if (isToggling) return;
    setIsToggling(true);
    const result = await onUpdate(subscription.id, { is_marked_unused: checked });
    setIsToggling(false);
    if (!result.success) {
      return;
    }
  };

  return (
    <>
      <div className="sm:hidden">
        <div
          className="glass-card rounded-xl p-3 border overflow-hidden"
          style={{ borderColor: `${subscription.card_color}20` }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: subscription.card_color }}
              >
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{subscription.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <div className="inline-flex scale-[0.75] origin-left">
                    <CountdownTimer targetDate={subscription.next_payment_date} />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="font-display font-bold text-sm">
                {symbol}{subscription.price.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {t("per_month")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="hidden sm:block flip-card-container h-[280px] cursor-pointer perspective-1000"
        onClick={handleFlip}
        style={{ perspective: "1000px" }}
      >
        <div
          className={cn(
            "flip-card-inner relative w-full h-full transition-transform duration-500",
            isFlipped && "rotate-y-180"
          )}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            className="flip-card-front absolute w-full h-full backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div
              className="sub-card glass-card rounded-xl p-5 h-full overflow-hidden flex flex-col justify-between group transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl"
              style={{
                ["--card-bg-color" as string]: subscription.card_color,
                borderColor: `${subscription.card_color}20`,
              }}
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: subscription.card_color }}
                  >
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-display font-bold text-foreground">
                      {symbol}{subscription.price.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      {t("per_month")}
                    </div>
                  </div>
                </div>

                <h3 className="font-display text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors truncate">
                  {subscription.name}
                </h3>

                <div className="h-px my-4 opacity-20" style={{ backgroundColor: subscription.card_color }} />
              </div>

              <div className="space-y-2 mt-auto">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("countdown_title")}
                </p>
                <CountdownTimer targetDate={subscription.next_payment_date} />
              </div>
            </div>
          </div>

          {/* BACK SIDE */}
          <div 
            className="flip-card-back absolute w-full h-full backface-hidden rotate-y-180"
            style={{ 
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div
              className="sub-card glass-card rounded-xl p-5 h-full overflow-hidden flex flex-col"
              style={{ 
                ["--card-bg-color" as string]: subscription.card_color,
                borderColor: `${subscription.card_color}20`
              }}
            >
              {isEditing ? (
                // Edit Mode
                <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-semibold">{t("edit")}</h3>
                    <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <div>
                      <Label className="text-xs">{tSubscriptions("edit_name")}</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-sm input-ruby"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">{tSubscriptions("price")}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value ? Number(e.target.value) : "")}
                          className="h-8 text-sm input-ruby"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{tSubscriptions("edit_currency")}</Label>
                        <Select value={editCurrency} onValueChange={setEditCurrency}>
                          <SelectTrigger className="h-8 text-sm input-ruby">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {currencies.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">{tSubscriptions("edit_billing")}</Label>
                      <Select value={editBillingCycle} onValueChange={(v) => setEditBillingCycle(v as "monthly" | "yearly")}>
                        <SelectTrigger className="h-8 text-sm input-ruby">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="monthly">{tModals("monthly")}</SelectItem>
                          <SelectItem value="yearly">{tModals("yearly")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full mt-3"
                    style={{ backgroundColor: subscription.card_color }}
                  >
                    {isSaving ? tProfile("save_changes") : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {tProfile("save_changes")}
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                // Info Mode
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: subscription.card_color }}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-semibold truncate">{subscription.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">
                        {t("monthly_sub")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("start_date")}</span>
                    <span>{formatDate(subscription.start_date, { dateStyle: "medium" })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("next_payment")}</span>
                      <span>
                        {subscription.next_payment_date 
                          ? formatDate(subscription.next_payment_date, { dateStyle: "medium" })
                          : "—"
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("amount")}</span>
                      <span className="font-semibold">
                        {symbol}{subscription.price.toFixed(2)} {t("per_month")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-muted-foreground">{t("mark_unused")}</span>
                    <Switch
                      checked={subscription.is_marked_unused ?? false}
                      onCheckedChange={handleToggleUnused}
                      onClick={(e) => e.stopPropagation()}
                      disabled={isToggling}
                      className="scale-90"
                    />
                  </div>

                  {/* Actions - Manage button always visible */}
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      className="flex-1 gap-1"
                      style={{ backgroundColor: subscription.card_color }}
                      onClick={handleExternalLink}
                    >
                      <ExternalLink className="w-3 h-3" />
                      {t("manage")}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={handleEdit}
                    >
                      <Edit className="w-3 h-3" />
                      {t("edit")}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                      onClick={handleDeleteClick}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Subscription
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{subscription.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
