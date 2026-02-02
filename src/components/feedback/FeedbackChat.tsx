import { useState, useEffect } from "react";
import { X, Send, Check, CheckCheck, Bug, Lightbulb, AlertCircle, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFeedback, Feedback } from "@/hooks/useFeedback";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface FeedbackChatProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = Feedback["type"];

const typeConfig = {
  bug: { icon: Bug, label: "Bug Report", color: "text-red-500" },
  suggestion: { icon: Lightbulb, label: "Suggestion", color: "text-yellow-500" },
  report: { icon: AlertCircle, label: "Report Issue", color: "text-orange-500" },
  general: { icon: MessageSquare, label: "General", color: "text-blue-500" },
};

export const FeedbackChat = ({ isOpen, onClose }: FeedbackChatProps) => {
  const { user } = useAuth();
  const { feedbacks, createFeedback, rateFeedback } = useFeedback();
  const [step, setStep] = useState<"welcome" | "type" | "form" | "sent" | "rating">("welcome");
  const [selectedType, setSelectedType] = useState<FeedbackType>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [lastFeedbackId, setLastFeedbackId] = useState<number | null>(null);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("welcome");
        setSelectedType("general");
        setSubject("");
        setMessage("");
        setRating(0);
      }, 300);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    const result = await createFeedback(selectedType, subject, message);
    setIsSubmitting(false);

    if (!result.error && result.data) {
      setLastFeedbackId(result.data.id);
      setStep("sent");
    }
  };

  const handleRating = async (value: number) => {
    setRating(value);
    if (lastFeedbackId) {
      await rateFeedback(lastFeedbackId, value);
    }
    setTimeout(() => onClose(), 1000);
  };

  const handleClose = () => {
    if (step === "sent") {
      setStep("rating");
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-[380px] max-h-[500px] glass-card rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="ruby-gradient p-4 flex items-center justify-between">
        <h3 className="font-display font-semibold text-white">Support Chat</h3>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/80 hover:text-white hover:bg-white/20"
          onClick={handleClose}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 min-h-[300px] flex flex-col">
        {step === "welcome" && (
          <div className="flex-1 flex flex-col">
            {/* Bot message */}
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full ruby-gradient flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="glass rounded-2xl rounded-tl-sm p-3 max-w-[280px]">
                <p className="text-sm">
                  👋 Welcome to <span className="font-semibold text-primary">SubsRuby</span> support!
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Let's make your experience better. We'll get back to you as soon as possible.
                </p>
              </div>
            </div>

            <div className="mt-auto">
              <Button
                onClick={() => setStep("type")}
                className="w-full ruby-gradient"
                disabled={!user}
              >
                {user ? "Start a conversation" : "Please login first"}
              </Button>
            </div>
          </div>
        )}

        {step === "type" && (
          <div className="flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-4">What would you like to share?</p>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(Object.entries(typeConfig) as [FeedbackType, typeof typeConfig.bug][]).map(
                ([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedType(type);
                        setStep("form");
                      }}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border border-border hover:border-primary transition-colors text-left",
                        "hover:bg-primary/5"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", config.color)} />
                      <span className="text-sm font-medium">{config.label}</span>
                    </button>
                  );
                }
              )}
            </div>

            <Button variant="ghost" onClick={() => setStep("welcome")} className="mt-auto">
              Back
            </Button>
          </div>
        )}

        {step === "form" && (
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-2">
              {(() => {
                const config = typeConfig[selectedType];
                const Icon = config.icon;
                return (
                  <>
                    <Icon className={cn("w-5 h-5", config.color)} />
                    <span className="font-medium">{config.label}</span>
                  </>
                );
              })()}
            </div>

            <Input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input-ruby"
            />

            <Textarea
              placeholder="Describe your feedback..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-ruby flex-1 min-h-[120px] resize-none"
            />

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep("type")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 ruby-gradient"
                disabled={isSubmitting || !subject.trim() || !message.trim()}
              >
                {isSubmitting ? "Sending..." : "Send"}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === "sent" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
              <CheckCheck className="w-8 h-8 text-success" />
            </div>
            <h4 className="font-display text-lg font-semibold mb-2">Message Sent!</h4>
            <p className="text-sm text-muted-foreground mb-4">
              We've received your feedback and will respond as soon as possible.
            </p>
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          </div>
        )}

        {step === "rating" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h4 className="font-display text-lg font-semibold mb-2">Rate your experience</h4>
            <p className="text-sm text-muted-foreground mb-4">
              How was your support experience?
            </p>
            
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      (hoveredRating >= value || rating >= value)
                        ? "fill-warning text-warning"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>

            <Button variant="ghost" size="sm" onClick={onClose}>
              Skip
            </Button>
          </div>
        )}
      </div>

      {/* Previous messages indicator */}
      {feedbacks.length > 0 && step === "welcome" && (
        <div className="border-t border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">
            You have {feedbacks.length} previous message{feedbacks.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
};
