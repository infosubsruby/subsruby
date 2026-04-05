import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Subscription } from "@/hooks/subscriptions/types";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/useTranslations";

interface SavingsDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unusedSubscriptions: Subscription[];
  monthlySavings: number;
  yearlySavings: number;
  currencySymbol: string;
}

export const SavingsDetailsModal: React.FC<SavingsDetailsModalProps> = ({
  isOpen,
  onClose,
  unusedSubscriptions,
  monthlySavings,
  yearlySavings,
  currencySymbol,
}) => {
  const t = useTranslations("Modals");
  const hasUnused = unusedSubscriptions.length > 0;
  const isMultipleUnused = unusedSubscriptions.length > 2;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">{t("savings_title")}</DialogTitle>
          <DialogDescription>
            {t("savings_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section 1: Unused Subscriptions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t("unused_subs")}
            </h4>
            {!hasUnused ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm text-foreground font-medium">
                  {t("no_unused")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("great_job")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {unusedSubscriptions.map((sub) => (
                  <div key={sub.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="font-medium">{sub.name}</span>
                    <span className="font-display font-semibold">
                      {currencySymbol}{sub.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-border/50" />

          {/* Section 2: Savings Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground mb-1">{t("monthly_savings")}</p>
              <p className="text-xl font-display font-bold text-primary">
                {currencySymbol}{monthlySavings.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
              <p className="text-xs text-muted-foreground mb-1">{t("yearly_savings")}</p>
              <p className="text-xl font-display font-bold text-green-500">
                {currencySymbol}{yearlySavings.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Section 3: Smart Insight */}
          {hasUnused && (
            <div className="flex gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                These subscriptions are marked as unused. 
                Cancelling them could significantly reduce your recurring expenses.
              </p>
            </div>
          )}

          {/* Section 4: Smart Warning */}
          {isMultipleUnused && (
            <div className="flex gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-600 dark:text-amber-500 font-medium leading-relaxed">
                You have multiple unused subscriptions. 
                Consider cancelling them to reduce unnecessary spending.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
