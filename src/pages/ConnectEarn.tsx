
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, UserCheck, UserMinus, Pause, AlertCircle, CheckCircle, Star, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats } from "@/hooks/useUserStats";
import SuccessMessage from "@/components/SuccessMessage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import useSubscription from "@/hooks/useSubscription";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ConnectEarn = () => {
  const { user } = useAuth();
  const { stats, updateStat } = useUserStats();
  const { status: subscriptionStatus, loading: subscriptionLoading } = useSubscription();
  const [profileUsername, setProfileUsername] = useState("");
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [isProfileActive, setIsProfileActive] = useState(false);
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState<number | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState(100);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: "", message: "" });
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [adPopupTimer, setAdPopupTimer] = useState(10);
  const [showPointsPopover, setShowPointsPopover] = useState(false);
  const { toast } = useToast();
  
  // Fetch user premium status and daily points earned
  useEffect(() => {
    if (user) {
      setIsPremium(subscriptionStatus.subscribed || false);
    }
  }, [user, subscriptionStatus]);

  // Show ad popup for free users after 60 seconds
  useEffect(() => {
    if (!isPremium && !showAdPopup) {
      const timer = setTimeout(() => {
        setShowAdPopup(true);
      }, 60000); // Show after 60 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isPremium, showAdPopup]);

  // Ad popup countdown timer
  useEffect(() => {
    if (showAdPopup && adPopupTimer > 0) {
      const timer = setTimeout(() => {
        setAdPopupTimer(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (showAdPopup && adPopupTimer === 0) {
      setShowAdPopup(false);
      setAdPopupTimer(10);
    }
  }, [showAdPopup, adPopupTimer]);

  // Verify if there is already an active profile
  useEffect(() => {
    const savedProfile = localStorage.getItem("activeProfile");
    if (savedProfile) {
      setActiveProfile(savedProfile);
      setIsProfileActive(true);
    }
  }, []);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

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
    if (!isPremium && subscriptionStatus.points_earned_today && subscriptionStatus.points_earned_today >= 30) {
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
      
      {/* Ad Popup for Free Users */}
      <Dialog open={showAdPopup} onOpenChange={setShowAdPopup}>
        <DialogContent className="bg-gradient-to-br from-tiktool-dark to-tiktool-gray border-tiktool-teal/30">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Award className="text-amber-400" />
              <span>Potencialize seu crescimento no TikTok!</span>
            </DialogTitle>
            <DialogDescription>
              Assine o plano Premium e tenha acesso ilimitado a todas as ferramentas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-black/30 rounded-md">
              <p className="mb-2 font-medium">Com o plano Premium você tem:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-tiktool-teal h-4 w-4" />
                  <span>Ganho ilimitado de pontos diários</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-tiktool-teal h-4 w-4" />
                  <span>Prioridade na exibição do seu perfil</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-tiktool-teal h-4 w-4" />
                  <span>Bônus de 200 pontos ao assinar</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-tiktool-teal h-4 w-4" />
                  <span>Sem anúncios como este</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Este anúncio fechará em {adPopupTimer} segundos
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAdPopup(false)}>
                  Fechar
                </Button>
                <Button 
                  className="bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90"
                  onClick={() => {
                    setShowAdPopup(false);
                    handleSubscribe();
                  }}
                >
                  Assinar Premium
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
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
            <div className="space-y-2">
              <p className="text-sm">Você não possui limite diário para ganhar pontos e seu perfil tem prioridade na exibição.</p>
              {subscriptionStatus.subscription_end && (
                <p className="text-sm">Seu plano Premium é válido até <span className="font-medium">{formatDate(subscriptionStatus.subscription_end)}</span></p>
              )}
            </div>
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
          <Card className="bg-gradient-to-r from-tiktool-pink/10 to-tiktool-teal/10 border-tiktool-teal/20 relative overflow-hidden">
            <div className="absolute -right-4 top-0 rotate-45 transform translate-y-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs py-1 px-8 font-semibold">
              Recomendado
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="text-amber-400 h-5 w-5" />
                Assine o Plano Premium
              </CardTitle>
              <CardDescription>Por apenas R$ 29,90/mês com 7 dias de teste grátis</CardDescription>
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
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-tiktool-teal h-5 w-5" />
                  <span>Sem anúncios</span>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90" 
                  onClick={handleSubscribe}
                  disabled={isLoadingCheckout}
                >
                  {isLoadingCheckout ? "Processando..." : "Começar teste grátis de 7 dias"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Cancele a qualquer momento durante o período de teste sem custos
                </p>
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
              
              {!isPremium && subscriptionStatus.points_earned_today !== undefined && (
                <div className="mt-2 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-amber-400 h-4 w-4" />
                    <span>
                      {subscriptionStatus.points_earned_today}/30 pontos ganhos hoje
                      {subscriptionStatus.points_earned_today >= 30 && " (limite atingido)"}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Popover open={showPointsPopover} onOpenChange={setShowPointsPopover}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Escolher quantidade
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-4 bg-tiktool-gray border-tiktool-gray/50">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Selecione a quantidade</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant={pointsToAdd === 100 ? "default" : "outline"}
                          className={pointsToAdd === 100 ? "bg-tiktool-pink hover:bg-tiktool-pink/80" : ""} 
                          onClick={() => setPointsToAdd(100)}
                        >
                          100 pontos
                        </Button>
                        <Button 
                          variant={pointsToAdd === 300 ? "default" : "outline"}
                          className={pointsToAdd === 300 ? "bg-tiktool-teal hover:bg-tiktool-teal/80" : ""} 
                          onClick={() => setPointsToAdd(300)}
                        >
                          300 pontos
                        </Button>
                        <Button 
                          variant={pointsToAdd === 500 ? "default" : "outline"}
                          className={pointsToAdd === 500 ? "bg-tiktool-pink hover:bg-tiktool-pink/80" : ""} 
                          onClick={() => setPointsToAdd(500)}
                        >
                          500 pontos
                        </Button>
                        <Button 
                          variant={pointsToAdd === 1000 ? "default" : "outline"}
                          className={pointsToAdd === 1000 ? "bg-tiktool-teal hover:bg-tiktool-teal/80" : ""}
                          onClick={() => setPointsToAdd(1000)}
                        >
                          1000 pontos
                        </Button>
                      </div>
                    </div>
                    <div className="pt-2 text-center border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        {pointsToAdd === 100 && "R$ 19,90"}
                        {pointsToAdd === 300 && "R$ 49,90"}
                        {pointsToAdd === 500 && "R$ 79,90"}
                        {pointsToAdd === 1000 && "R$ 149,90"}
                      </span>
                    </div>
                    <Button 
                      className="w-full bg-tiktool-pink hover:bg-tiktool-pink/80"
                      onClick={() => {
                        setShowPointsPopover(false);
                        handleBuyPoints();
                      }}
                    >
                      Confirmar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button 
                onClick={handleBuyPoints} 
                className="bg-tiktool-pink hover:bg-tiktool-pink/80 w-full sm:w-auto"
                disabled={isLoadingCheckout}
              >
                {isLoadingCheckout ? "Processando..." : `Comprar ${pointsToAdd} Pontos`}
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
