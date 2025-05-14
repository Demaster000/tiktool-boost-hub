
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  checkSubscription: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add this to window for external use (like subscription update)
declare global {
  interface Window {
    updateUserPremiumStatus?: (isPremium: boolean) => void;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      console.log("Checking subscription status for user:", user.id);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error("Error from check-subscription function:", error);
        throw error;
      }
      
      if (data) {
        console.log("Subscription check response:", data);
        setIsPremium(data.subscribed === true);
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  // Make function available to other components
  useEffect(() => {
    window.updateUserPremiumStatus = setIsPremium;
    
    return () => {
      delete window.updateUserPremiumStatus;
    };
  }, []);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check subscription status on auth state change
        if (session?.user) {
          setTimeout(() => {
            checkSubscription();
          }, 0);
        } else {
          setIsPremium(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Got existing session:", session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check subscription status for existing session
      if (session?.user) {
        setTimeout(() => {
          checkSubscription();
        }, 0);
      }
    });

    // Set up realtime subscription listener for subscription changes
    if (user) {
      const subscriptionChannel = supabase
        .channel('subscription-changes')
        .on('postgres_changes', 
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'subscribers',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Subscription updated via realtime:', payload);
            if (payload.new && payload.new.subscribed !== undefined) {
              setIsPremium(payload.new.subscribed === true);
            }
          }
        )
        .subscribe();
        
      return () => {
        subscription.unsubscribe();
        supabase.removeChannel(subscriptionChannel);
      };
    }

    return () => subscription.unsubscribe();
  }, [user?.id]);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Conta criada com sucesso",
        description: "Você foi automaticamente logado.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message,
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Login realizado com sucesso",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message,
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear local storage of any auth tokens
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase.auth')) {
          localStorage.removeItem(key);
        }
      });
      
      // Perform the actual sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) throw error;
      
      // Reset state
      setUser(null);
      setSession(null);
      setIsPremium(false);
      
      toast({
        title: "Logout realizado com sucesso",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer logout",
        description: error.message,
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      isPremium, 
      checkSubscription, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
