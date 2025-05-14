
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
        console.log("Fetching user stats for:", user.id);
        const { data, error } = await supabase
          .from('user_statistics')
          .select('points, followers_gained, ideas_generated, analyses_completed, videos_shared, daily_challenges_completed')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          console.log("Received user stats:", data);
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
    
    // Set up realtime subscription to user statistics updates
    if (user) {
      const statsChannel = supabase
        .channel('user-stats-changes')
        .on('postgres_changes', 
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_statistics',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Stats updated via realtime:', payload);
            // Update our local state with the new data
            if (payload.new) {
              setStats(prev => ({
                ...prev,
                points: payload.new.points || prev.points,
                followers_gained: payload.new.followers_gained || prev.followers_gained,
                ideas_generated: payload.new.ideas_generated || prev.ideas_generated,
                analyses_completed: payload.new.analyses_completed || prev.analyses_completed,
                videos_shared: payload.new.videos_shared || prev.videos_shared,
                daily_challenges_completed: payload.new.daily_challenges_completed || prev.daily_challenges_completed
              }));
            }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(statsChannel);
      };
    }
  }, [user]);

  const updateStat = async (field: keyof UserStats, value: number) => {
    if (!user) return false;

    try {
      console.log(`Updating ${field} to ${value} for user ${user.id}`);
      
      // Update the database
      const { error } = await supabase
        .from('user_statistics')
        .update({
          [field]: value,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Also update our local state
      setStats(prev => ({ ...prev, [field]: value }));
      return true;
    } catch (err: any) {
      console.error(`Error updating ${field}:`, err);
      setError(err.message);
      return false;
    }
  };

  const incrementStat = async (field: keyof UserStats, amount: number = 1) => {
    if (!user) return false;
    
    try {
      const currentValue = stats[field];
      const newValue = currentValue + amount;
      
      console.log(`Incrementing ${field} by ${amount} to new value ${newValue} for user ${user.id}`);
      
      const { error } = await supabase
        .from('user_statistics')
        .update({ 
          [field]: newValue,
          updated_at: new Date().toISOString()
        })
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
