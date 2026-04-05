import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/useTranslations";

export const TrialBanner = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { isPro } = useSubscription();
  const { subscriptions } = useSubscriptions();
  const t = useTranslations("Dashboard");

  const FREE_PLAN_LIMIT = 3;
  const used = Math.min(Array.isArray(subscriptions) ? subscriptions.length : 0, FREE_PLAN_LIMIT);

  if (isAdmin || isPro) return null;

  return (
    <div className="trial-banner px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl mb-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{t("free_plan")}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground">
              {t("subs_used", { used, limit: FREE_PLAN_LIMIT })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("track_free", { limit: FREE_PLAN_LIMIT })}
          </p>
          <p className="text-xs text-muted-foreground/80">
            {t("unlock_pro")}
          </p>
        </div>
      </div>

      <Button
        size="sm"
        className="ruby-gradient border-0 gap-2 w-full sm:w-auto"
        onClick={() => navigate("/upgrade")}
      >
        <Sparkles className="w-4 h-4" />
        {t("upgrade_btn")}
      </Button>
    </div>
  );
};
