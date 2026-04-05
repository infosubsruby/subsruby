import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useTranslations } from "@/i18n/useTranslations";

interface SubscriptionLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SubscriptionLimitModal = ({
  open,
  onOpenChange,
}: SubscriptionLimitModalProps) => {
  const navigate = useNavigate();
  const t = useTranslations("Dashboard");
  const FREE_PLAN_LIMIT = 3;

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/upgrade");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
        <div className="ruby-gradient p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-display text-white">
              {t("limit_warning", { limit: FREE_PLAN_LIMIT })}
            </DialogTitle>
            <DialogDescription className="text-white/80">
              {t("unlock_pro")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          <Button
            onClick={handleUpgrade}
            className="w-full ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong text-lg py-6 gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {t("upgrade_btn")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

