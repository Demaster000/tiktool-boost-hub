
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionStatus } from '@/types/subscription';

export const useSubscription = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
    points_earned_today: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) throw error;

      setStatus({
        subscribed: data?.subscribed || false,
        subscription_tier: data?.subscription_tier || null,
        subscription_end: data?.subscription_end || null,
        points_earned_today: data?.points_earned_today || 0
      });
    } catch (err: any) {
      console.error('Error checking subscription status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
    
    // Check subscription status periodically
    const interval = setInterval(() => {
      checkSubscription();
    }, 300000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, [user]);

  // Also check when URL changes (after checkout)
  useEffect(() => {
    const url = new URL(window.location.href);
    const success = url.searchParams.get('success');
    
    if (success === 'true') {
      checkSubscription();
      
      // Clear URL params after successful checkout
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return {
    status,
    loading,
    error,
    checkSubscription
  };
};

export default useSubscription;
