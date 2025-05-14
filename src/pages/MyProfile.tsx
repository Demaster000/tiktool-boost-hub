
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats } from "@/hooks/useUserStats";
import useSubscription from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Award, ChevronRight, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const MyProfile = () => {
  const { user, isPremium } = useAuth();
  const { stats, loading: statsLoading } = useUserStats();
  const { status: subscriptionStatus, loading: subscriptionLoading } = useSubscription();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Function to manually refresh user stats
  const refreshUserStats = async () => {
    if (!user) return;
    
    setRefreshingStats(true);
    
    try {
      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      
      toast({
        title: "Dados atualizados",
        description: "Suas estatísticas foram atualizadas com sucesso.",
      });
    } catch (err) {
      console.error("Error refreshing user stats:", err);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar seus dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setRefreshingStats(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setIsLoadingPortal(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL do portal não recebida");
      }
      
    } catch (error) {
      console.error("Erro ao abrir portal do cliente:", error);
      toast({
        title: "Erro no processamento",
        description: "Não foi possível abrir o portal de gerenciamento. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;
    
    setIsLoadingPortal(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          mode: 'subscription'
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não recebida");
      }
      
    } catch (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      toast({
        title: "Erro no processamento",
        description: "Não foi possível processar sua solicitação. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
            <p className="text-muted-foreground">Informações da sua conta e assinatura</p>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={refreshUserStats}
            disabled={refreshingStats || !user}
          >
            <RefreshCcw className={`h-5 w-5 ${refreshingStats ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>Detalhes da sua conta TikTool</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">E-mail</h3>
                {user ? (
                  <p className="font-medium">{user.email}</p>
                ) : (
                  <Skeleton className="h-6 w-48" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">ID da conta</h3>
                {user ? (
                  <p className="font-medium text-xs md:text-sm">{user.id}</p>
                ) : (
                  <Skeleton className="h-6 w-48" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Information */}
        <Card className={isPremium ? "border-tiktool-teal/30 bg-gradient-to-r from-tiktool-teal/5 to-transparent" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {isPremium && <Award className="text-amber-400 h-5 w-5" />}
                  Assinatura
                </CardTitle>
                <CardDescription>Status da sua assinatura e detalhes do plano</CardDescription>
              </div>
              {isPremium && (
                <div className="px-3 py-1 bg-tiktool-teal/20 text-tiktool-teal rounded-full text-xs font-medium">
                  Premium
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subscription Status */}
            {subscriptionLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-2">
                  {isPremium ? "Plano Premium" : "Plano Gratuito"}
                </h3>
                
                {isPremium ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="text-tiktool-teal h-5 w-5 mt-0.5" />
                      <span>Ganhe pontos sem limite diário</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="text-tiktool-teal h-5 w-5 mt-0.5" />
                      <span>Seu perfil é exibido com prioridade</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="text-tiktool-teal h-5 w-5 mt-0.5" />
                      <span>Bônus de 200 pontos ao assinar</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="text-tiktool-teal h-5 w-5 mt-0.5" />
                      <span>Sem anúncios</span>
                    </div>

                    {subscriptionStatus.subscription_end && (
                      <div className="mt-4 p-3 bg-background rounded-md">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Válido até: </span>
                          <span className="font-medium">{formatDate(subscriptionStatus.subscription_end)}</span>
                        </p>
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      className="mt-4 border-tiktool-teal text-tiktool-teal hover:bg-tiktool-teal/10"
                      onClick={handleManageSubscription}
                      disabled={isLoadingPortal}
                    >
                      {isLoadingPortal ? "Carregando..." : "Gerenciar Assinatura"}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Você está usando o plano gratuito com funcionalidades limitadas.
                      Atualize para o plano Premium para desbloquear todos os recursos.
                    </p>
                    <Button 
                      className="bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90"
                      onClick={handleSubscribe}
                      disabled={isLoadingPortal}
                    >
                      {isLoadingPortal ? "Carregando..." : "Assinar Premium"}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-border my-4"></div>

            {/* Points Balance */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Seu saldo de pontos</h3>
              {statsLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">{stats.points}</span>
                  <span className="text-muted-foreground ml-2">pontos</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Uso</CardTitle>
            <CardDescription>Resumo das suas atividades na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Seguidores ganhos</h3>
                  <p className="text-2xl font-bold">{stats.followers_gained}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Ideias geradas</h3>
                  <p className="text-2xl font-bold">{stats.ideas_generated}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Análises completadas</h3>
                  <p className="text-2xl font-bold">{stats.analyses_completed}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Vídeos compartilhados</h3>
                  <p className="text-2xl font-bold">{stats.videos_shared || 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MyProfile;
