
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: number;
  username: string;
  followers: number;
  avatar: string;
}

const mockProfiles: Profile[] = [
  { id: 1, username: "@dancagirl", followers: 5420, avatar: "https://i.pravatar.cc/150?img=1" },
  { id: 2, username: "@techreviewer", followers: 12500, avatar: "https://i.pravatar.cc/150?img=2" },
  { id: 3, username: "@cookingmaster", followers: 8300, avatar: "https://i.pravatar.cc/150?img=3" },
  { id: 4, username: "@fitnessguru", followers: 15200, avatar: "https://i.pravatar.cc/150?img=4" },
  { id: 5, username: "@traveldiaries", followers: 9600, avatar: "https://i.pravatar.cc/150?img=5" },
];

const ConnectEarn = () => {
  const [points, setPoints] = useState(10);
  const [profileUsername, setProfileUsername] = useState("");
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState<number | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const { toast } = useToast();

  const handleRegisterProfile = () => {
    if (!profileUsername) {
      toast({
        title: "Nome de usuário obrigatório",
        description: "Por favor, insira seu nome de usuário do TikTok",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Perfil registrado com sucesso",
      description: "Seu perfil foi adicionado à lista para receber seguidores.",
    });
    setProfileUsername("");
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
            <TabsTrigger value="register">Cadastrar Meu Perfil</TabsTrigger>
          </TabsList>
          
          <TabsContent value="follow">
            <Card className="bg-tiktool-gray border-tiktool-gray/50">
              <CardHeader>
                <CardTitle>Perfis Disponíveis</CardTitle>
                <CardDescription>Siga estes perfis para ganhar pontos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProfiles.map((profile) => (
                    <div 
                      key={profile.id} 
                      className="flex items-center justify-between p-4 bg-tiktool-dark rounded-md"
                    >
                      <div className="flex items-center gap-4">
                        <img 
                          src={profile.avatar} 
                          alt={profile.username} 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium">{profile.username}</p>
                          <p className="text-sm text-muted-foreground">{profile.followers} seguidores</p>
                        </div>
                      </div>
                      
                      {isWaitingConfirmation === profile.id ? (
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
                      ) : (
                        <Button 
                          variant="outline" 
                          onClick={() => handleFollow(profile.id)}
                          disabled={isWaitingConfirmation !== null}
                        >
                          Seguir
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <Card className="bg-tiktool-gray border-tiktool-gray/50">
              <CardHeader>
                <CardTitle>Cadastrar Meu Perfil</CardTitle>
                <CardDescription>Você precisa de pontos para ganhar seguidores</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ConnectEarn;
