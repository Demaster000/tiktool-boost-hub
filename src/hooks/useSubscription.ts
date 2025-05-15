
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionStatus } from "@/types/subscription";
import { useAuth } from "@/contexts/AuthContext";

const useSubscription = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
    points_earned_today: 0,
    was_upgraded: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log("Checking subscription status for user:", user.id);
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        throw error;
      }

      if (data) {
        console.log("Subscription check response:", data);
        setStatus({
          subscribed: data.subscribed || false,
          subscription_tier: data.subscription_tier || null,
          subscription_end: data.subscription_end || null,
          points_earned_today: data.points_earned_today || 0,
          was_upgraded: data.was_upgraded || false
        });
      }
      
      return true;
    } catch (err: any) {
      console.error("Error checking subscription:", err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  return { status, loading, error, checkSubscription };
};

export default useSubscription;
