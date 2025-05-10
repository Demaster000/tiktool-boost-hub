
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useHashtags = () => {
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHashtagsByNiche = async (niche: string, limit: number = 10) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('hashtags')
        .select('tag')
        .eq('niche', niche)
        .order('created_at', { ascending: false })
        .limit(100); // Get more than we need for randomization

      if (error) throw error;

      if (data && data.length > 0) {
        // Shuffle and take the first 'limit' items
        const shuffled = data.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, limit);
        setHashtags(selected.map(item => item.tag));
      } else {
        setHashtags([]);
      }
    } catch (err: any) {
      console.error('Error fetching hashtags:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { hashtags, loading, error, getHashtagsByNiche };
};
