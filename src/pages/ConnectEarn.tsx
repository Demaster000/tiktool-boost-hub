
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, CheckCircle, UserPlus, X, ExternalLink, RefreshCw } from "lucide-react";
import { useUserStats } from "@/hooks/useUserStats";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface Profile {
  id: string;
  username: string;
  followers: number;
  active: boolean;
  followed?: boolean;
}

const ConnectEarn = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [followedProfiles, setFollowedProfiles] = useState<number[]>([]);
  const { stats, incrementStat, updateStat } = useUserStats();
  const { user } = useAuth();

  const fetchProfiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First get list of profiles this user has already followed
      const { data: alreadyFollowed, error: followedError } = await supabase
        .from('user_followed_profiles')
        .select('profile_id')
        .eq('user_id', user.id);
      
      if (followedError) {
        console.error("Error fetching followed profiles:", followedError);
      }
      
      // Convert to array of IDs
      const followedIds = alreadyFollowed?.map(p => p.profile_id) || [];
      setFollowedProfiles(followedIds);
      
      // Then fetch active profiles, excluding ones already followed
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('active', true);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Only include profiles that haven't been followed yet
        const filteredProfiles = data
          .filter(profile => !followedIds.includes(parseInt(profile.id)))
          .map(profile => ({
            ...profile,
            id: profile.id,
            followed: false
          }));
        
        setProfiles(filteredProfiles);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar perfis",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const handleFollow = async (profileId: string) => {
    if (!user) return;
    
    try {
      // Mark profile as followed in UI
      setProfiles(currentProfiles =>
        currentProfiles.map(profile =>
          profile.id === profileId ? { ...profile, followed: true } : profile
        )
      );

      const numericProfileId = parseInt(profileId);
      
      // Store the follow record in the database
      const { error } = await supabase
        .from('user_followed_profiles')
        .insert({
          user_id: user.id,
          profile_id: numericProfileId,
        });

      if (error) {
        console.error("Error recording follow:", error);
        throw error;
      }

      // Add to local followed profiles list
      setFollowedProfiles(prev => [...prev, numericProfileId]);
      
      // Update user stats
      if (stats) {
        await incrementStat('followers_gained', 1);
        await updateStat('points', stats.points + 2);
      }
      
      // Check for challenge update - find challenge for following users
      const { data: challenge, error: challengeError } = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', '1') // Challenge ID for following users
        .gte('created_at', new Date().toISOString().split('T')[0])
        .single();
      
      if (!challengeError) {
        // Challenge exists, update progress
        const newProgress = (challenge.progress || 0) + 1;
        const completed = newProgress >= 30; // Goal is 30 follows
        
        await supabase
          .from('challenge_progress')
          .update({ 
            progress: newProgress,
            completed
          })
          .eq('id', challenge.id);
        
        if (completed && !challenge.completed) {
          toast({
            title: "Desafio concluído! 🎉",
            description: "Você completou o desafio de seguir 30 pessoas!"
          });
        }
      } else if (challengeError.code === 'PGRST116') {
        // Challenge doesn't exist yet, create it
        await supabase
          .from('challenge_progress')
          .insert({
            user_id: user.id,
            challenge_id: '1',
            progress: 1,
            completed: false
          });
      }
      
      toast({
        title: "Perfil seguido com sucesso!",
        description: "Você ganhou +2 pontos"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao seguir perfil",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const openTikTokProfile = (username: string) => {
    window.open(`https://tiktok.com/@${username}`, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Conecte e Ganhe</h1>
          <p className="text-muted-foreground">
            Siga outros usuários para ganhar pontos e crescer na plataforma
          </p>
        </div>

        <Card className="bg-tiktool-gray border-tiktool-gray/50">
          <CardHeader className="pb-3">
            <CardTitle>Como Funciona</CardTitle>
            <CardDescription>
              1. Siga outros usuários para ganhar pontos e aumentar sua visibilidade
              <br />
              2. Para cada perfil que você seguir, você ganha 2 pontos
              <br />
              3. Quanto mais pessoas você seguir, mais pessoas verão seu perfil
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-tiktool-dark">
                  +2 pontos por seguidor
                </Badge>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchProfiles}
                disabled={loading}
                title="Atualizar lista de perfis"
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </Button>
            </div>

            {followedProfiles.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progresso do desafio diário</span>
                  <span>{followedProfiles.length}/30 perfis seguidos</span>
                </div>
                <Progress value={(followedProfiles.length / 30) * 100} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.length === 0 && !loading ? (
            <div className="col-span-full">
              <Card className="bg-tiktool-dark border-tiktool-gray/50 p-8 flex flex-col items-center justify-center text-center">
                <UserPlus className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum novo perfil disponível</h3>
                <p className="text-muted-foreground mt-2">
                  Você já seguiu todos os perfis disponíveis. Volte mais tarde para mais sugestões.
                </p>
              </Card>
            </div>
          ) : (
            profiles.map((profile) => (
              <Card 
                key={profile.id} 
                className={`bg-tiktool-gray border-tiktool-gray/50 ${
                  profile.followed ? 'opacity-75' : ''
                }`}
              >
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={`https://source.boringavatars.com/beam/120/${profile.username}?colors=ff0676,ff5b98,ff43c5,ff5dff,cea2fd`} />
                    <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{profile.username}</CardTitle>
                    <div className="flex items-center gap-1 text-xs">
                      <Heart className="h-3 w-3 text-tiktool-pink" />
                      <span>{profile.followers} seguidores</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardFooter className="pt-4 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTikTokProfile(profile.username)}
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver Perfil
                  </Button>
                  
                  <Button
                    variant={profile.followed ? "outline" : "default"}
                    size="sm"
                    disabled={profile.followed}
                    onClick={() => handleFollow(profile.id)}
                    className={
                      profile.followed 
                        ? "bg-tiktool-dark flex items-center gap-1" 
                        : "bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90 flex items-center gap-1"
                    }
                  >
                    {profile.followed ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Seguindo
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Seguir
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
          
          {loading && (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-tiktool-gray border-tiktool-gray/50 opacity-50 animate-pulse">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="h-14 w-14 rounded-full bg-tiktool-dark" />
                    <div>
                      <div className="h-5 w-24 bg-tiktool-dark rounded mb-2" />
                      <div className="h-3 w-16 bg-tiktool-dark rounded" />
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-4 flex justify-between">
                    <div className="h-9 w-24 bg-tiktool-dark rounded" />
                    <div className="h-9 w-24 bg-tiktool-dark rounded" />
                  </CardFooter>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ConnectEarn;
