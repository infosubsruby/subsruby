import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/Navbar";
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInAsDemo } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message || "Failed to sign in");
      setIsLoading(false);
      return;
    }

    const redirectPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/overview";
    toast.success("Welcome back!");
    navigate(redirectPath);
  };

  const handleDemo = async () => {
    setIsDemoLoading(true);
    const { error } = await signInAsDemo("free");
    setIsDemoLoading(false);
    if (error) {
      toast.error(error.message || "Demo access failed");
      return;
    }
    toast.success("Demo mode activated.");
    navigate("/overview");
  };

  return (
    <div className="min-h-screen bg-[#07090d]">
      <Navbar />
      
      <div className="min-h-[calc(100vh-64px)] px-4 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-red-200">
              <Sparkles className="h-3.5 w-3.5" />
              Ruby Auth
            </div>
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img
                src="/logo.png"
                alt="Ruby logo"
                className="h-full w-auto max-h-8 sm:max-h-10 object-contain"
              />
            </div>
            <h1 className="font-display text-2xl font-bold text-zinc-100">Welcome Back</h1>
            <p className="mt-2 text-sm text-zinc-400">Sign in to access your personal finance workspace.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="border-white/15 bg-black/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-zinc-500" />
                  Password
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-white/15 bg-black/20"
                  required
                />
              </div>

              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-xs text-zinc-400 transition hover:text-zinc-200">
                  Forgot password?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full gap-2"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Continue"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="my-5 h-px w-full bg-white/10" />

            <Button variant="outline" className="w-full" onClick={() => void handleDemo()} disabled={isDemoLoading}>
              {isDemoLoading ? "Entering demo..." : "Continue with Demo"}
            </Button>

            <p className="mt-4 text-center text-xs text-zinc-500">
              Your financial data stays private to your account. Manual tracking is supported. Bank sync can be added later.
            </p>
          </div>

          <p className="text-center mt-6 text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-red-300 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
