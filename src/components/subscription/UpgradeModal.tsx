import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Diamond, Check, Sparkles, ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LIFETIME_PRICE = 5.98;

export const UpgradeModal = ({ open, onOpenChange }: UpgradeModalProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/upgrade");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="ruby-gradient p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Diamond className="w-8 h-8 text-white" />
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-display text-white">
              {t.upgrade.title}
            </DialogTitle>
            <DialogDescription className="text-white/80">
              {t.upgrade.oneTimePayment}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Price Display */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-display font-bold text-foreground">${LIFETIME_PRICE}</span>
              <span className="text-muted-foreground">one-time</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t.upgrade.lifetimeAccess}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <FeatureItem>{t.upgrade.features.unlimited}</FeatureItem>
            <FeatureItem>{t.upgrade.features.currencies}</FeatureItem>
            <FeatureItem>{t.upgrade.features.support}</FeatureItem>
            <FeatureItem>{t.upgrade.features.updates}</FeatureItem>
            <FeatureItem>{t.upgrade.features.export}</FeatureItem>
          </div>

          {/* Upgrade Button */}
          <Button 
            onClick={handleUpgrade}
            className="w-full ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong text-lg py-6 gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            {t.upgrade.ctaButton}
          </Button>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t.upgrade.securePayment}
            </span>
            <span>•</span>
            <span>{t.upgrade.moneyBack}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FeatureItem = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
      <Check className="w-3 h-3 text-success" />
    </div>
    <span className="text-foreground">{children}</span>
  </div>
);
