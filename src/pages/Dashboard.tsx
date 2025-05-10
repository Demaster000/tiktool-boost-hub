
import DashboardLayout from "@/components/DashboardLayout";
import FeatureCard from "@/components/FeatureCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hash, TrendingUp, User, Video } from "lucide-react";
import { useUserStats } from "@/hooks/useUserStats";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { stats, loading } = useUserStats();
  const { user } = useAuth();

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
