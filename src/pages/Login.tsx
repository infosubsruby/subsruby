import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/Navbar";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/i18n/useTranslations";

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const tAuth = useTranslations("Auth");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const { error, hasCompletedOnboarding } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message || "Failed to sign in");
      setIsLoading(false);
      return;
    }

    toast.success("Welcome back!");
    navigate(hasCompletedOnboarding === false ? "/onboarding" : "/dashboard");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img
                src="/logo.png"
                alt="Site Logosu"
                className="h-full w-auto max-h-8 sm:max-h-10 object-contain"
              />
            </div>
            <h1 className="font-display text-2xl font-bold">{tAuth("welcome_back")}</h1>
            <p className="text-muted-foreground mt-2">{tAuth("sign_in_to_account")}</p>
          </div>

          {/* Form */}
          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {tAuth("email")}
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-ruby"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  {tAuth("password")}
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-ruby"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong transition-all gap-2"
                disabled={isLoading}
              >
                {tAuth("sign_in_btn")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center mt-6 text-muted-foreground">
            {tAuth("dont_have_account")}{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              {tAuth("sign_up")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
