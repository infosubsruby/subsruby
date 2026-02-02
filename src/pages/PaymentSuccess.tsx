import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#E50914', '#FFD700', '#00FF00']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#E50914', '#FFD700', '#00FF00']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Refresh profile to get updated has_lifetime_access status
    refreshProfile();
  }, [refreshProfile]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mx-auto animate-pulse">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <div className="absolute -top-2 -right-2 w-12 h-12 flex items-center justify-center">
            <PartyPopper className="w-8 h-8 text-warning animate-bounce" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
          {t.paymentSuccess?.title || "Payment Successful! 🎉"}
        </h1>
        
        <p className="text-lg text-muted-foreground mb-2">
          {t.paymentSuccess?.subtitle || "Thank you for your purchase!"}
        </p>
        
        <p className="text-muted-foreground mb-8">
          {t.paymentSuccess?.message || "Your Pro features will be activated shortly. You now have unlimited access to all premium features."}
        </p>

        {/* Status Card */}
        <div className="glass-card rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center gap-3 text-success">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">
              {t.paymentSuccess?.status || "Lifetime Pro Access Activated"}
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          onClick={() => navigate("/control")}
          className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong gap-2 px-8 py-6 text-lg"
          size="lg"
        >
          {t.paymentSuccess?.cta || "Go to Dashboard"}
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
