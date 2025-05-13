
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Ban, Award, User, Edit, Save, X, Check } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_banned: boolean;
  premium: boolean;
  points: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState<number>(0);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState<number>(0);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get users from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;
      
      if (!authUsers?.users) {
        setUsers([]);
        return;
      }
      
      // Get subscription status
      const { data: subscribers, error: subError } = await supabase
        .from('subscribers')
        .select('user_id, subscribed');
        
      // Get points
      const { data: statistics, error: statsError } = await supabase
        .from('user_statistics')
        .select('user_id, points');
        
      // Combine the data
      const combinedUsers = authUsers.users.map(user => {
        const subscription = subscribers?.find(sub => sub.user_id === user.id);
        const stats = statistics?.find(stat => stat.user_id === user.id);
        
        return {
          id: user.id,
          email: user.email || 'No email',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          is_banned: user.banned || false,
          premium: subscription?.subscribed || false,
          points: stats?.points || 0
        };
      });
      
      setUsers(combinedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível obter a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      // Update user ban status
      await supabase.auth.admin.updateUserById(userId, { 
        ban_duration: isBanned ? 'none' : 'forever'
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_banned: !isBanned } : user
      ));
      
      toast({
        title: isBanned ? "Usuário desbanido" : "Usuário banido",
        description: `O usuário foi ${isBanned ? 'desbanido' : 'banido'} com sucesso.`,
      });
    } catch (error) {
      console.error("Error toggling ban status:", error);
      toast({
        title: "Erro ao alterar status do usuário",
        description: "Não foi possível alterar o status de banimento.",
        variant: "destructive",
      });
    }
  };

  const openPointsDialog = (user: UserData) => {
    setSelectedUser(user);
    setPointsToAdd(0);
    setShowPointsDialog(true);
  };

  const handleAddPoints = async () => {
    if (!selectedUser) return;
    
    try {
      // Get current points
      const { data, error } = await supabase
        .from('user_statistics')
        .select('points')
        .eq('user_id', selectedUser.id)
        .single();
      
      if (error) throw error;
      
      const currentPoints = data?.points || 0;
      const newPoints = currentPoints + pointsToAdd;
      
      // Update points
      await supabase
        .from('user_statistics')
        .update({ points: newPoints })
        .eq('user_id', selectedUser.id);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, points: newPoints } : user
      ));
      
      toast({
        title: "Pontos adicionados",
        description: `${pointsToAdd} pontos adicionados para o usuário.`,
      });
      
      setShowPointsDialog(false);
    } catch (error) {
      console.error("Error adding points:", error);
      toast({
        title: "Erro ao adicionar pontos",
        description: "Não foi possível atualizar os pontos.",
        variant: "destructive",
      });
    }
  };

  const openPlanDialog = (user: UserData) => {
    setSelectedUser(user);
    setIsPremium(user.premium);
    setShowPlanDialog(true);
  };

  const handleUpdatePlan = async () => {
    if (!selectedUser) return;
    
    try {
      // Check if subscription record exists
      const { data, error } = await supabase
        .from('subscribers')
        .select('id')
        .eq('user_id', selectedUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        // Update existing record
        await supabase
          .from('subscribers')
          .update({ 
            subscribed: isPremium,
            subscription_tier: isPremium ? 'Premium' : null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', selectedUser.id);
      } else {
        // Insert new record
        await supabase
          .from('subscribers')
          .insert({
            user_id: selectedUser.id,
            subscribed: isPremium,
            subscription_tier: isPremium ? 'Premium' : null,
          });
      }
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, premium: isPremium } : user
      ));
      
      toast({
        title: "Plano atualizado",
        description: `O usuário agora ${isPremium ? 'tem' : 'não tem'} acesso Premium.`,
      });
      
      setShowPlanDialog(false);
    } catch (error) {
      console.error("Error updating plan:", error);
      toast({
        title: "Erro ao atualizar plano",
        description: "Não foi possível alterar o plano do usuário.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
        <div className="w-72">
          <Input
            placeholder="Buscar por email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead>Último Login</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Pontos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktool-pink"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}...</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {user.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleDateString() 
                      : "Nunca"}
                  </TableCell>
                  <TableCell>
                    {user.is_banned ? (
                      <Badge variant="destructive">Banido</Badge>
                    ) : (
                      <Badge variant="outline">Ativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.premium ? "default" : "secondary"}>
                      {user.premium ? "Premium" : "Free"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editingUserId === user.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={editPoints}
                          onChange={(e) => setEditPoints(Number(e.target.value))}
                          className="w-20 h-8"
                        />
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={async () => {
                            try {
                              await supabase
                                .from('user_statistics')
                                .update({ points: editPoints })
                                .eq('user_id', user.id);
                                
                              setUsers(users.map(u => 
                                u.id === user.id ? { ...u, points: editPoints } : u
                              ));
                              setEditingUserId(null);
                            } catch (error) {
                              console.error("Error updating points:", error);
                              toast({
                                title: "Erro",
                                description: "Não foi possível atualizar os pontos.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => setEditingUserId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {user.points}
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => {
                            setEditingUserId(user.id);
                            setEditPoints(user.points);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBanUser(user.id, user.is_banned)}
                      >
                        {user.is_banned ? <Check className="h-4 w-4 mr-1" /> : <Ban className="h-4 w-4 mr-1" />}
                        {user.is_banned ? "Desbanir" : "Banir"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPointsDialog(user)}
                      >
                        <Award className="h-4 w-4 mr-1" />
                        Pontos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPlanDialog(user)}
                      >
                        <User className="h-4 w-4 mr-1" />
                        Plano
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Points Dialog */}
      <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Pontos</DialogTitle>
            <DialogDescription>
              Adicionar pontos para o usuário {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              type="number"
              placeholder="Quantidade de pontos"
              value={pointsToAdd}
              onChange={(e) => setPointsToAdd(Number(e.target.value))}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Pontos atuais: {selectedUser?.points}
              <br />
              Novos pontos: {(selectedUser?.points || 0) + pointsToAdd}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPointsDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPoints}>
              Adicionar Pontos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Update Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
            <DialogDescription>
              Alterar o plano para o usuário {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Acesso Premium</p>
                <p className="text-sm text-muted-foreground">
                  Ativar ou desativar o acesso premium para este usuário
                </p>
              </div>
              <Switch 
                checked={isPremium} 
                onCheckedChange={setIsPremium} 
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePlan}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
