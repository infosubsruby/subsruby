import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Mail, Zap } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface PremiumLockedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade?: () => void;
}

export const PremiumLockedModal = ({ open, onOpenChange, onUpgrade }: PremiumLockedModalProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleUpgradeClick = () => {
    onOpenChange(false);
    if (onUpgrade) {
      onUpgrade();
    }
    navigate("/upgrade");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-display text-center">
            Unlock Automatic Email Scanning
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Stop adding subscriptions manually. Connect your Gmail or Outlook and let AI find them for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Features list */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <span>Connect Gmail or Outlook securely</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span>AI scans receipts & subscription emails</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span>One-click import all found subscriptions</span>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleUpgradeClick}
          className="w-full ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong transition-all text-lg py-6"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {t.dashboard.getLifetime}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {t.upgrade.oneTimePayment}
        </p>
      </DialogContent>
    </Dialog>
  );
};
