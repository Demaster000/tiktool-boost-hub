
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, UserCheck, UserMinus, Pause, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats } from "@/hooks/useUserStats";
import SuccessMessage from "@/components/SuccessMessage";

const ConnectEarn = () => {
  const { user } = useAuth();
  const { stats, updateStat } = useUserStats();
  const [profileUsername, setProfileUsername] = useState("");
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [isProfileActive, setIsProfileActive] = useState(false);
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState<number | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const [dailyPointsEarned, setDailyPointsEarned] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState(100);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: "", message: "" });
  const { toast } = useToast();
  
  // Fetch user premium status and daily points earned
  useEffect(() => {
    if (user) {
      const checkSubscriptionStatus = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('check-subscription');
          
          if (error) throw error;
          
          if (data) {
            setIsPremium(data.subscribed || false);
            setDailyPointsEarned(data.points_earned_today || 0);
          }
        } catch (error) {
          console.error("Error fetching subscription status:", error);
        }
      };
      
      checkSubscriptionStatus();
    }
  }, [user]);

  // Verify if there is already an active profile
  useEffect(() => {
    const savedProfile = localStorage.getItem("activeProfile");
    if (savedProfile) {
      setActiveProfile(savedProfile);
      setIsProfileActive(true);
    }
  }, []);

  const handleRegisterProfile = () => {
    if (!profileUsername) {
      toast({
        title: "Nome de usuário obrigatório",
        description: "Por favor, insira seu nome de usuário do TikTok",
        variant: "destructive",
      });
      return;
    }

    setActiveProfile(profileUsername);
    setIsProfileActive(true);
    localStorage.setItem("activeProfile", profileUsername);
    
    setSuccessMessage({
      title: "Perfil registrado com sucesso",
      message: "Seu perfil foi adicionado à lista para receber seguidores."
    });
    setShowSuccessMessage(true);
    
    setProfileUsername("");
  };

  const handlePauseProfile = () => {
    setIsProfileActive(false);
    
    setSuccessMessage({
      title: "Perfil pausado",
      message: "Seu perfil não receberá mais seguidores até que você o ative novamente."
    });
    setShowSuccessMessage(true);
  };

  const handleResumeProfile = () => {
    setIsProfileActive(true);
    
    setSuccessMessage({
      title: "Perfil reativado",
      message: "Seu perfil voltou a receber seguidores."
    });
    setShowSuccessMessage(true);
  };

  const handleRemoveProfile = () => {
    setActiveProfile(null);
    setIsProfileActive(false);
    localStorage.removeItem("activeProfile");
    
    setSuccessMessage({
      title: "Perfil removido",
      message: "Seu perfil foi removido da lista de seguidores."
    });
    setShowSuccessMessage(true);
  };

  const handleFollow = (profileId: number) => {
    // Check daily points limit for non-premium users
    if (!isPremium && dailyPointsEarned >= 30) {
      toast({
        title: "Limite diário atingido",
        description: "Você atingiu o limite de 30 pontos diários. Assine o plano Premium para remover esta limitação.",
        variant: "destructive",
      });
      return;
    }

    setIsWaitingConfirmation(profileId);
    
    // Start countdown
    let seconds = 5;
    setCountdownSeconds(seconds);
    
    const interval = setInterval(() => {
      seconds -= 1;
      setCountdownSeconds(seconds);
      
      if (seconds <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    // Simulate opening TikTok in a new window
    window.open("https://www.tiktok.com/", "_blank");
  };

  const handleConfirmFollow = async () => {
    setIsWaitingConfirmation(null);
    
    if (user) {
      // Update points
      await updateStat("points", stats.points + 1);
      
      // Update daily points earned for non-premium users
      if (!isPremium) {
        try {
          await supabase.functions.invoke('check-subscription', {
            body: { updatePointsEarned: true }
          });
          
          setDailyPointsEarned(prev => prev + 1);
        } catch (error) {
          console.error("Error updating daily points:", error);
        }
      }
    }
    
    setSuccessMessage({
      title: "Seguimento confirmado!",
      message: "Você ganhou 1 ponto."
    });
    setShowSuccessMessage(true);
  };

  const handleBuyPoints = async () => {
    if (!user) {
      toast({
        title: "Usuário não autenticado",
        description: "Você precisa estar logado para comprar pontos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingCheckout(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          mode: 'payment',
          points: pointsToAdd
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
      setIsLoadingCheckout(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Usuário não autenticado",
        description: "Você precisa estar logado para assinar o plano Premium.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingCheckout(true);
    
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
      setIsLoadingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setIsLoadingCheckout(true);
    
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
      setIsLoadingCheckout(false);
    }
  };

  return (
    <DashboardLayout>
      {showSuccessMessage && (
        <SuccessMessage 
          title={successMessage.title}
          message={successMessage.message}
          onClose={() => setShowSuccessMessage(false)}
        />
      )}
      
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Conecte e Ganhe</h1>
          <p className="text-muted-foreground">Ganhe seguidores e conecte-se com outros criadores</p>
        </div>
        
        {isPremium && (
          <div className="bg-gradient-to-r from-tiktool-pink/20 to-tiktool-teal/20 p-4 rounded-md border border-tiktool-teal/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-tiktool-teal h-5 w-5" />
              <span className="font-medium">Conta Premium Ativa</span>
            </div>
            <p className="text-sm">Você não possui limite diário para ganhar pontos e seu perfil tem prioridade na exibição.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 text-tiktool-teal border-tiktool-teal hover:bg-tiktool-teal/10"
              onClick={handleManageSubscription}
              disabled={isLoadingCheckout}
            >
              Gerenciar Assinatura
            </Button>
          </div>
        )}
        
        {!isPremium && (
          <Card className="bg-gradient-to-r from-tiktool-pink/10 to-tiktool-teal/10 border-tiktool-teal/20">
            <CardHeader>
              <CardTitle>Assine o Plano Premium</CardTitle>
              <CardDescription>Por apenas R$ 29,90/mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-tiktool-teal h-5 w-5" />
                  <span>Ganhe pontos sem limite diário</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-tiktool-teal h-5 w-5" />
                  <span>Seu perfil será exibido com prioridade</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-tiktool-teal h-5 w-5" />
                  <span>Bônus de 200 pontos ao assinar</span>
                </div>
                <Button 
                  className="w-full bg-tiktool-teal hover:bg-tiktool-teal/80" 
                  onClick={handleSubscribe}
                  disabled={isLoadingCheckout}
                >
                  {isLoadingCheckout ? "Processando..." : "Assinar Premium"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="bg-tiktool-gray border-tiktool-gray/50">
          <CardHeader>
            <CardTitle>Seu Saldo</CardTitle>
            <CardDescription>Use pontos para ganhar seguidores</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-4xl font-bold">{stats.points} pontos</p>
              <p className="text-sm text-muted-foreground">1 ponto = 1 seguidor</p>
              
              {!isPremium && (
                <div className="mt-2 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-amber-400 h-4 w-4" />
                    <span>
                      {dailyPointsEarned}/30 pontos ganhos hoje
                      {dailyPointsEarned >= 30 && " (limite atingido)"}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button 
                onClick={handleBuyPoints} 
                className="bg-tiktool-pink hover:bg-tiktool-pink/80 w-full sm:w-auto"
                disabled={isLoadingCheckout}
              >
                {isLoadingCheckout ? "Processando..." : "Comprar 100 Pontos"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="register">Meu Perfil</TabsTrigger>
            <TabsTrigger value="follow">Seguir Perfis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="register">
            <Card className="bg-tiktool-gray border-tiktool-gray/50">
              <CardHeader>
                <CardTitle>Gerenciar Meu Perfil</CardTitle>
                <CardDescription>Você precisa de pontos para ganhar seguidores</CardDescription>
              </CardHeader>
              <CardContent>
                {activeProfile ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-tiktool-dark rounded-md">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-tiktool-gray flex items-center justify-center">
                            <UserCheck className="text-tiktool-teal" />
                          </div>
                          <div>
                            <div className="flex items-center flex-wrap gap-2">
                              <p className="font-medium">{activeProfile}</p>
                              {isProfileActive ? (
                                <Badge variant="premium">Ativo</Badge>
                              ) : (
                                <Badge className="bg-amber-500 text-white">Pausado</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {isProfileActive ? 'Recebendo seguidores' : 'Não está recebendo seguidores'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 flex-shrink-0">
                          {isProfileActive ? (
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={handlePauseProfile}
                              title="Pausar"
                              className="flex-shrink-0"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={handleResumeProfile}
                              title="Reativar"
                              className="text-tiktool-teal border-tiktool-teal flex-shrink-0"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={handleRemoveProfile}
                            className="text-red-500 hover:text-red-400 border-red-500 hover:border-red-400 flex-shrink-0"
                            title="Remover"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Informações:</h3>
                      <div className="p-4 bg-tiktool-dark rounded-md">
                        <p className="text-sm">Seu perfil está {isProfileActive ? 'ativo' : 'pausado'} e 
                        {isProfileActive ? ' consumirá ' : ' não consumirá '} pontos para receber seguidores.</p>
                        <p className="text-sm mt-2">Você pode pausar ou remover seu perfil a qualquer momento.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Insira seu nome de usuário do TikTok para receber seguidores.
                        Cada seguidor conquistado consumirá 1 ponto do seu saldo.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="@seuusername"
                            value={profileUsername}
                            onChange={(e) => setProfileUsername(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={handleRegisterProfile}
                          disabled={stats.points <= 0}
                          className="sm:flex-shrink-0"
                        >
                          Cadastrar
                        </Button>
                      </div>
                    </div>
                    
                    {stats.points <= 0 && (
                      <div className="bg-tiktool-dark p-4 rounded-md">
                        <p className="text-sm text-amber-400">
                          Você não possui pontos suficientes. Compre pontos ou siga outros perfis para ganhar mais.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="follow">
            <Card className="bg-tiktool-gray border-tiktool-gray/50">
              <CardHeader>
                <CardTitle>Perfis Disponíveis</CardTitle>
                <CardDescription>Siga estes perfis para ganhar pontos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Usuários Premium terão seus perfis exibidos com prioridade */}
                  {isWaitingConfirmation === 999 ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-tiktool-dark rounded-md gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-tiktool-gray flex items-center justify-center">
                          <User className="text-white" />
                        </div>
                        <div>
                          <p className="font-medium">@exemplo</p>
                          <p className="text-sm text-muted-foreground">1000 seguidores</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {countdownSeconds > 0 ? `Aguarde ${countdownSeconds}s` : ""}
                        </span>
                        <Button 
                          onClick={handleConfirmFollow}
                          disabled={countdownSeconds > 0}
                          className="sm:flex-shrink-0"
                        >
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">Não há perfis disponíveis para seguir no momento.</p>
                      <p className="text-sm mt-2">Cadastre seu perfil para começar a receber seguidores.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ConnectEarn;
