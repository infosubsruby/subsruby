import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSubscription } from "./useSubscription";
import { subscriptionsKeys } from "./subscriptions/keys";
import type { CreateSubscriptionData, Subscription } from "./subscriptions/types";
import { fetchSubscriptions, insertSubscription, patchSubscription, removeSubscription } from "./subscriptions/api";

export type { CreateSubscriptionData, Subscription };

export const useSubscriptions = () => {
  const { user, isTrialActive, isUnlimited } = useAuth();
  const { isPro } = useSubscription();
  const queryClient = useQueryClient();

  const MAX_TRIAL_SUBSCRIPTIONS = 3;
  const listKey = useMemo(() => subscriptionsKeys.list(user?.id), [user?.id]);

  const query = useQuery({
    queryKey: listKey,
    queryFn: async () => {
      if (!user) return [];
      return fetchSubscriptions(user.id);
    },
    enabled: !!user,
  });

  const subscriptions = (query.data ?? []) as Subscription[];
  const isLoading = user ? query.isLoading : false;

  // Keep realtime sync, but update the shared query cache instead of local component state.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("subscriptions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.setQueryData(listKey, (old) => {
            const prev = (old ?? []) as Subscription[];
            if (payload.eventType === "INSERT") {
              const incoming = payload.new as any;
              const normalized: Subscription = {
                ...(incoming as Subscription),
                currency: incoming?.currency ?? "USD",
                card_color: incoming?.card_color ?? "#E50914",
              };
              if (prev.some((s) => s.id === normalized.id)) return prev;
              return [normalized, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const incoming = payload.new as any;
              const normalized: Subscription = {
                ...(incoming as Subscription),
                currency: incoming?.currency ?? "USD",
                card_color: incoming?.card_color ?? "#E50914",
              };
              return prev.map((s) => (s.id === normalized.id ? normalized : s));
            }
            if (payload.eventType === "DELETE") {
              const deleted = payload.old as any;
              return prev.filter((s) => s.id !== (deleted?.id as number));
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, listKey]);

  const canAddSubscription = (): boolean => {
    // Unlimited users (admins or lifetime access) or Pro users have no limits
    if (isUnlimited || isPro) return true;
    
    // All other users are limited
    return subscriptions.length < MAX_TRIAL_SUBSCRIPTIONS;
  };

  const createMutation = useMutation({
    mutationFn: async (payload: CreateSubscriptionData) => {
      if (!user) throw new Error("Not authenticated");
      return insertSubscription(user.id, payload);
    },
    onMutate: async (payload) => {
      if (!user) return;

      await queryClient.cancelQueries({ queryKey: subscriptionsKeys.all });
      const previous = queryClient.getQueryData(listKey) as Subscription[] | undefined;

      const optimisticId = -Date.now();
      const optimistic: Subscription = {
        id: optimisticId,
        user_id: user.id,
        name: payload.name,
        slug: payload.slug,
        price: payload.price,
        currency: payload.currency,
        billing_cycle: payload.billing_cycle,
        start_date: payload.start_date,
        next_payment_date: payload.next_payment_date,
        website_url: payload.website_url ?? null,
        card_color: payload.card_color,
        country_code: payload.country_code ?? null,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(listKey, (old) => {
        const prev = (old ?? []) as Subscription[];
        return [optimistic, ...prev];
      });

      return { previous, optimisticId };
    },
    onError: (err, _payload, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
      console.error(err);
      toast.error("Failed to create subscription");
    },
    onSuccess: (created, _payload, ctx) => {
      queryClient.setQueryData(listKey, (old) => {
        const prev = (old ?? []) as Subscription[];
        return prev.map((s) => (s.id === ctx?.optimisticId ? created : s));
      });
      toast.success("Subscription added successfully!");
    },
    onSettled: () => {
      // This is the critical fix: shared cache invalidation triggers dashboard refetch/update.
      queryClient.invalidateQueries({ queryKey: subscriptionsKeys.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<CreateSubscriptionData> }) => {
      await patchSubscription(id, payload);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to update subscription");
    },
    onSuccess: () => {
      toast.success("Subscription updated!");
      queryClient.invalidateQueries({ queryKey: subscriptionsKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await removeSubscription(id);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to delete subscription");
    },
    onSuccess: () => {
      toast.success("Subscription deleted!");
      queryClient.invalidateQueries({ queryKey: subscriptionsKeys.all });
    },
  });

  const createSubscription = async (payload: CreateSubscriptionData) => {
    if (!user) {
      toast.error("Please sign in to add subscriptions");
      return { success: false };
    }
    if (!canAddSubscription()) {
      toast.error(`Ücretsiz planda maksimum ${MAX_TRIAL_SUBSCRIPTIONS} abonelik ekleyebilirsiniz. Sınırsız erişim için Pro'ya geçin.`);
      return { success: false };
    }

    try {
      await createMutation.mutateAsync(payload);
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  const updateSubscription = async (id: number, payload: Partial<CreateSubscriptionData>) => {
    try {
      await updateMutation.mutateAsync({ id, payload });
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  const deleteSubscription = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  const getSubscriptionBySlug = (slug: string): Subscription | undefined => {
    return subscriptions.find((sub) => sub.slug === slug);
  };

  const totalMonthlyCost = useMemo(() => {
    return subscriptions.reduce((total, sub) => {
      const rawPrice = Number(sub.price ?? 0);
      const price = sub.billing_cycle === "yearly" ? rawPrice / 12 : rawPrice;
      return total + price;
    }, 0);
  }, [subscriptions]);

  const refetchSubscriptions = async () => {
    await queryClient.invalidateQueries({ queryKey: subscriptionsKeys.all });
  };

  return {
    subscriptions,
    isLoading,
    canAddSubscription,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    getSubscriptionBySlug,
    totalMonthlyCost,
    fetchSubscriptions: refetchSubscriptions,
    maxTrialSubscriptions: MAX_TRIAL_SUBSCRIPTIONS,
  };
};
