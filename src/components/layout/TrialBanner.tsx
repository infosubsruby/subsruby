import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TrialBanner = () => {
  const navigate = useNavigate();
  const { isTrialActive, trialDaysLeft, isUnlimited } = useAuth();
  const { t } = useLanguage();

  // Don't show banner for unlimited users (admins or lifetime access)
  if (isUnlimited || !isTrialActive) return null;

  return (
    <div className="trial-banner px-4 py-3 flex items-center justify-between rounded-lg mb-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            Free Trial - <span className="text-primary">{trialDaysLeft} days left</span>
          </p>
          <p className="text-sm text-muted-foreground">
            You can add up to 3 subscriptions during trial
          </p>
        </div>
      </div>
      <Button 
        size="sm" 
        className="ruby-gradient border-0 gap-2"
        onClick={() => navigate("/upgrade")}
      >
        <Sparkles className="w-4 h-4" />
        {t.dashboard.getLifetime}
      </Button>
    </div>
  );
};
