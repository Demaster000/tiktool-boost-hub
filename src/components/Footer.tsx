
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-tiktool-dark border-t border-tiktool-gray/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold tiktool-gradient-text">TikTool</span>
            </Link>
            <p className="text-muted-foreground">
              Ferramentas inteligentes para bombar no TikTok
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-white transition-colors">
                  Entrar
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-muted-foreground hover:text-white transition-colors">
                  Criar Conta
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Suporte</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-white transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-white transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-white transition-colors">
                  Suporte
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-tiktool-gray/30 pt-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TikTool. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
