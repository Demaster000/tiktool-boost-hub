
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import AdminDashboard from "@/components/admin/AdminDashboard";
import UserManagement from "@/components/admin/UserManagement";
import AdsManagement from "@/components/admin/AdsManagement";
import { ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// List of user IDs that have admin access
const ADMIN_USER_IDS = [
  "00000000-0000-0000-0000-000000000000", // Replace with actual admin UUIDs
  "47ae5fa0-2226-4ef3-817c-16697bde836a", // bielhenrique2@gmail.com
];

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        // Check if user is in admin list
        const hasAccess = ADMIN_USER_IDS.includes(user.id);
        
        if (!hasAccess) {
          // Additional check from database if needed
          const { data, error } = await supabase
            .from("admin_users")
            .select("id")
            .eq("user_id", user.id)
            .single();
            
          if (!error && data) {
            setIsAdmin(true);
          } else {
            toast({
              title: "Acesso negado",
              description: "Você não tem permissão para acessar o painel de administração.",
              variant: "destructive",
            });
            navigate("/dashboard");
          }
        } else {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tiktool-pink"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-8 w-8 text-tiktool-pink" />
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie usuários, visualize estatísticas e configure anúncios
          </p>
        </header>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="ads">Anúncios</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="ads">
            <AdsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
