
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
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface StatsData {
  totalUsers: number;
  newUsersToday: number;
  activeUsers: number;
  premiumUsers: number;
  totalPoints: number;
}

interface UserGrowthData {
  name: string;
  users: number;
}

interface PointsDistributionData {
  name: string;
  value: number;
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
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [pointsDistribution, setPointsDistribution] = useState<PointsDistributionData[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Get total users count
        const { count: totalUsers, error: usersError } = await supabase
          .from('user_statistics')
          .select('*', { count: 'exact', head: true });
        
        if (usersError) {
          console.error("Error fetching total users:", usersError);
          throw usersError;
        }

        // Get premium users
        const { count: premiumUsers, error: premiumError } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('subscribed', true);
        
        if (premiumError) {
          console.error("Error fetching premium users:", premiumError);
          throw premiumError;
        }

        // Get total points in the system
        const { data: pointsData, error: pointsError } = await supabase
          .from('user_statistics')
          .select('points');
        
        if (pointsError) {
          console.error("Error fetching points data:", pointsError);
          throw pointsError;
        }

        const totalPoints = pointsData 
          ? pointsData.reduce((sum, user) => sum + (user.points || 0), 0)
          : 0;

        // Get new users today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: recentUserStats, error: recentUsersError } = await supabase
          .from('user_statistics')
          .select('created_at')
          .gte('created_at', today.toISOString());
        
        if (recentUsersError) {
          console.error("Error fetching recent users:", recentUsersError);
          throw recentUsersError;
        }

        const newUsersToday = recentUserStats?.length || 0;

        // For active users, we'll count those who have had activity in the last 7 days
        // For this example, we'll consider users with updates in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: activeUsers, error: activeUsersError } = await supabase
          .from('user_statistics')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', sevenDaysAgo.toISOString());
        
        if (activeUsersError) {
          console.error("Error fetching active users:", activeUsersError);
          throw activeUsersError;
        }

        setStats({
          totalUsers: totalUsers || 0,
          newUsersToday,
          activeUsers: activeUsers || 0,
          premiumUsers: premiumUsers || 0,
          totalPoints
        });

        // Fetch data for user growth chart - last 6 months
        await fetchUserGrowthData();

        // Generate points distribution data
        await fetchPointsDistribution();

      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const fetchUserGrowthData = async () => {
    try {
      // Generate last 6 months labels
      const months = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const today = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const month = new Date();
        month.setMonth(today.getMonth() - i);
        months.push({
          name: monthNames[month.getMonth()],
          startDate: new Date(month.getFullYear(), month.getMonth(), 1).toISOString(),
          endDate: new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString()
        });
      }

      // Fetch user registration data for each month
      const growthData = await Promise.all(
        months.map(async (month) => {
          const { count, error } = await supabase
            .from('user_statistics')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', month.startDate)
            .lte('created_at', month.endDate);
          
          if (error) {
            console.error(`Error fetching users for ${month.name}:`, error);
            return { name: month.name, users: 0 };
          }
          
          return { name: month.name, users: count || 0 };
        })
      );

      setUserGrowthData(growthData);
    } catch (error) {
      console.error("Error fetching user growth data:", error);
    }
  };

  const fetchPointsDistribution = async () => {
    try {
      const { data, error } = await supabase
        .from('user_statistics')
        .select('points');
      
      if (error) {
        console.error("Error fetching points distribution:", error);
        throw error;
      }

      // Define point ranges
      const ranges = [
        { min: 0, max: 100, name: '0-100' },
        { min: 101, max: 500, name: '101-500' },
        { min: 501, max: 1000, name: '501-1000' },
        { min: 1001, max: Infinity, name: '1000+' }
      ];

      // Count users in each range
      const distribution = ranges.map(range => {
        const count = data ? data.filter(user => 
          user.points >= range.min && user.points <= range.max
        ).length : 0;
        
        return { 
          name: range.name, 
          value: count 
        };
      });

      setPointsDistribution(distribution);
    } catch (error) {
      console.error("Error processing points distribution:", error);
    }
  };

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
              {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% do total
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
              {stats.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}% do total
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
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tiktool-pink"></div>
              </div>
            ) : (
              <ChartContainer 
                config={{
                  users: { label: "Usuários", color: "#8B5CF6" }
                }}
                className="h-[300px]"
              >
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6B7280" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6B7280" 
                    fontSize={12}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <ChartTooltipContent payload={payload} />
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    name="users"
                    stroke="var(--color-users, #8B5CF6)" 
                    strokeWidth={2} 
                    dot={{ r: 4, strokeWidth: 1 }} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Pontos</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tiktool-pink"></div>
              </div>
            ) : (
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
                  <Tooltip 
                    formatter={(value: any, name: any) => [`${value} usuários`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
