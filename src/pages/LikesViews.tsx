
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useUserStats } from "@/hooks/useUserStats";
import { Eye, ThumbsUp, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TikTokVideo {
  id: string;
  url: string;
  user_id: string;
  created_at: string;
  likes: number;
  views: number;
  username?: string;
}

const LikesViews = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentVideos, setRecentVideos] = useState<TikTokVideo[]>([]);
  const [topLiked, setTopLiked] = useState<TikTokVideo[]>([]);
  const [topViewed, setTopViewed] = useState<TikTokVideo[]>([]);
  const { user } = useAuth();
  const { stats, updateStat } = useUserStats();

  // Extract TikTok video ID from URL
  const extractVideoId = (url: string) => {
    try {
      // Handle direct video URLs
      const directMatch = url.match(/\/video\/(\d+)/);
      if (directMatch) return directMatch[1];

      // Handle share URLs with parameters
      const urlObj = new URL(url);
      if (urlObj.pathname.includes('/t/')) {
        return urlObj.pathname.split('/').pop();
      }
      
      return null;
    } catch {
      return null;
    }
  };
  
  // Extract username from URL
  const extractUsername = (url: string) => {
    try {
      const match = url.match(/@([^\/]+)/);
      return match ? match[1] : "username";
    } catch {
      return "username";
    }
  };

  // Submit video
  const submitVideo = async () => {
    if (!user) return;
    
    const videoId = extractVideoId(videoUrl);
    const username = extractUsername(videoUrl);
    
    if (!videoId) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida do TikTok",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tiktok_videos')
        .insert({
          url: videoUrl,
          video_id: videoId,
          username: username,
          user_id: user.id,
          likes: 0,
          views: 0
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Vídeo enviado com sucesso",
        description: "Seu vídeo foi adicionado à comunidade"
      });
      
      setVideoUrl("");
      fetchVideos(); // Refresh videos
    } catch (error: any) {
      toast({
        title: "Erro ao enviar vídeo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Like a video
  const likeVideo = async (video: TikTokVideo) => {
    if (!user) return;
    
    try {
      // Check if user already liked this video
      const { data: existingLike } = await supabase
        .from('video_interactions')
        .select()
        .eq('video_id', video.id)
        .eq('user_id', user.id)
        .eq('interaction_type', 'like')
        .single();
      
      if (existingLike) {
        toast({
          title: "Você já curtiu este vídeo",
          description: "Cada usuário pode curtir um vídeo apenas uma vez"
        });
        return;
      }
      
      // Record the like interaction
      await supabase
        .from('video_interactions')
        .insert({
          video_id: video.id,
          user_id: user.id,
          interaction_type: 'like'
        });
      
      // Update the video's like count
      await supabase
        .from('tiktok_videos')
        .update({ likes: video.likes + 1 })
        .eq('id', video.id);
      
      toast({
        title: "Curtida registrada!",
        description: "Obrigado pela interação"
      });
      
      fetchVideos(); // Refresh videos
    } catch (error: any) {
      toast({
        title: "Erro ao curtir vídeo",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // View a video
  const viewVideo = async (video: TikTokVideo) => {
    if (!user) return;
    
    try {
      // Check if user already viewed this video recently
      const { data: existingView } = await supabase
        .from('video_interactions')
        .select()
        .eq('video_id', video.id)
        .eq('user_id', user.id)
        .eq('interaction_type', 'view')
        .single();
      
      if (existingView) {
        toast({
          title: "Visualização já registrada",
          description: "Você já visualizou este vídeo recentemente"
        });
        return;
      }
      
      // Record the view interaction
      await supabase
        .from('video_interactions')
        .insert({
          video_id: video.id,
          user_id: user.id,
          interaction_type: 'view'
        });
      
      // Update the video's view count
      await supabase
        .from('tiktok_videos')
        .update({ views: video.views + 1 })
        .eq('id', video.id);
      
      toast({
        title: "Visualização registrada!",
        description: "Obrigado pela interação"
      });
      
      fetchVideos(); // Refresh videos
    } catch (error: any) {
      toast({
        title: "Erro ao registrar visualização",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Fetch videos
  const fetchVideos = async () => {
    try {
      // Fetch recent videos
      const { data: recent } = await supabase
        .from('tiktok_videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (recent) setRecentVideos(recent);
      
      // Fetch top 10 most liked videos
      const { data: mostLiked } = await supabase
        .from('tiktok_videos')
        .select('*')
        .order('likes', { ascending: false })
        .limit(10);
      
      if (mostLiked) setTopLiked(mostLiked);
      
      // Fetch top 10 most viewed videos
      const { data: mostViewed } = await supabase
        .from('tiktok_videos')
        .select('*')
        .order('views', { ascending: false })
        .limit(10);
      
      if (mostViewed) setTopViewed(mostViewed);
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  useEffect(() => {
    fetchVideos();
    
    // Load TikTok embed script
    const script = document.createElement('script');
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const renderVideoCard = (video: TikTokVideo) => {
    return (
      <Card key={video.id} className="bg-tiktool-gray border-tiktool-gray/50 mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex justify-center">
              <blockquote 
                className="tiktok-embed bg-tiktool-dark p-2 rounded" 
                cite={video.url} 
                data-video-id={video.video_id} 
                style={{ maxWidth: '325px', minWidth: '325px' }}
              />
            </div>
            
            <div className="flex flex-col justify-center gap-3">
              <div className="flex items-center gap-2">
                <ThumbsUp className="text-tiktool-pink" />
                <span>{video.likes} curtidas</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Eye className="text-tiktool-teal" />
                <span>{video.views} visualizações</span>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => viewVideo(video)} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Eye size={16} />
                  Visualizar
                </Button>
                
                <Button
                  onClick={() => likeVideo(video)}
                  className="bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90 flex items-center gap-2"
                >
                  <ThumbsUp size={16} />
                  Curtir
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ganhe Likes e Visualizações</h1>
          <p className="text-muted-foreground">Compartilhe seus vídeos e receba curtidas e visualizações da comunidade</p>
        </div>
        
        <Card className="bg-tiktool-gray border-tiktool-gray/50">
          <CardHeader>
            <CardTitle>Compartilhar Vídeo</CardTitle>
            <CardDescription>Cole o link do seu vídeo do TikTok para começar a receber interações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="https://www.tiktok.com/@username/video/1234567890"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="bg-tiktool-dark"
              />
              <Button 
                onClick={submitVideo} 
                disabled={loading || !videoUrl} 
                className="bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90 md:w-auto w-full"
              >
                {loading ? "Enviando..." : "Compartilhar Vídeo"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * Todo sábado, os vídeos com mais curtidas e mais visualizações ganham 200 pontos extras cada.
            </p>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="recent">Recentes</TabsTrigger>
            <TabsTrigger value="topLiked">Mais Curtidos</TabsTrigger>
            <TabsTrigger value="topViewed">Mais Visualizados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Vídeos Recentes</h2>
              {recentVideos.length > 0 ? (
                recentVideos.map(renderVideoCard)
              ) : (
                <Card className="bg-tiktool-dark border-tiktool-gray/50 p-8 text-center">
                  <p>Nenhum vídeo compartilhado ainda. Seja o primeiro!</p>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="topLiked">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Top 10 - Mais Curtidos</h2>
              {topLiked.length > 0 ? (
                topLiked.map(renderVideoCard)
              ) : (
                <Card className="bg-tiktool-dark border-tiktool-gray/50 p-8 text-center">
                  <p>Nenhum vídeo curtido ainda.</p>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="topViewed">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Top 10 - Mais Visualizados</h2>
              {topViewed.length > 0 ? (
                topViewed.map(renderVideoCard)
              ) : (
                <Card className="bg-tiktool-dark border-tiktool-gray/50 p-8 text-center">
                  <p>Nenhum vídeo visualizado ainda.</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default LikesViews;
