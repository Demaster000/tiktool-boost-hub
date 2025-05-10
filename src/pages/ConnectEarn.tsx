
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, UserCheck, UserMinus, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ConnectEarn = () => {
  const [points, setPoints] = useState(10);
  const [profileUsername, setProfileUsername] = useState("");
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [isProfileActive, setIsProfileActive] = useState(false);
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState<number | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const { toast } = useToast();

  // Verificar se já tem um perfil ativo ao carregar
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
    
    toast({
      title: "Perfil registrado com sucesso",
      description: "Seu perfil foi adicionado à lista para receber seguidores.",
    });
    
    setProfileUsername("");
  };

  const handlePauseProfile = () => {
    setIsProfileActive(false);
    
    toast({
      title: "Perfil pausado",
      description: "Seu perfil não receberá mais seguidores até que você o ative novamente.",
    });
  };

  const handleResumeProfile = () => {
    setIsProfileActive(true);
    
    toast({
      title: "Perfil reativado",
      description: "Seu perfil voltou a receber seguidores.",
    });
  };

  const handleRemoveProfile = () => {
    setActiveProfile(null);
    setIsProfileActive(false);
    localStorage.removeItem("activeProfile");
    
    toast({
      title: "Perfil removido",
      description: "Seu perfil foi removido da lista de seguidores.",
    });
  };

  const handleFollow = (profileId: number) => {
    setIsWaitingConfirmation(profileId);
    
    // Iniciar countdown
    let seconds = 5;
    setCountdownSeconds(seconds);
    
    const interval = setInterval(() => {
      seconds -= 1;
      setCountdownSeconds(seconds);
      
      if (seconds <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    // Simular abertura do TikTok em nova janela
    window.open("https://www.tiktok.com/", "_blank");
  };

  const handleConfirmFollow = () => {
    setIsWaitingConfirmation(null);
    setPoints(points + 1);
    
    toast({
      title: "Seguimento confirmado!",
      description: "Você ganhou 1 ponto.",
    });
  };

  const handleBuyPoints = () => {
    toast({
      title: "Compra de pontos",
      description: "A integração com Stripe é necessária para esta funcionalidade.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Conecte e Ganhe</h1>
          <p className="text-muted-foreground">Ganhe seguidores e conecte-se com outros criadores</p>
        </div>
        
        <Card className="bg-tiktool-gray border-tiktool-gray/50">
          <CardHeader>
            <CardTitle>Seu Saldo</CardTitle>
            <CardDescription>Use pontos para ganhar seguidores</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div>
              <p className="text-4xl font-bold">{points} pontos</p>
              <p className="text-sm text-muted-foreground">1 ponto = 1 seguidor</p>
            </div>
            <Button onClick={handleBuyPoints} className="bg-tiktool-pink hover:bg-tiktool-pink/80">
              Comprar Pontos
            </Button>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="follow" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="follow">Seguir Perfis</TabsTrigger>
            <TabsTrigger value="register">Meu Perfil</TabsTrigger>
          </TabsList>
          
          <TabsContent value="follow">
            <Card className="bg-tiktool-gray border-tiktool-gray/50">
              <CardHeader>
                <CardTitle>Perfis Disponíveis</CardTitle>
                <CardDescription>Siga estes perfis para ganhar pontos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Opcional: exemplo de como seria um perfil disponível para seguir, removido para produção */}
                  {isWaitingConfirmation === 999 ? (
                    <div className="flex items-center justify-between p-4 bg-tiktool-dark rounded-md">
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-tiktool-gray flex items-center justify-center">
                            <UserCheck className="text-tiktool-teal" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{activeProfile}</p>
                              {isProfileActive ? (
                                <Badge className="bg-tiktool-teal text-white">Ativo</Badge>
                              ) : (
                                <Badge className="bg-amber-500 text-white">Pausado</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {isProfileActive ? 'Recebendo seguidores' : 'Não está recebendo seguidores'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {isProfileActive ? (
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={handlePauseProfile}
                              title="Pausar"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={handleResumeProfile}
                              title="Reativar"
                              className="text-tiktool-teal border-tiktool-teal"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={handleRemoveProfile}
                            className="text-red-500 hover:text-red-400 border-red-500 hover:border-red-400"
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
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="@seuusername"
                            value={profileUsername}
                            onChange={(e) => setProfileUsername(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={handleRegisterProfile}
                          disabled={points <= 0}
                        >
                          Cadastrar
                        </Button>
                      </div>
                    </div>
                    
                    {points <= 0 && (
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ConnectEarn;
