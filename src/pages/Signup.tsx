import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/Navbar";
import { Mail, Lock, User, Phone, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/i18n/useTranslations";

const Signup = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const tAuth = useTranslations("Auth");
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    
    console.log('Signup attempt:', { email, firstName, lastName });
    
    try {
      const { error } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        phone: phone || undefined,
      });
      
      if (error) {
        console.error('Signup error:', error);
        toast.error(`Signup başarısız: ${error.message}`);
        setIsLoading(false);
        return;
      }

      console.log('Signup başarılı! Email:', email);
      toast.success("Kayıt başarılı, yönlendiriliyorsunuz...");
      
      // Kısa bir gecikme ekleyerek kullanıcının toast mesajını görmesini sağlıyoruz
      setTimeout(() => {
        setIsLoading(false);
        navigate("/onboarding");
      }, 1500);

    } catch (err) {
      console.error('Beklenmeyen hata:', err);
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
      setIsLoading(false);
    }
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
            <h1 className="font-display text-2xl font-bold">{tAuth("create_account")}</h1>
          </div>

          {/* Form */}
          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {tAuth("first_name")} *
                  </Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="input-ruby"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {tAuth("last_name")} *
                  </Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="input-ruby"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {tAuth("email")} *
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
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {tAuth("phone_optional")}
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="input-ruby"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  {tAuth("password")} *
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

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  {tAuth("confirm_password")} *
                </Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {tAuth("create_btn")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center mt-6 text-muted-foreground">
            {tAuth("already_account")}{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              {tAuth("sign_in_btn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
