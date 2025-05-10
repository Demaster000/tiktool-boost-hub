
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        
        <section className="py-16 md:py-24 bg-tiktool-gray/20 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden z-0">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-tiktool-pink/10 rounded-full filter blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-tiktool-teal/10 rounded-full filter blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Pronto para dar o próximo passo?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Junte-se a milhares de criadores que já estão usando nossas ferramentas para crescer no TikTok.
              </p>
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90 text-white">
                  Começar Agora
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default LandingPage;
