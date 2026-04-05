import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "@/i18n/useTranslations";
import { 
  Diamond, 
  ArrowRight, 
  Bell, 
  Wallet, 
  BarChart3, 
  Shield,
  Sparkles,
  Clock,
  CreditCard,
  Loader2
} from "lucide-react";

const Index = () => {
  const { user, isLoading } = useAuth();
  const tLanding = useTranslations("Landing");

  // Redirect authenticated users to dashboard
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/control" replace />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-ruby-dark/30 rounded-full blur-[80px] -z-10" />
        
        <div className="container mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{tLanding("mini_title")}</span>
          </div>
          
          {/* Main heading */}
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in">
            {tLanding("hero_title")}
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
            {tLanding("hero_desc")}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link to="/signup">
              <Button size="lg" className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong transition-all gap-2 text-lg px-8 py-6">
                {tLanding("get_started")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6 border-border hover:bg-secondary">
                {tLanding("sign_in")}
              </Button>
            </Link>
          </div>

          {/* Pricing hint */}
          <p className="mt-6 text-sm text-muted-foreground">
            {tLanding("free_plan_note")}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {tLanding("mini_desc")}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              <span className="ruby-text-gradient">{tLanding("features_title")}</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {tLanding("features_subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass-card rounded-xl p-6 card-hover">
              <div className="w-12 h-12 rounded-lg ruby-gradient flex items-center justify-center mb-4 shadow-ruby">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Smart Reminders</h3>
              <p className="text-muted-foreground">
                Get notified before renewals. Live countdown timers show exactly when payments are due.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card rounded-xl p-6 card-hover">
              <div className="w-12 h-12 rounded-lg ruby-gradient flex items-center justify-center mb-4 shadow-ruby">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Track Spending</h3>
              <p className="text-muted-foreground">
                See your total monthly costs at a glance. Track multiple currencies with ease.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card rounded-xl p-6 card-hover">
              <div className="w-12 h-12 rounded-lg ruby-gradient flex items-center justify-center mb-4 shadow-ruby">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Smart Auto-Fill</h3>
              <p className="text-muted-foreground">
                Type "Netflix" and watch prices, links, and colors fill in automatically.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card rounded-xl p-6 card-hover">
              <div className="w-12 h-12 rounded-lg ruby-gradient flex items-center justify-center mb-4 shadow-ruby">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Live Countdown</h3>
              <p className="text-muted-foreground">
                Real-time countdown timers on each subscription card showing days, hours, minutes, seconds.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card rounded-xl p-6 card-hover">
              <div className="w-12 h-12 rounded-lg ruby-gradient flex items-center justify-center mb-4 shadow-ruby">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Quick Actions</h3>
              <p className="text-muted-foreground">
                One-click access to subscription management pages. Cancel or modify directly.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card rounded-xl p-6 card-hover">
              <div className="w-12 h-12 rounded-lg ruby-gradient flex items-center justify-center mb-4 shadow-ruby">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your data is encrypted and protected. Only you can access your subscriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-card rounded-2xl p-12 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[60px] -z-10" />
            
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center mx-auto mb-6 overflow-hidden">
              <img
                src="/logo.png"
                alt="Site Logosu"
                className="h-full w-auto max-h-8 sm:max-h-10 object-contain"
              />
            </div>
            
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              {tLanding("ready_title")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              {tLanding("ready_desc")}
            </p>
            
            <Link to="/signup">
              <Button size="lg" className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong transition-all gap-2 text-lg px-10 py-6">
                {tLanding("get_started_free")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-md flex items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="Site Logosu"
                className="h-full w-auto max-h-8 sm:max-h-10 object-contain"
              />
            </div>
            <span className="font-display font-semibold">SubsRuby</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 SubsRuby. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
