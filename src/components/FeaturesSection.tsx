
import { UsersIcon } from "lucide-react";
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
            icon={<UsersIcon className="text-tiktool-pink" />}
            to="/connect-earn"
            gradient="pink"
          />
          
          <FeatureCard 
            title="Ideias para Vídeo" 
            description="Receba sugestões criativas para seus próximos vídeos baseadas em tendências atuais."
            icon={<UsersIcon className="text-tiktool-teal" />}
            to="/video-ideas"
            gradient="teal"
          />
          
          <FeatureCard 
            title="Análise de Perfil" 
            description="Obtenha insights detalhados sobre seu perfil e dicas personalizadas para melhorá-lo."
            icon={<UsersIcon className="text-white" />}
            to="/profile-analysis"
            gradient="mixed"
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
