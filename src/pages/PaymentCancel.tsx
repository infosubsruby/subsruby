import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

const PaymentCancel = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Cancel Icon */}
        <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-8">
          <XCircle className="w-12 h-12 text-destructive" />
        </div>

        {/* Cancel Message */}
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
          {t.paymentCancel?.title || "Payment Cancelled"}
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8">
          {t.paymentCancel?.message || "Your payment was not completed. No charges were made to your account."}
        </p>

        {/* Info Card */}
        <div className="glass-card rounded-xl p-6 mb-8 text-left">
          <h3 className="font-medium mb-3">
            {t.paymentCancel?.whyTitle || "Why upgrade to Pro?"}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• {t.paymentCancel?.reason1 || "Unlimited subscription tracking"}</li>
            <li>• {t.paymentCancel?.reason2 || "Advanced analytics and insights"}</li>
            <li>• {t.paymentCancel?.reason3 || "Priority support"}</li>
            <li>• {t.paymentCancel?.reason4 || "One-time payment, lifetime access"}</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => navigate("/upgrade")}
            className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong gap-2"
            size="lg"
          >
            <RefreshCw className="w-4 h-4" />
            {t.paymentCancel?.tryAgain || "Try Again"}
          </Button>
          
          <Button 
            onClick={() => navigate("/control")}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.paymentCancel?.backToDashboard || "Back to Dashboard"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
