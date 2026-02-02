import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, Mail, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface GrantLifetimeAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const GrantLifetimeAccessModal = ({
  open,
  onOpenChange,
  onSuccess,
}: GrantLifetimeAccessModalProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);

    try {
      // Find the user by email
      const { data: profiles, error: findError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, has_lifetime_access")
        .eq("email", email.trim())
        .limit(1);

      if (findError) {
        throw findError;
      }

      if (!profiles || profiles.length === 0) {
        toast.error("No user found with this email address");
        setIsLoading(false);
        return;
      }

      const profile = profiles[0];

      if (profile.has_lifetime_access) {
        toast.info(`${profile.first_name || "User"} already has lifetime access`);
        setIsLoading(false);
        return;
      }

      // Grant lifetime access
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ has_lifetime_access: true })
        .eq("id", profile.id);

      if (updateError) {
        throw updateError;
      }

      toast.success(
        `Lifetime access granted to ${profile.first_name || profile.email}!`
      );
      setEmail("");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to grant lifetime access");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Grant Lifetime Access
          </DialogTitle>
          <DialogDescription>
            Enter the email address of the user you want to grant unlimited access to.
            This will remove all trial restrictions for that user.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              User Email
            </Label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-ruby"
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="ruby-gradient border-0 gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Grant Access
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
