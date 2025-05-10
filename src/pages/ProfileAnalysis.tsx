
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  username: string;
  followers: number;
  likes: number;
  views: number;
}

interface AnalysisResult {
  score: number;
  strengths: string[];
  improvements: string[];
  tips: string[];
}

const ProfileAnalysis = () => {
  const [profileData, setProfileData] = useState<ProfileData>({
    username: "",
    followers: 0,
    likes: 0,
    views: 0
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: name === 'username' ? value : Number(value)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.username) {
      toast({
        title: "Nome de usuário obrigatório",
        description: "Por favor, insira seu nome de usuário do TikTok",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulação de análise
    setTimeout(() => {
      const engagementRate = calculateEngagementRate();
      const result = generateAnalysis(engagementRate);
      
      setAnalysisResult(result);
      setIsLoading(false);
      
      toast({
        title: "Análise concluída!",
        description: "Confira os resultados e as dicas personalizadas.",
      });
    }, 2000);
  };

  const calculateEngagementRate = () => {
    if (profileData.followers === 0) return 0;
    
    // Taxa de engajamento = (curtidas + visualizações) / seguidores * 100
    const engagementRate = (profileData.likes + profileData.views) / profileData.followers * 100;
    return Math.min(100, engagementRate); // Limitado a 100%
  };

  const generateAnalysis = (engagementRate: number): AnalysisResult => {
    // Pontuação baseada na taxa de engajamento
    let score = Math.min(100, Math.round(engagementRate));
    
    // Strengths
    const strengths = [];
    if (profileData.followers > 10000) strengths.push("Base sólida de seguidores");
    if (profileData.likes > profileData.followers * 0.3) strengths.push("Alta taxa de curtidas");
    if (profileData.views > profileData.followers * 2) strengths.push("Bom alcance de visualizações");
    
    // Melhorias
    const improvements = [];
    if (profileData.followers < 1000) improvements.push("Base de seguidores ainda pequena");
    if (profileData.likes < profileData.followers * 0.1) improvements.push("Taxa de curtidas abaixo da média");
    if (profileData.views < profileData.followers) improvements.push("Visualizações abaixo do esperado");
    
    // Dicas personalizadas
    const tips = [];
    
    if (profileData.followers < 5000) {
      tips.push("Poste com mais frequência, idealmente 1-2 vídeos por dia");
      tips.push("Use hashtags relevantes e atuais para aumentar a descoberta");
    } else {
      tips.push("Estabeleça uma programação consistente de postagem");
      tips.push("Experimente diferentes formatos para ver o que seu público prefere");
    }
    
    if (profileData.likes < profileData.followers * 0.2) {
      tips.push("Crie conteúdo mais envolvente com chamadas claras para ação");
      tips.push("Pergunte ou desafie seus espectadores para aumentar interação");
    }
    
    if (profileData.views < profileData.followers * 1.5) {
      tips.push("Prenda a atenção nos primeiros 3 segundos de cada vídeo");
      tips.push("Use tendências atuais para aumentar o alcance do seu conteúdo");
    }
    
    return {
      score,
      strengths: strengths.length > 0 ? strengths : ["Perfil novo com potencial para crescimento"],
      improvements: improvements.length > 0 ? improvements : ["Continue melhorando sua consistência"],
      tips: tips.length > 0 ? tips : ["Mantenha-se ativo e interaja com outros criadores"],
    };
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Análise de Perfil</h1>
          <p className="text-muted-foreground">Obtenha insights personalizados sobre seu perfil</p>
        </div>
        
        <Card className="bg-tiktool-gray border-tiktool-gray/50">
          <CardHeader>
            <CardTitle>Informações do Perfil</CardTitle>
            <CardDescription>Preencha os dados do seu perfil do TikTok</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome de usuário</label>
                <Input
                  name="username"
                  placeholder="@seuusername"
                  value={profileData.username}
                  onChange={handleChange}
                  className="bg-tiktool-dark"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantidade de seguidores</label>
                <Input
                  name="followers"
                  type="number"
                  placeholder="Ex: 1000"
                  value={profileData.followers || ""}
                  onChange={handleChange}
                  className="bg-tiktool-dark"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantidade de curtidas (total)</label>
                <Input
                  name="likes"
                  type="number"
                  placeholder="Ex: 5000"
                  value={profileData.likes || ""}
                  onChange={handleChange}
                  className="bg-tiktool-dark"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Visualizações do último vídeo</label>
                <Input
                  name="views"
                  type="number"
                  placeholder="Ex: 2500"
                  value={profileData.views || ""}
                  onChange={handleChange}
                  className="bg-tiktool-dark"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? "Analisando..." : "Analisar Perfil"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {analysisResult && (
          <Card className="bg-tiktool-gray border-tiktool-gray/50">
            <CardHeader>
              <CardTitle>Resultado da Análise</CardTitle>
              <CardDescription>Com base nos dados informados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="transparent" 
                      stroke="#1e1e1e" 
                      strokeWidth="8"
                    />
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="transparent" 
                      stroke={`url(#scoreGradient)`} 
                      strokeWidth="8"
                      strokeDasharray={`${analysisResult.score * 2.82} 282`}
                    />
                    <defs>
                      <linearGradient id="scoreGradient" gradientTransform="rotate(90)">
                        <stop offset="0%" stopColor="#25F4EE" />
                        <stop offset="100%" stopColor="#FF2C55" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{analysisResult.score}</span>
                  </div>
                </div>
                <p className="mt-2 font-medium">Pontuação de Perfil</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2 text-tiktool-teal">Pontos Fortes</h3>
                  <ul className="space-y-1">
                    {analysisResult.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-tiktool-teal mt-2"></div>
                        <p className="text-sm">{strength}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2 text-tiktool-pink">Áreas para Melhorar</h3>
                  <ul className="space-y-1">
                    {analysisResult.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-tiktool-pink mt-2"></div>
                        <p className="text-sm">{improvement}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Dicas Personalizadas</h3>
                  <ul className="space-y-1">
                    {analysisResult.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-white mt-2"></div>
                        <p className="text-sm">{tip}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfileAnalysis;
