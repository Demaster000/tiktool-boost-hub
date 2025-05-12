
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type UserStats = {
  points: number;
  followers_gained: number;
  ideas_generated: number;
  analyses_completed: number;
  videos_shared: number;
  daily_challenges_completed: number;
}

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    points: 0,
    followers_gained: 0,
    ideas_generated: 0,
    analyses_completed: 0,
    videos_shared: 0,
    daily_challenges_completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_statistics')
          .select('points, followers_gained, ideas_generated, analyses_completed, videos_shared, daily_challenges_completed')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setStats({
            points: data.points || 0,
            followers_gained: data.followers_gained || 0,
            ideas_generated: data.ideas_generated || 0,
            analyses_completed: data.analyses_completed || 0,
            videos_shared: data.videos_shared || 0,
            daily_challenges_completed: data.daily_challenges_completed || 0
          });
        }
      } catch (err: any) {
        console.error('Error fetching user stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const updateStat = async (field: keyof UserStats, value: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_statistics')
        .update({ [field]: value })
        .eq('user_id', user.id);

      if (error) throw error;

      setStats(prev => ({ ...prev, [field]: value }));
    } catch (err: any) {
      console.error(`Error updating ${field}:`, err);
      setError(err.message);
      return false;
    }
    return true;
  };

  const incrementStat = async (field: keyof UserStats, amount: number = 1) => {
    if (!user) return false;
    
    try {
      const currentValue = stats[field];
      const newValue = currentValue + amount;
      
      const { error } = await supabase
        .from('user_statistics')
        .update({ [field]: newValue })
        .eq('user_id', user.id);

      if (error) throw error;

      setStats(prev => ({ ...prev, [field]: newValue }));
      return true;
    } catch (err: any) {
      console.error(`Error incrementing ${field}:`, err);
      setError(err.message);
      return false;
    }
  };

  return { stats, loading, error, updateStat, incrementStat };
};
