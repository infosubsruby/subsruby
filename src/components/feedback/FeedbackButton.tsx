import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackChat } from "./FeedbackChat";

export const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full ruby-gradient shadow-ruby hover:shadow-ruby-strong transition-all z-50"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat Panel */}
      <FeedbackChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
