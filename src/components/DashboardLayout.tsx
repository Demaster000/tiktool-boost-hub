
import React, { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItemProps {
  to: string;
  children: ReactNode;
  currentPath: string;
}

const NavItem = ({ to, children, currentPath }: NavItemProps) => {
  const isActive = currentPath === to;
  
  return (
    <Link to={to}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-left mb-1",
          isActive 
            ? "bg-tiktool-gray text-white" 
            : "hover:bg-tiktool-gray/50"
        )}
      >
        {children}
      </Button>
    </Link>
  );
};

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      {isMobile && (
        <header className="bg-tiktool-dark border-b border-tiktool-gray/30 p-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold tiktool-gradient-text">
            TikTool
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </Button>
        </header>
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-tiktool-dark w-full md:w-64 border-r border-tiktool-gray/30 p-4",
          isMobile ? "fixed top-14 bottom-0 z-40 transition-all duration-300" : "sticky top-0 h-screen",
          isMobile && !isSidebarOpen ? "-left-full" : isMobile ? "left-0" : ""
        )}
      >
        {!isMobile && (
          <Link to="/" className="flex items-center gap-2 mb-8">
            <span className="text-xl font-bold tiktool-gradient-text">TikTool</span>
          </Link>
        )}
        
        <nav className="space-y-6">
          <div>
            <h3 className="text-xs uppercase text-muted-foreground font-medium mb-2">Painel</h3>
            <NavItem to="/dashboard" currentPath={location.pathname}>
              Dashboard
            </NavItem>
          </div>
          
          <div>
            <h3 className="text-xs uppercase text-muted-foreground font-medium mb-2">Ferramentas</h3>
            <NavItem to="/connect-earn" currentPath={location.pathname}>
              Conecte e Ganhe
            </NavItem>
            <NavItem to="/video-ideas" currentPath={location.pathname}>
              Ideias para Vídeo
            </NavItem>
            <NavItem to="/hashtag-generator" currentPath={location.pathname}>
              Gerador de Hashtags
            </NavItem>
            <NavItem to="/profile-analysis" currentPath={location.pathname}>
              Análise de Perfil
            </NavItem>
            <NavItem to="/likes-views" currentPath={location.pathname}>
              Ganhe Likes e Views
            </NavItem>
            <NavItem to="/daily-challenge" currentPath={location.pathname}>
              Desafio Diário
            </NavItem>
          </div>
          
          <div className="pt-6 mt-6 border-t border-tiktool-gray/30">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-left text-muted-foreground"
              onClick={handleSignOut}
            >
              Sair
            </Button>
          </div>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
