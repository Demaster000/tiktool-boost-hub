
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Ideias por categoria
const ideasByCategory: Record<string, string[]> = {
  beleza: [
    "5 produtos de skincare que mudaram minha rotina",
    "Transformação de maquiagem em 60 segundos",
    "3 penteados rápidos para dia a dia",
    "Review honesto: produtos virais de beleza",
    "Tutorial: sobrancelha perfeita em 30 segundos"
  ],
  danca: [
    "Aprenda esta coreografia viral em 3 passos",
    "Danças dos anos 90 que voltaram à moda",
    "Desafio: dance com um objeto inusitado",
    "Evolução do meu estilo de dança em 1 ano",
    "Tutorial: movimento de dança que está bombando"
  ],
  humor: [
    "Situações constrangedoras que todos já passaram",
    "Imitando celebridades com filtros engraçados",
    "Como minha mãe vs como eu faço as coisas",
    "Expectativa vs Realidade: primeira vez cozinhando",
    "Reagindo a vídeos antigos constrangedores"
  ],
  educacao: [
    "3 curiosidades históricas que ninguém te contou na escola",
    "Explicando um conceito científico em 60 segundos",
    "Dicas para aprender um novo idioma rapidamente",
    "Fatos surpreendentes sobre o corpo humano",
    "Mini aula: resolvendo equações de forma simples"
  ],
  tecnologia: [
    "Review: o gadget que mudou minha rotina",
    "3 apps que poucos conhecem mas são incríveis",
    "Como edito meus vídeos do TikTok em 5 minutos",
    "Unboxing: o lançamento tech mais esperado do mês",
    "Dicas para melhorar a bateria do seu celular"
  ],
  diy: [
    "Transforme uma camiseta velha em algo incrível",
    "Decoração minimalista gastando menos de R$50",
    "3 ideias de presentes feitos à mão",
    "Como renovar um móvel antigo sem gastar muito",
    "DIY: organizadores para sua mesa que custam quase nada"
  ],
  vlog: [
    "Um dia na minha vida: rotina de estudante/trabalhador",
    "O que como em um dia (versão realista)",
    "Preparando-me para um evento importante",
    "Tour pelo meu quarto/casa/apartamento",
    "Tentando uma nova atividade pela primeira vez"
  ],
  moda: [
    "5 formas de usar a mesma peça de roupa",
    "Montando looks com peças básicas do guarda-roupa",
    "Tendências que estão bombando este mês",
    "Transformação de look: do dia para noite em 30s",
    "Achados de brechó que parecem de grife"
  ],
  games: [
    "Reagindo ao trailer do jogo mais esperado do ano",
    "3 jogos mobile que valem a pena baixar",
    "Easter eggs que você nunca percebeu no seu jogo favorito",
    "Speedrun: completando fase em tempo recorde",
    "Review honesta: o novo jogo que está em alta"
  ],
  musica: [
    "Cover de 15 segundos da música viral do momento",
    "Evolução do meu instrumento em 1 ano",
    "Tentando criar um beat usando apenas objetos caseiros",
    "Reagindo às músicas mais tocadas há 10 anos",
    "Mini tutorial: aprenda esse riff de guitarra/acordes"
  ],
};

const VideoIdeas = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentIdea, setCurrentIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateIdea = () => {
    if (!selectedCategory) {
      toast({
        title: "Selecione uma categoria",
        description: "Escolha uma categoria para gerar uma ideia",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simular carregamento
    setTimeout(() => {
      const ideas = ideasByCategory[selectedCategory];
      const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
      
      setCurrentIdea(randomIdea);
      setIsLoading(false);
      
      toast({
        title: "Nova ideia gerada!",
        description: "Experimente criar um vídeo com esta sugestão.",
      });
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ideias para Vídeo</h1>
          <p className="text-muted-foreground">Gere ideias criativas para seus próximos vídeos</p>
        </div>
        
        <Card className="bg-tiktool-gray border-tiktool-gray/50">
          <CardHeader>
            <CardTitle>Gerador de Ideias</CardTitle>
            <CardDescription>Selecione uma categoria e gere uma ideia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Escolha uma categoria:</label>
              <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-tiktool-gray border-tiktool-gray/50">
                  <SelectItem value="beleza">Beleza</SelectItem>
                  <SelectItem value="danca">Dança</SelectItem>
                  <SelectItem value="humor">Humor</SelectItem>
                  <SelectItem value="educacao">Educação</SelectItem>
                  <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="diy">DIY</SelectItem>
                  <SelectItem value="vlog">Vlog</SelectItem>
                  <SelectItem value="moda">Moda</SelectItem>
                  <SelectItem value="games">Games</SelectItem>
                  <SelectItem value="musica">Música</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleGenerateIdea} 
              className="bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90 w-full"
              disabled={isLoading || !selectedCategory}
            >
              {isLoading ? "Gerando ideia..." : "Gerar Ideia"}
            </Button>
            
            {currentIdea && (
              <Card className="bg-tiktool-dark border-tiktool-gray/50">
                <CardHeader>
                  <CardTitle className="text-lg">Sua ideia:</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-medium">"{currentIdea}"</p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Categoria: {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-tiktool-gray border-tiktool-gray/50">
          <CardHeader>
            <CardTitle>Dicas para Ideias Virais</CardTitle>
            <CardDescription>Como fazer sua ideia se destacar</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-tiktool-pink mt-2"></div>
                <p className="text-sm">Mantenha seus vídeos curtos e diretos - entre 15 a 30 segundos</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-tiktool-pink mt-2"></div>
                <p className="text-sm">Use músicas virais ou sons tendência do momento</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-tiktool-pink mt-2"></div>
                <p className="text-sm">Crie um gancho forte nos primeiros 3 segundos para prender a atenção</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-tiktool-pink mt-2"></div>
                <p className="text-sm">Use texto na tela para reforçar sua mensagem</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-tiktool-pink mt-2"></div>
                <p className="text-sm">Participe de desafios populares, mas adicione seu toque único</p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VideoIdeas;
