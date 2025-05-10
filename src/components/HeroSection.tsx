
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 relative">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-tiktool-pink/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-1/3 -right-20 w-72 h-72 bg-tiktool-teal/20 rounded-full filter blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Ferramentas inteligentes para 
            <span className="tiktool-gradient-text block mt-2">bombar no TikTok</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Dê um impulso na sua presença no TikTok com nossas ferramentas exclusivas. Ganhe seguidores, ideias virais e insights profissionais.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90 text-white">
                Criar Conta
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Entrar
              </Button>
            </Link>
          </div>
          <div className="mt-12">
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-tiktool-pink"></div>
                <span>+1000 criadores</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-tiktool-teal"></div>
                <span>+5000 ideias geradas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <span>+10000 seguidores obtidos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
