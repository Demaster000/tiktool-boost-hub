
import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import FeatureCard from "@/components/FeatureCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hash, TrendingUp, User, Video, ThumbsUp, Award } from "lucide-react";
import { useUserStats } from "@/hooks/useUserStats";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { stats, loading } = useUserStats();
  const { user } = useAuth();

  // Ensure user statistics table has all required fields
  useEffect(() => {
    if (user) {
      // Check if user statistics exist and update if needed
      const checkUserStats = async () => {
        try {
          const { data, error } = await supabase
            .from('user_statistics')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (error) {
            if (error.code === 'PGRST116') {
              // No records found, create initial stats
              await supabase.from('user_statistics').insert({
                user_id: user.id,
                points: 10,
                followers_gained: 0,
                ideas_generated: 0,
                analyses_completed: 0,
                videos_shared: 0,
                daily_challenges_completed: 0
              });
            } else {
              console.error("Error checking user stats:", error);
            }
          } else if (data) {
            // Make sure all fields exist
            const updates: any = {};
            let needsUpdate = false;
            
            if (data.videos_shared === undefined || data.videos_shared === null) {
              updates.videos_shared = 0;
              needsUpdate = true;
            }
            
            if (data.daily_challenges_completed === undefined || data.daily_challenges_completed === null) {
              updates.daily_challenges_completed = 0;
              needsUpdate = true;
            }
            
            if (needsUpdate) {
              await supabase
                .from('user_statistics')
                .update(updates)
                .eq('user_id', user.id);
            }
          }
        } catch (err) {
          console.error("Error handling user stats:", err);
        }
      };
      
      checkUserStats();
    }
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bem-vindo ao TikTool{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}</h1>
          <p className="text-muted-foreground">Escolha uma ferramenta para começar</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Conecte e Ganhe" 
            description="Troque seguidores com outros usuários e cresça sua audiência."
            icon={<User className="text-tiktool-pink" />}
            to="/connect-earn"
            gradient="pink"
          />
          
          <FeatureCard 
            title="Ideias para Vídeo" 
            description="Receba sugestões para seus próximos vídeos baseadas em tendências."
            icon={<Video className="text-tiktool-teal" />}
            to="/video-ideas"
            gradient="teal"
          />
          
          <FeatureCard 
            title="Gerador de Hashtags" 
            description="Encontre as melhores hashtags para aumentar o alcance dos seus vídeos."
            icon={<Hash className="text-white" />}
            to="/hashtag-generator"
            gradient="mixed"
          />
          
          <FeatureCard 
            title="Análise de Perfil" 
            description="Obtenha insights detalhados sobre seu perfil e dicas personalizadas."
            icon={<TrendingUp className="text-white" />}
            to="/profile-analysis"
            gradient="mixed"
          />
          
          <FeatureCard 
            title="Ganhe Likes e Views" 
            description="Compartilhe seus vídeos e receba curtidas e visualizações da comunidade."
            icon={<ThumbsUp className="text-tiktool-pink" />}
            to="/likes-views"
            gradient="pink"
          />
          
          <FeatureCard 
            title="Desafio Diário" 
            description="Complete desafios diários para ganhar pontos e conquistar badges."
            icon={<Award className="text-tiktool-teal" />}
            to="/daily-challenge"
            gradient="teal"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-tiktool-gray border-tiktool-gray/50">
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
              <CardDescription>Visão geral da sua atividade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-tiktool-dark p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Saldo de Pontos</p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : stats?.points || 0}
                  </p>
                </div>
                <div className="bg-tiktool-dark p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Seguidores Ganhos</p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : stats?.followers_gained || 0}
                  </p>
                </div>
                <div className="bg-tiktool-dark p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Ideias Geradas</p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : stats?.ideas_generated || 0}
                  </p>
                </div>
                <div className="bg-tiktool-dark p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Análises Feitas</p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : stats?.analyses_completed || 0}
                  </p>
                </div>
                <div className="bg-tiktool-dark p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Vídeos Compartilhados</p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : stats?.videos_shared || 0}
                  </p>
                </div>
                <div className="bg-tiktool-dark p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Desafios Completos</p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : stats?.daily_challenges_completed || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-tiktool-gray border-tiktool-gray/50">
            <CardHeader>
              <CardTitle>Dicas Rápidas</CardTitle>
              <CardDescription>Melhore sua presença no TikTok</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="bg-tiktool-dark p-4 rounded-md">
                  <p className="text-sm">Poste consistentemente para aumentar seu alcance.</p>
                </li>
                <li className="bg-tiktool-dark p-4 rounded-md">
                  <p className="text-sm">Use hashtags relevantes para aumentar a descoberta.</p>
                </li>
                <li className="bg-tiktool-dark p-4 rounded-md">
                  <p className="text-sm">Interaja com outros criadores para expandir sua rede.</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
