
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Clock, Award } from "lucide-react";

interface StatsData {
  totalUsers: number;
  newUsersToday: number;
  activeUsers: number;
  premiumUsers: number;
  totalPoints: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    newUsersToday: 0,
    activeUsers: 0,
    premiumUsers: 0,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [pointsDistribution, setPointsDistribution] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total users count
        const { count: totalUsers, error: usersError } = await supabase
          .from('auth.users')
          .select('*', { count: 'exact', head: true });

        // Get premium users
        const { count: premiumUsers, error: premiumError } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('subscribed', true);

        // Get total points in the system
        const { data: pointsData, error: pointsError } = await supabase
          .from('user_statistics')
          .select('points');

        const totalPoints = pointsData 
          ? pointsData.reduce((sum, user) => sum + (user.points || 0), 0)
          : 0;

        // Get new users today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: newUsersToday, error: newUsersError } = await supabase
          .from('auth.users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());

        // Simulate active users for demo (would need actual login tracking)
        const activeUsers = Math.floor(totalUsers * 0.3);

        setStats({
          totalUsers: totalUsers || 0,
          newUsersToday: newUsersToday || 0,
          activeUsers,
          premiumUsers: premiumUsers || 0,
          totalPoints
        });

        // Create sample growth data (would be replaced with real data)
        const growth = [
          { name: 'Jan', users: 30 },
          { name: 'Feb', users: 45 },
          { name: 'Mar', users: 68 },
          { name: 'Apr', users: 90 },
          { name: 'May', users: 120 },
          { name: 'Jun', users: 150 },
        ];
        setUserGrowthData(growth);

        // Points distribution by tier
        const pointsTiers = [
          { name: '0-100', value: 45 },
          { name: '101-500', value: 30 },
          { name: '501-1000', value: 15 },
          { name: '1000+', value: 10 },
        ];
        setPointsDistribution(pointsTiers);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Colors for the pie chart
  const COLORS = ['#8B5CF6', '#D946EF', '#EC4899', '#F97316'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Visão Geral</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats.newUsersToday} hoje
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Ativos
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Premium
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.premiumUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.premiumUsers / stats.totalUsers) * 100)}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Pontos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Em circulação
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Usuários</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#8B5CF6" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Pontos</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pointsDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pointsDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
