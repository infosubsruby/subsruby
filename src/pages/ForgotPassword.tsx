import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email address.");
      return;
    }
    setIsSubmitting(true);
    // Placeholder-only behavior: no real reset provider call is wired yet.
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setIsSubmitting(false);
    toast.success("Password reset flow will be available once auth provider reset is configured.");
  };

  return (
    <div className="min-h-screen bg-[#07090d] text-zinc-100">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-lg items-center px-4 py-12">
        <section className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Your financial data stays private to your account. Manual tracking is supported while backend reset flows are connected.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="border-white/15 bg-black/20 pl-9"
                />
              </div>
            </div>
            <Button disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Sending..." : "Send reset link (Placeholder)"}
            </Button>
          </form>

          <Link to="/login" className="mt-5 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-200">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </section>
      </main>
    </div>
  );
};

export default ForgotPassword;
