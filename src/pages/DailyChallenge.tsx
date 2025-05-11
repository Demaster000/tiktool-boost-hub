
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useUserStats } from "@/hooks/useUserStats";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Trophy, Award, Star } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  goal: number;
  points: number;
  progress?: number; // Current user progress
  completed?: boolean;
}

interface UserBadge {
  id: string;
  badge_id: string;
  user_id: string;
  achieved_at: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  achieved?: boolean;
}

const DailyChallenge = () => {
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);
  const [streakInfo, setStreakInfo] = useState({ 
    currentStreak: 0, 
    lastCompleted: null, 
    pointsToday: 0,
    pointsLimit: 50,
    bonusPoints: 0
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  
  const { user } = useAuth();
  const { stats, updateStat } = useUserStats();

  // Fetch daily challenges
  const fetchChallenges = async () => {
    if (!user) return;
    
    try {
      // Get today's challenges
      const { data: challenges, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('active', true)
        .limit(5) as { data: Challenge[] | null, error: any };

      if (challengeError) {
        console.error("Error fetching challenges:", challengeError);
        return;
      }
      
      if (!challenges) return;
      
      // Get user progress for these challenges
      const { data: userProgress, error: progressError } = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date().toISOString().split('T')[0]) as { 
          data: { challenge_id: string; progress: number; completed: boolean }[] | null, 
          error: any 
        };

      if (progressError) {
        console.error("Error fetching user progress:", progressError);
      }
        
      // Merge progress with challenges
      const mergedChallenges = challenges.map(challenge => {
        const progress = userProgress?.find(p => p.challenge_id === challenge.id);
        return {
          ...challenge,
          progress: progress?.progress || 0,
          completed: progress?.completed || false
        };
      });
      
      setDailyChallenges(mergedChallenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    }
  };

  // Fetch user streak info
  const fetchStreakInfo = async () => {
    if (!user) return;
    
    try {
      const { data: streak, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single() as { 
          data: { 
            current_streak: number; 
            last_completed_at: string | null;
            points_today: number;
          } | null, 
          error: any 
        };
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No streak found, initialize new user streak
          const { error: insertError } = await supabase
            .from('user_streaks')
            .insert({
              user_id: user.id,
              current_streak: 0,
              last_completed_at: null,
              points_today: 0
            });
          
          if (insertError) {
            console.error("Error initializing streak:", insertError);
          } else {
            setStreakInfo({
              currentStreak: 0,
              lastCompleted: null,
              pointsToday: 0,
              pointsLimit: 50,
              bonusPoints: 0
            });
          }
        } else {
          console.error("Error fetching streak:", error);
        }
        return;
      }
      
      if (streak) {
        // Calculate bonus points (10 per streak day)
        const bonusPoints = Math.min(streak.current_streak * 10, 50);
        
        setStreakInfo({
          currentStreak: streak.current_streak,
          lastCompleted: streak.last_completed_at,
          pointsToday: streak.points_today || 0,
          pointsLimit: 50,
          bonusPoints
        });
        
        // Check if daily limit reached
        setDailyLimitReached(streak.points_today >= 50);
      }
    } catch (error) {
      console.error("Error fetching streak info:", error);
    }
  };

  // Fetch badges
  const fetchBadges = async () => {
    if (!user) return;
    
    try {
      // Get all available badges
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*') as { data: Badge[] | null, error: any };
      
      if (badgesError) {
        console.error("Error fetching badges:", badgesError);
        return;
      }
      
      if (!allBadges) return;
      
      // Get user badges
      const { data: achieved, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id) as { 
          data: UserBadge[] | null, 
          error: any 
        };

      if (userBadgesError) {
        console.error("Error fetching user badges:", userBadgesError);
      }
      
      setUserBadges(achieved || []);
      
      // Mark which badges the user has achieved
      const mergedBadges = allBadges.map(badge => ({
        ...badge,
        achieved: achieved?.some(userBadge => userBadge.badge_id === badge.id)
      }));
      
      setBadges(mergedBadges);
    } catch (error) {
      console.error("Error fetching badges:", error);
    }
  };

  // Complete a challenge step
  const completeStep = async (challenge: Challenge) => {
    if (!user || dailyLimitReached) return;
    
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
        .single() as { 
          data: { id: string } | null, 
          error: any 
        };
      
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
          .single() as { 
            data: { 
              current_streak: number; 
              last_completed_at: string | null;
              points_today: number;
            } | null, 
            error: any 
          };
        
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
          }
          
          // Update local state
          setStreakInfo(prev => ({
            ...prev,
            currentStreak: newStreak,
            lastCompleted: new Date().toISOString(),
            pointsToday: newPointsToday,
            bonusPoints: Math.min(newStreak * 10, 50)
          }));
          
          // Check if we've reached daily limit
          if (newPointsToday >= 50) {
            setDailyLimitReached(true);
            toast({
              title: "Limite diário alcançado! 🎉",
              description: "Volte amanhã para mais desafios e pontos!",
            });
          }
          
          // Check for badges
          await checkForBadges(newStreak);
        }
      }
      
      // Update challenges
      await fetchChallenges();
      
      toast({
        title: completed && !challenge.completed ? "Desafio concluído! 🎉" : "Progresso registrado!",
        description: completed && !challenge.completed 
          ? `Você ganhou ${challenge.points} pontos!` 
          : `Progresso: ${newProgress}/${challenge.goal}`,
      });
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

  // Check for new badges
  const checkForBadges = async (streakCount: number) => {
    if (!user) return;
    
    try {
      // Check for streak badges
      if (streakCount >= 3) {
        await awardBadgeIfNotEarned('streak_3');
      }
      
      if (streakCount >= 7) {
        await awardBadgeIfNotEarned('streak_7');
      }
      
      if (streakCount >= 30) {
        await awardBadgeIfNotEarned('streak_30');
      }
      
      // Refresh badges display
      await fetchBadges();
    } catch (error) {
      console.error("Error checking badges:", error);
    }
  };

  // Award a badge if not already earned
  const awardBadgeIfNotEarned = async (badgeCode: string) => {
    if (!user) return;
    
    try {
      // Get the badge ID
      const { data: badge, error: badgeError } = await supabase
        .from('badges')
        .select('id')
        .eq('code', badgeCode)
        .single() as { data: { id: string } | null, error: any };
      
      if (badgeError) {
        console.error("Error finding badge:", badgeError);
        return;
      }
      
      if (!badge) return;
      
      // Check if user already has this badge
      const { data: existingBadge, error: existingBadgeError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .eq('badge_id', badge.id)
        .single() as { data: UserBadge | null, error: any };
      
      if (existingBadgeError && existingBadgeError.code !== 'PGRST116') {
        console.error("Error checking existing badge:", existingBadgeError);
        return;
      }
      
      if (existingBadge) return;
      
      // Award the badge
      const { error: awardError } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_id: badge.id
        });
      
      if (awardError) {
        console.error("Error awarding badge:", awardError);
        return;
      }
      
      // Show toast notification
      toast({
        title: "Nova conquista desbloqueada! 🏆",
        description: "Verifique suas conquistas para ver o novo badge!",
      });
    } catch (error) {
      console.error("Error awarding badge:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChallenges();
      fetchStreakInfo();
      fetchBadges();
    }
  }, [user]);

  const renderChallengeCard = (challenge: Challenge) => {
    const progress = challenge.progress || 0;
    const progressPercent = (progress / challenge.goal) * 100;
    const isComplete = challenge.completed || progress >= challenge.goal;
    
    return (
      <Card key={challenge.id} className={`bg-tiktool-gray border-tiktool-gray/50 mb-4 ${isComplete ? 'border-tiktool-teal/50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{challenge.title}</CardTitle>
            {isComplete && (
              <Badge className="bg-tiktool-teal">Concluído</Badge>
            )}
          </div>
          <CardDescription>{challenge.description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{progress}/{challenge.goal}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm">
            <span className="text-tiktool-pink">+{challenge.points} pontos</span>
          </div>
          <Button
            disabled={loading || isComplete || dailyLimitReached}
            onClick={() => completeStep(challenge)}
            size="sm"
            className={isComplete ? "bg-tiktool-dark" : "bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90"}
          >
            {isComplete ? (
              <Check className="mr-1 h-4 w-4" />
            ) : null}
            {isComplete ? "Concluído" : "Avançar"}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderBadge = (badge: Badge) => {
    let icon;
    switch (badge.icon) {
      case "fire": icon = <span className="text-2xl">🔥</span>; break;
      case "star": icon = <span className="text-2xl">🌟</span>; break;
      case "crown": icon = <span className="text-2xl">👑</span>; break;
      case "muscle": icon = <span className="text-2xl">💪</span>; break;
      default: icon = <Star className="h-6 w-6 text-tiktool-pink" />;
    }
    
    return (
      <Card key={badge.id} className={`bg-tiktool-gray border-tiktool-gray/50 ${badge.achieved ? 'border-tiktool-teal/50' : ''}`}>
        <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
          <div className={`mb-2 ${badge.achieved ? '' : 'opacity-30'}`}>
            {icon}
          </div>
          <h3 className="font-semibold">{badge.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
          
          {badge.achieved ? (
            <Badge className="mt-3 bg-tiktool-teal">Conquistada</Badge>
          ) : (
            <Badge variant="outline" className="mt-3">Em progresso</Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Desafio Diário Tiktool</h1>
          <p className="text-muted-foreground">Complete desafios diários para ganhar pontos e badges</p>
        </div>
        
        <Card className="bg-tiktool-gray border-tiktool-gray/50">
          <CardHeader>
            <CardTitle>Seu Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-tiktool-dark border-tiktool-gray/50">
                <CardContent className="pt-6 pb-6 flex flex-col items-center">
                  <div className="text-tiktool-pink text-4xl font-bold">{streakInfo.currentStreak}</div>
                  <p className="text-muted-foreground">Dias consecutivos</p>
                </CardContent>
              </Card>
              
              <Card className="bg-tiktool-dark border-tiktool-gray/50">
                <CardContent className="pt-6 pb-6 flex flex-col items-center">
                  <div className="flex items-end">
                    <span className="text-4xl font-bold">{streakInfo.pointsToday}</span>
                    <span className="text-muted-foreground ml-1">/ {streakInfo.pointsLimit}</span>
                  </div>
                  <p className="text-muted-foreground">Pontos hoje</p>
                </CardContent>
              </Card>
              
              <Card className="bg-tiktool-dark border-tiktool-gray/50">
                <CardContent className="pt-6 pb-6 flex flex-col items-center">
                  <div className="text-tiktool-teal text-4xl font-bold">+{streakInfo.bonusPoints}</div>
                  <p className="text-muted-foreground">Bônus de sequência</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <Progress value={(streakInfo.pointsToday / streakInfo.pointsLimit) * 100} className="h-2" />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>0 pts</span>
                <span>Limite diário: {streakInfo.pointsLimit} pts</span>
              </div>
            </div>
            
            {dailyLimitReached && (
              <div className="mt-6 p-4 bg-tiktool-dark rounded-md text-center">
                <h3 className="font-semibold">Limite diário alcançado! 🎉</h3>
                <p className="text-sm text-muted-foreground mt-1">Volte amanhã para mais desafios e pontos!</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Desafios de Hoje</h2>
            {dailyChallenges.length > 0 ? (
              dailyChallenges.map(renderChallengeCard)
            ) : (
              <Card className="bg-tiktool-dark border-tiktool-gray/50 p-8 text-center">
                <p>Nenhum desafio disponível hoje. Volte mais tarde!</p>
              </Card>
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="text-tiktool-pink" />
              <h2 className="text-xl font-semibold">Suas Conquistas</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {badges.map(renderBadge)}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DailyChallenge;
