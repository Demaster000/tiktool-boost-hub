
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-tiktool-dark p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold mb-4 tiktool-gradient-text">404</h1>
        <p className="text-xl mb-8">Oops! Página não encontrada</p>
        <div className="mb-8 opacity-80">
          <p className="mb-4">A página que você está procurando não existe ou foi movida.</p>
        </div>
        <Link to="/">
          <Button className="bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90">
            Voltar para o Início
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
