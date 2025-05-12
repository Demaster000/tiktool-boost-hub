import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Award, ThumbsUp, Eye, Flame } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserStats } from "@/hooks/useUserStats";

interface TikTokVideo {
  id: string;
  user_id: string;
  video_id: string;
  title: string;
  views: number;
  likes: number;
  created_at: string;
  username?: string;
}

const LikesViews = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentVideos, setRecentVideos] = useState<TikTokVideo[]>([]);
  const [topLiked, setTopLiked] = useState<TikTokVideo[]>([]);
  const [topViewed, setTopViewed] = useState<TikTokVideo[]>([]);
  const [userVideos, setUserVideos] = useState<TikTokVideo[]>([]);
  const { user } = useAuth();
  const { updateStat } = useUserStats();

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user]);

  const fetchVideos = async () => {
    try {
      // Fetch recent videos
      const { data: recent } = await supabase
        .from('tiktok_videos')
        .select('*, profiles:user_id(username)')
        .order('created_at', { ascending: false })
        .limit(10) as { data: any[] | null };

      if (recent) {
        setRecentVideos(recent.map(v => ({
          ...v,
          username: v.profiles?.username
        })));
      }

      // Fetch top liked videos
      const { data: liked } = await supabase
        .from('tiktok_videos')
        .select('*, profiles:user_id(username)')
        .order('likes', { ascending: false })
        .limit(10) as { data: any[] | null };

      if (liked) {
        setTopLiked(liked.map(v => ({
          ...v,
          username: v.profiles?.username
        })));
      }

      // Fetch top viewed videos
      const { data: viewed } = await supabase
        .from('tiktok_videos')
        .select('*, profiles:user_id(username)')
        .order('views', { ascending: false })
        .limit(10) as { data: any[] | null };

      if (viewed) {
        setTopViewed(viewed.map(v => ({
          ...v,
          username: v.profiles?.username
        })));
      }

      // Fetch user's videos
      if (user) {
        const { data: myVideos } = await supabase
          .from('tiktok_videos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }) as { data: TikTokVideo[] | null };

        if (myVideos) {
          setUserVideos(myVideos);
        }
      }
    } catch (error: any) {
      console.error("Error fetching videos:", error);
    }
  };

  const submitVideo = async () => {
    if (!videoUrl.trim() || !user) return;
    
    setIsLoading(true);
    
    try {
      // Extract video ID and validate TikTok URL
      const regex = /tiktok\.com\/@[\w\.]+\/video\/(\d+)/;
      const match = videoUrl.match(regex);
      
      if (!match || !match[1]) {
        toast({
          title: "URL inválida",
          description: "Por favor insira um link válido do TikTok (ex: https://www.tiktok.com/@username/video/1234567890)",
          variant: "destructive"
        });
        return;
      }
      
      const videoId = match[1];
      
      // Check if video already exists
      const { data: existingVideo } = await supabase
        .from('tiktok_videos')
        .select('*')
        .eq('video_id', videoId)
        .single() as { data: TikTokVideo | null };
      
      if (existingVideo) {
        toast({
          title: "Vídeo já existe",
          description: "Este vídeo já foi adicionado ao sistema",
          variant: "destructive"
        });
        return;
      }
      
      // Add video to database
      const { error } = await supabase
        .from('tiktok_videos')
        .insert({
          user_id: user.id,
          video_id: videoId,
          title: `Vídeo de ${user.email?.split('@')[0] || 'usuário'}`,
          views: 0,
          likes: 0
        });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Vídeo adicionado com sucesso!",
        description: "Seu vídeo foi adicionado e agora pode receber likes e visualizações",
      });
      
      setVideoUrl("");
      fetchVideos();
      
      // Add points to user
      await updateStat('points', 5);
      
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar vídeo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const incrementView = async (video: TikTokVideo) => {
    if (!user) return;
    
    try {
      // Don't allow viewing own videos
      if (video.user_id === user.id) {
        toast({
          title: "Ação não permitida",
          description: "Você não pode visualizar seus próprios vídeos",
          variant: "destructive"
        });
        return;
      }
      
      // Update view count
      const { error } = await supabase
        .from('tiktok_videos')
        .update({ views: video.views + 1 })
        .eq('id', video.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedRecentVideos = recentVideos.map(v => 
        v.id === video.id ? { ...v, views: v.views + 1 } : v
      );
      setRecentVideos(updatedRecentVideos);
      
      const updatedLiked = topLiked.map(v => 
        v.id === video.id ? { ...v, views: v.views + 1 } : v
      );
      setTopLiked(updatedLiked);
      
      const updatedViewed = topViewed.map(v => 
        v.id === video.id ? { ...v, views: v.views + 1 } : v
      );
      setTopViewed(updatedViewed);
      
      toast({
        title: "Visualização registrada",
        description: `Você visualizou o vídeo de ${video.username || 'usuário'}`,
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao registrar visualização",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const incrementLike = async (video: TikTokVideo) => {
    if (!user) return;
    
    try {
      // Don't allow liking own videos
      if (video.user_id === user.id) {
        toast({
          title: "Ação não permitida",
          description: "Você não pode curtir seus próprios vídeos",
          variant: "destructive"
        });
        return;
      }
      
      // Update like count
      const { error } = await supabase
        .from('tiktok_videos')
        .update({ likes: video.likes + 1 })
        .eq('id', video.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedRecentVideos = recentVideos.map(v => 
        v.id === video.id ? { ...v, likes: v.likes + 1 } : v
      );
      setRecentVideos(updatedRecentVideos);
      
      const updatedLiked = topLiked.map(v => 
        v.id === video.id ? { ...v, likes: v.likes + 1 } : v
      );
      setTopLiked(updatedLiked);
      
      const updatedViewed = topViewed.map(v => 
        v.id === video.id ? { ...v, likes: v.likes + 1 } : v
      );
      setTopViewed(updatedViewed);
      
      toast({
        title: "Curtida registrada",
        description: `Você curtiu o vídeo de ${video.username || 'usuário'}`,
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao registrar curtida",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const renderVideoCard = (video: TikTokVideo, canInteract: boolean = true) => {
    return (
      <Card className="bg-tiktool-gray border-tiktool-gray/50 mb-4" key={video.id}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 w-full md:w-auto flex justify-center">
              <div className="relative w-[325px] h-[570px] bg-tiktool-dark rounded-md flex items-center justify-center overflow-hidden">
                <blockquote className="tiktok-embed" cite={`https://www.tiktok.com/@username/video/${video.video_id}`} data-video-id={video.video_id} style={{ maxWidth: '325px', minWidth: '325px' }}></blockquote>
                {/* TikTok embeds script will be loaded once on component mount */}
              </div>
            </div>
            
            <div className="flex-grow space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{video.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Por: {video.username || "Usuário"}
                </p>
              </div>
              
              <div className="flex gap-4">
                <div className="bg-tiktool-dark p-3 rounded-md flex items-center gap-2">
                  <Eye className="text-tiktool-teal h-5 w-5" />
                  <span>{video.views} visualizações</span>
                </div>
                
                <div className="bg-tiktool-dark p-3 rounded-md flex items-center gap-2">
                  <ThumbsUp className="text-tiktool-pink h-5 w-5" />
                  <span>{video.likes} curtidas</span>
                </div>
              </div>
              
              {canInteract && user && video.user_id !== user.id && (
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={() => incrementView(video)} 
                    className="bg-tiktool-teal hover:bg-tiktool-teal/80"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                  </Button>
                  
                  <Button 
                    onClick={() => incrementLike(video)} 
                    className="bg-tiktool-pink hover:bg-tiktool-pink/80"
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Curtir
                  </Button>
                </div>
              )}
              
              {user && video.user_id === user.id && (
                <div className="bg-tiktool-dark p-3 rounded-md text-tiktool-teal text-sm">
                  Este é seu vídeo
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Load TikTok embed script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ganhe Likes e Visualizações</h1>
          <p className="text-muted-foreground">Compartilhe seus vídeos e receba curtidas e visualizações da comunidade TikTool</p>
        </div>
        
        <Card className="bg-tiktool-gray border-tiktool-gray/50">
          <CardHeader>
            <CardTitle>Compartilhe seu Vídeo do TikTok</CardTitle>
            <CardDescription>Cole o link do seu vídeo para receber likes e visualizações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                placeholder="https://www.tiktok.com/@username/video/1234567890"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="bg-tiktool-dark border-tiktool-gray/50"
              />
              <Button 
                onClick={submitVideo} 
                disabled={!videoUrl.trim() || isLoading}
                className="bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90 md:w-auto w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Vídeo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Seu vídeo será exibido para outros usuários da plataforma. Você ganha pontos quando seu vídeo é visualizado/curtido.
            </p>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="recents">
          <TabsList className="bg-tiktool-dark">
            <TabsTrigger value="recents">Mais Recentes</TabsTrigger>
            <TabsTrigger value="top-views">Mais Visualizados</TabsTrigger>
            <TabsTrigger value="top-likes">Mais Curtidos</TabsTrigger>
            {userVideos.length > 0 && (
              <TabsTrigger value="my-videos">Meus Vídeos</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="recents" className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="text-tiktool-pink" />
              <h2 className="text-xl font-semibold">Vídeos Recentes</h2>
            </div>
            
            {recentVideos.length > 0 ? (
              recentVideos.map(video => renderVideoCard(video))
            ) : (
              <Card className="bg-tiktool-dark border-tiktool-gray/50 p-8 text-center">
                <p>Nenhum vídeo encontrado. Seja o primeiro a adicionar!</p>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="top-views" className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="text-tiktool-teal" />
              <h2 className="text-xl font-semibold">Mais Visualizados</h2>
            </div>
            
            {topViewed.length > 0 ? (
              topViewed.map(video => renderVideoCard(video))
            ) : (
              <Card className="bg-tiktool-dark border-tiktool-gray/50 p-8 text-center">
                <p>Nenhum vídeo encontrado. Seja o primeiro a adicionar!</p>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="top-likes" className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp className="text-tiktool-pink" />
              <h2 className="text-xl font-semibold">Mais Curtidos</h2>
            </div>
            
            {topLiked.length > 0 ? (
              topLiked.map(video => renderVideoCard(video))
            ) : (
              <Card className="bg-tiktool-dark border-tiktool-gray/50 p-8 text-center">
                <p>Nenhum vídeo encontrado. Seja o primeiro a adicionar!</p>
              </Card>
            )}
          </TabsContent>
          
          {userVideos.length > 0 && (
            <TabsContent value="my-videos" className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="text-tiktool-teal" />
                <h2 className="text-xl font-semibold">Meus Vídeos</h2>
              </div>
              
              {userVideos.map(video => renderVideoCard(video, false))}
            </TabsContent>
          )}
        </Tabs>
        
        <Card className="bg-gradient-to-r from-tiktool-pink/10 to-tiktool-teal/10 border border-tiktool-gray/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Award className="text-yellow-500 h-6 w-6" />
              <h3 className="text-lg font-semibold">Premiação Semanal</h3>
            </div>
            
            <p className="mb-2">Todo sábado, os vídeos com maiores resultados ganham:</p>
            
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="bg-tiktool-dark rounded-full p-1">
                  <ThumbsUp className="h-4 w-4 text-tiktool-pink" />
                </div>
                <span>Vídeo mais curtido: <span className="font-bold text-tiktool-pink">+200 pontos</span></span>
              </li>
              
              <li className="flex items-center gap-2">
                <div className="bg-tiktool-dark rounded-full p-1">
                  <Eye className="h-4 w-4 text-tiktool-teal" />
                </div>
                <span>Vídeo mais visualizado: <span className="font-bold text-tiktool-teal">+200 pontos</span></span>
              </li>
            </ul>
            
            <p className="text-xs text-muted-foreground mt-3">
              Os pontos são automaticamente creditados na sua conta e podem ser usados na ferramenta "Conecte e Ganhe".
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LikesViews;
