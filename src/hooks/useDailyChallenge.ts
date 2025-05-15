
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useUserStats } from "@/hooks/useUserStats";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  goal: number;
  points: number;
  progress?: number;
  completed?: boolean;
}

export const useDailyChallenge = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, updateStat, incrementStat } = useUserStats();
  const [loading, setLoading] = useState(false);

  // Function to complete a challenge step (increment progress)
  const completeStep = async (challenge: Challenge) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const newProgress = (challenge.progress || 0) + 1;
      const completed = newProgress >= challenge.goal;
      
      // Update challenge progress
      const { data, error: progressError } = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', challenge.id)
        .gte('created_at', new Date().toISOString().split('T')[0])
        .single();
      
      if (progressError && progressError.code !== 'PGRST116') {
        console.error("Error checking challenge progress:", progressError);
        return;
      }
      
      if (data) {
        // Update existing progress
        const { error: updateError } = await supabase
          .from('challenge_progress')
          .update({ 
            progress: newProgress,
            completed
          })
          .eq('id', data.id);
        
        if (updateError) {
          console.error("Error updating progress:", updateError);
          return;
        }
      } else {
        // Create new progress entry
        const { error: insertError } = await supabase
          .from('challenge_progress')
          .insert({
            user_id: user.id,
            challenge_id: challenge.id,
            progress: newProgress,
            completed
          });
        
        if (insertError) {
          console.error("Error inserting progress:", insertError);
          return;
        }
      }
      
      // If challenge is completed, add points
      if (completed && !challenge.completed) {
        // Update user streak info
        const pointsToAdd = challenge.points;
        
        // Get current streak info
        const { data: currentStreak, error: streakError } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (streakError) {
          console.error("Error getting streak info:", streakError);
          return;
        }
        
        if (currentStreak) {
          const newPointsToday = (currentStreak.points_today || 0) + pointsToAdd;
          const today = new Date().toISOString().split('T')[0];
          const lastCompleted = currentStreak.last_completed_at?.split('T')[0];
          
          let newStreak = currentStreak.current_streak;
          
          // Check if this is a new day from last completion
          if (lastCompleted !== today) {
            // If last completed was yesterday, increment streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (lastCompleted === yesterdayStr) {
              newStreak += 1;
            } else if (lastCompleted) {
              // Streak broken
              newStreak = 1;
            } else {
              // First ever completion
              newStreak = 1;
            }
          }
          
          // Update streak info
          const { error: updateStreakError } = await supabase
            .from('user_streaks')
            .update({
              current_streak: newStreak,
              last_completed_at: new Date().toISOString(),
              points_today: newPointsToday
            })
            .eq('user_id', user.id);
          
          if (updateStreakError) {
            console.error("Error updating streak info:", updateStreakError);
            return;
          }
          
          // Update user statistics
          if (stats) {
            // Calculate bonus points (10 per streak day)
            const bonusPoints = Math.min(newStreak * 10, 50);
            const totalPoints = pointsToAdd + (challenge.completed ? 0 : bonusPoints);
            
            await updateStat('points', stats.points + totalPoints);
            await incrementStat('daily_challenges_completed', 1);
          }

          toast({
            title: completed && !challenge.completed ? "Desafio concluído! 🎉" : "Progresso registrado!",
            description: completed && !challenge.completed 
              ? `Você ganhou ${challenge.points} pontos!` 
              : `Progresso: ${newProgress}/${challenge.goal}`,
          });
        }
      }
      
      // Redirect to appropriate tool
      redirectToTool(challenge.type);
      
    } catch (error: any) {
      toast({
        title: "Erro ao completar desafio",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to redirect to the appropriate tool based on challenge type
  const redirectToTool = (challengeType: string) => {
    switch(challengeType) {
      case "follow_users":
        navigate("/connect-earn");
        break;
      case "analyze_profile":
        navigate("/profile-analysis");
        break;
      case "generate_ideas":
        navigate("/video-ideas");
        break;
      case "find_hashtags":
        navigate("/hashtag-generator");
        break;
      default:
        // Stay on current page if no matching tool
        break;
    }
  };

  return { completeStep, loading, redirectToTool };
};

export default useDailyChallenge;
