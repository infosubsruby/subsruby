import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/Navbar";
import { Mail, Lock, User, Phone, ArrowRight, MailCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

const Signup = () => {
  const navigate = useNavigate();
  const { signUp, signInAsDemo } = useAuth();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        phone: phone || undefined,
      });
      
      if (error) {
        toast.error(`Signup failed: ${error.message}`);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setIsEmailSent(true);

    } catch (err) {
      toast.error("Unexpected error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setIsDemoLoading(true);
    const { error } = await signInAsDemo("free");
    setIsDemoLoading(false);
    if (error) {
      toast.error(error.message || "Unable to open demo mode.");
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
            <h1 className="font-display text-2xl font-bold text-zinc-100">Create Account</h1>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-8">
            {isEmailSent ? (
              <div className="flex flex-col items-center text-center gap-4 py-6">
                <MailCheck className="w-14 h-14 text-red-500" />
                <div className="space-y-1">
                  <h2 className="font-display text-xl font-bold text-zinc-100">Check your email</h2>
                  <p className="text-sm text-zinc-400">If email verification is enabled, confirm your account before sign-in.</p>
                </div>
                <Button className="mt-2" variant="outline" onClick={() => navigate("/login")}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-500" />
                      First name *
                    </Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="border-white/15 bg-black/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-500" />
                      Last name *
                    </Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="border-white/15 bg-black/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    Email *
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
                    <Phone className="w-4 h-4 text-zinc-500" />
                    Phone (optional)
                  </Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="border-white/15 bg-black/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-zinc-500" />
                    Password *
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

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-zinc-500" />
                    Confirm password *
                  </Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-white/15 bg-black/20"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create account"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            )}

            {isEmailSent ? null : (
              <>
                <div className="my-5 h-px w-full bg-white/10" />
                <Button variant="outline" className="w-full" onClick={() => void handleDemo()} disabled={isDemoLoading}>
                  {isDemoLoading ? "Entering demo..." : "Continue with Demo"}
                </Button>
                <p className="mt-4 text-center text-xs text-zinc-500">
                  Your financial data stays private to your account. Manual tracking is supported. Bank sync can be added later.
                </p>
              </>
            )}
          </div>

          {isEmailSent ? null : (
            <p className="text-center mt-6 text-zinc-400">
              Already have an account?{" "}
              <Link to="/login" className="text-red-300 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
