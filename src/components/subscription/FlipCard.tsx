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

interface FlipCardProps {
  subscription: Subscription;
  onUpdate: (id: number, payload: Partial<CreateSubscriptionData>) => Promise<{ success: boolean }>;
  onDelete: (id: number) => Promise<{ success: boolean }>;
}

export const FlipCard = ({ subscription, onUpdate, onDelete }: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
  
  // Get currency symbol
  const currencyInfo = currencies.find((c) => c.value === subscription.currency);
  const symbol = currencyInfo?.symbol || "$";

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

  return (
    <>
      <div 
        className="flip-card-container h-[280px] cursor-pointer perspective-1000"
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
          {/* FRONT SIDE */}
          <div 
            className="flip-card-front absolute w-full h-full backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div
              className="sub-card glass-card rounded-xl p-6 h-full group transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl"
              style={{ 
                ["--card-bg-color" as string]: subscription.card_color,
                borderColor: `${subscription.card_color}20`
              }}
            >
              {/* Header with icon and price */}
              <div className="flex items-start justify-between mb-6">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: subscription.card_color }}
                >
                  <IconComponent className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-bold text-foreground">
                    {symbol}{subscription.price.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    / {subscription.billing_cycle === "yearly" ? "year" : "month"}
                  </div>
                </div>
              </div>

              {/* Name */}
              <h3 className="font-display text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {subscription.name}
              </h3>

              {/* Divider */}
              <div 
                className="h-px my-4 opacity-20"
                style={{ backgroundColor: subscription.card_color }}
              />

              {/* Countdown */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Next Payment In
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
              className="sub-card glass-card rounded-xl p-6 h-full flex flex-col"
              style={{ 
                ["--card-bg-color" as string]: subscription.card_color,
                borderColor: `${subscription.card_color}20`
              }}
            >
              {isEditing ? (
                // Edit Mode
                <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-semibold">Edit</h3>
                    <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-sm input-ruby"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value ? Number(e.target.value) : "")}
                          className="h-8 text-sm input-ruby"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Currency</Label>
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
                      <Label className="text-xs">Billing</Label>
                      <Select value={editBillingCycle} onValueChange={(v) => setEditBillingCycle(v as "monthly" | "yearly")}>
                        <SelectTrigger className="h-8 text-sm input-ruby">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
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
                    {isSaving ? "Saving..." : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
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
                    <div>
                      <h3 className="font-display text-lg font-semibold">{subscription.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">
                        {subscription.billing_cycle} subscription
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Start Date</span>
                      <span>{format(new Date(subscription.start_date), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next Payment</span>
                      <span>
                        {subscription.next_payment_date 
                          ? format(new Date(subscription.next_payment_date), "MMM d, yyyy")
                          : "N/A"
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold">
                        {symbol}{subscription.price.toFixed(2)} / {subscription.billing_cycle === "yearly" ? "yr" : "mo"}
                      </span>
                    </div>
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
                      Manage
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={handleEdit}
                    >
                      <Edit className="w-3 h-3" />
                      Edit
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
