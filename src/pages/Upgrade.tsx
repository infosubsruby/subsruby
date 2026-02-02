import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Check, Diamond, Shield, Zap, HeadphonesIcon, Infinity, ArrowLeft } from "lucide-react";

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_00w28tfjo5BGf95ehQbEA00";

const Upgrade = () => {
  const navigate = useNavigate();
  const { user, isUnlimited } = useAuth();
  const { t } = useLanguage();

  // Payment link is handled directly via anchor tag for maximum compatibility

  // If user already has lifetime access, show a different message
  if (isUnlimited) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 px-4">
          <div className="container mx-auto max-w-2xl text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">
              {t.upgrade?.alreadyPro || "You already have Pro access!"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t.upgrade?.enjoyFeatures || "Enjoy all premium features without any limitations."}
            </p>
            <Button onClick={() => navigate("/control")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.upgrade?.backToDashboard || "Back to Dashboard"}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 px-4 pb-16">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-2xl ruby-gradient flex items-center justify-center mx-auto mb-6 shadow-ruby">
              <Diamond className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              {t.upgrade?.title || "Upgrade to Pro"}
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
              {t.upgrade?.subtitle || "Unlock all premium features with a one-time payment. No subscriptions, no recurring fees."}
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-lg mx-auto">
            <div className="glass-card rounded-2xl overflow-hidden border border-primary/20">
              {/* Card Header */}
              <div className="ruby-gradient p-6 text-center">
                <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">
                  {t.upgrade?.lifetimeAccess || "Lifetime Access"}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl md:text-6xl font-display font-bold text-white">$5.98</span>
                </div>
                <p className="text-white/70 mt-2">
                  {t.upgrade?.oneTimePayment || "One-time payment • Forever yours"}
                </p>
              </div>

              {/* Features List */}
              <div className="p-6 space-y-4">
                <FeatureItem icon={Infinity}>
                  {t.upgrade?.features?.unlimited || "Unlimited subscriptions"}
                </FeatureItem>
                <FeatureItem icon={Zap}>
                  {t.upgrade?.features?.advanced || "Advanced analytics & insights"}
                </FeatureItem>
                <FeatureItem icon={HeadphonesIcon}>
                  {t.upgrade?.features?.support || "Priority customer support"}
                </FeatureItem>
                <FeatureItem icon={Shield}>
                  {t.upgrade?.features?.updates || "All future updates included"}
                </FeatureItem>
                <FeatureItem icon={Check}>
                  {t.upgrade?.features?.currencies || "All currencies supported"}
                </FeatureItem>
                <FeatureItem icon={Check}>
                  {t.upgrade?.features?.export || "Export & data backup"}
                </FeatureItem>
              </div>

              {/* CTA Button */}
              <div className="p-6 pt-0">
                <a 
                  href={`${STRIPE_PAYMENT_LINK}${user?.email ? `?prefilled_email=${encodeURIComponent(user.email)}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong text-lg py-6 gap-2 transition-all inline-flex items-center justify-center rounded-md font-medium text-white"
                >
                  <Shield className="w-5 h-5" />
                  {t.upgrade?.ctaButton || "Pay Securely with Stripe"}
                </a>
                
                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {t.upgrade?.securePayment || "Secure Payment"}
                  </span>
                  <span>•</span>
                  <span>{t.upgrade?.moneyBack || "30-day money-back guarantee"}</span>
                </div>
              </div>
            </div>

            {/* Back Link */}
            <div className="text-center mt-8">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/control")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.upgrade?.backToDashboard || "Back to Dashboard"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const FeatureItem = ({ 
  icon: Icon, 
  children 
}: { 
  icon: React.ElementType; 
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-success" />
    </div>
    <span className="text-foreground">{children}</span>
  </div>
);

export default Upgrade;
