
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useHashtags } from "@/hooks/useHashtags";
import { useUserStats } from "@/hooks/useUserStats";

const HashtagGenerator = () => {
  const [selectedNiche, setSelectedNiche] = useState("");
  const { hashtags, loading: hashtagsLoading, getHashtagsByNiche } = useHashtags();
  const { stats, updateStat } = useUserStats();
  const { toast } = useToast();

  const handleGenerateHashtags = async () => {
    if (!selectedNiche) {
      toast({
        title: "Selecione um nicho",
        description: "Escolha um nicho para gerar hashtags",
        variant: "destructive",
      });
      return;
    }
    
    await getHashtagsByNiche(selectedNiche);
    
    // Update user stats for hashtags generated
    if (stats) {
      await updateStat('ideas_generated', stats.ideas_generated + 1);
    }
    
    toast({
      title: "Hashtags geradas!",
      description: "Experimente usar estas hashtags em seus vídeos.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerador de Hashtags</h1>
          <p className="text-muted-foreground">Encontre as melhores hashtags para seus vídeos</p>
        </div>
        
        <Card className="bg-tiktool-gray border-tiktool-gray/50">
          <CardHeader>
            <CardTitle>Gerador de Hashtags</CardTitle>
            <CardDescription>Selecione um nicho e gere hashtags relevantes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Escolha um nicho:</label>
              <Select onValueChange={setSelectedNiche} value={selectedNiche}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um nicho" />
                </SelectTrigger>
                <SelectContent className="bg-tiktool-gray border-tiktool-gray/50">
                  <SelectItem value="Beleza">Beleza</SelectItem>
                  <SelectItem value="Dança">Dança</SelectItem>
                  <SelectItem value="Humor">Humor</SelectItem>
                  <SelectItem value="Educação">Educação</SelectItem>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="DIY">DIY</SelectItem>
                  <SelectItem value="Vlog">Vlog</SelectItem>
                  <SelectItem value="Moda">Moda</SelectItem>
                  <SelectItem value="Games">Games</SelectItem>
                  <SelectItem value="Música">Música</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleGenerateHashtags} 
              className="bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90 w-full"
              disabled={hashtagsLoading || !selectedNiche}
            >
              {hashtagsLoading ? "Gerando hashtags..." : "Gerar Hashtags"}
            </Button>
            
            {hashtags.length > 0 && (
              <Card className="bg-tiktool-dark border-tiktool-gray/50">
                <CardHeader>
                  <CardTitle className="text-lg">Suas hashtags:</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((hashtag, index) => (
                      <div key={index} className="bg-tiktool-gray px-3 py-1 rounded-full text-sm">
                        {hashtag}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Nicho: {selectedNiche}
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-tiktool-gray border-tiktool-gray/50">
          <CardHeader>
            <CardTitle>Dicas para Hashtags</CardTitle>
            <CardDescription>Como usar hashtags de forma eficaz</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-tiktool-pink mt-2"></div>
                <p className="text-sm">Use entre 3-5 hashtags por vídeo para melhor alcance</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-tiktool-pink mt-2"></div>
                <p className="text-sm">Combine hashtags populares com nichos específicos</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-tiktool-pink mt-2"></div>
                <p className="text-sm">Atualize suas hashtags regularmente para alcançar novos públicos</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-tiktool-pink mt-2"></div>
                <p className="text-sm">Pesquise hashtags dos criadores populares no seu nicho</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-tiktool-pink mt-2"></div>
                <p className="text-sm">Crie sua própria hashtag para construir uma comunidade</p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HashtagGenerator;
