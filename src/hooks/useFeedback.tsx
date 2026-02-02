import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Feedback {
  id: number;
  user_id: string;
  type: "bug" | "suggestion" | "report" | "general";
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  admin_response: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackWithUser extends Feedback {
  user_name?: string;
  user_email?: string;
}

export const useFeedback = () => {
  const { user, isAdmin } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeedbacks = async () => {
    if (!user) return;

    setIsLoading(true);

    const { data, error } = await supabase
      .from("feedbacks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feedbacks:", error);
      setIsLoading(false);
      return;
    }

    // If admin, fetch user profiles for each feedback
    if (isAdmin && data) {
      const feedbacksWithUsers = await Promise.all(
        data.map(async (feedback) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", feedback.user_id)
            .maybeSingle();

          return {
            ...feedback,
            user_name: profile
              ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
              : "Unknown User",
          } as FeedbackWithUser;
        })
      );
      setFeedbacks(feedbacksWithUsers);
    } else {
      setFeedbacks(data as FeedbackWithUser[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [user, isAdmin]);

  const createFeedback = async (
    type: Feedback["type"],
    subject: string,
    message: string
  ) => {
    if (!user) {
      toast.error("You must be logged in to submit feedback");
      return { error: new Error("Not authenticated") };
    }

    const { data, error } = await supabase.from("feedbacks").insert({
      user_id: user.id,
      type,
      subject,
      message,
    }).select().single();

    if (error) {
      toast.error("Failed to submit feedback");
      return { error };
    }

    toast.success("Feedback submitted successfully!");
    await fetchFeedbacks();
    return { data };
  };

  const updateFeedbackResponse = async (
    feedbackId: number,
    response: string,
    status: Feedback["status"]
  ) => {
    const { error } = await supabase
      .from("feedbacks")
      .update({
        admin_response: response,
        status,
      })
      .eq("id", feedbackId);

    if (error) {
      toast.error("Failed to update feedback");
      return { error };
    }

    toast.success("Response sent!");
    await fetchFeedbacks();
    return { success: true };
  };

  const rateFeedback = async (feedbackId: number, rating: number) => {
    const { error } = await supabase
      .from("feedbacks")
      .update({ rating })
      .eq("id", feedbackId);

    if (error) {
      toast.error("Failed to submit rating");
      return { error };
    }

    toast.success("Thank you for your feedback!");
    await fetchFeedbacks();
    return { success: true };
  };

  return {
    feedbacks,
    isLoading,
    createFeedback,
    updateFeedbackResponse,
    rateFeedback,
    refetch: fetchFeedbacks,
  };
};
