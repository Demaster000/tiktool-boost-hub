
import { Hash, ThumbsUp, TrendingUp, Video, User, Award } from "lucide-react";
import FeatureCard from "./FeatureCard";

const FeaturesSection = () => {
  return (
    <section className="py-16 md:py-24 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Turbine seu perfil no <span className="tiktool-gradient-text">TikTok</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Nossas ferramentas foram desenvolvidas para ajudar você a crescer mais rápido na plataforma favorita da geração Z.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Conecte e Ganhe" 
            description="Troque seguidores com outros usuários e cresça sua audiência de forma orgânica."
            icon={<User className="text-tiktool-pink" />}
            to="/connect-earn"
            gradient="pink"
          />
          
          <FeatureCard 
            title="Ideias para Vídeo" 
            description="Receba sugestões criativas para seus próximos vídeos baseadas em tendências atuais."
            icon={<Video className="text-tiktool-teal" />}
            to="/video-ideas"
            gradient="teal"
          />
          
          <FeatureCard 
            title="Gerador de Hashtags" 
            description="Encontre as melhores hashtags para aumentar o alcance dos seus vídeos."
            icon={<Hash className="text-white" />}
            to="/hashtag-generator"
            gradient="mixed"
          />
          
          <FeatureCard 
            title="Análise de Perfil" 
            description="Obtenha insights detalhados sobre seu perfil e dicas personalizadas para melhorá-lo."
            icon={<TrendingUp className="text-white" />}
            to="/profile-analysis"
            gradient="mixed"
          />
          
          <FeatureCard 
            title="Ganhe Likes e Views" 
            description="Compartilhe seus vídeos e receba curtidas e visualizações da comunidade TikTool."
            icon={<ThumbsUp className="text-tiktool-pink" />}
            to="/likes-views"
            gradient="pink"
          />
          
          <FeatureCard 
            title="Desafio Diário" 
            description="Complete desafios diários para ganhar pontos e conquistar badges exclusivos."
            icon={<Award className="text-tiktool-teal" />}
            to="/daily-challenge"
            gradient="teal"
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
