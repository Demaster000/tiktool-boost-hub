
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ConnectEarn from "./pages/ConnectEarn";
import VideoIdeas from "./pages/VideoIdeas";
import ProfileAnalysis from "./pages/ProfileAnalysis";
import NotFound from "./pages/NotFound";
import HashtagGenerator from "./pages/HashtagGenerator";
import LikesViews from "./pages/LikesViews";
import DailyChallenge from "./pages/DailyChallenge";
import PrivateRoute from "./components/PrivateRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/connect-earn" element={<PrivateRoute><ConnectEarn /></PrivateRoute>} />
            <Route path="/video-ideas" element={<PrivateRoute><VideoIdeas /></PrivateRoute>} />
            <Route path="/profile-analysis" element={<PrivateRoute><ProfileAnalysis /></PrivateRoute>} />
            <Route path="/hashtag-generator" element={<PrivateRoute><HashtagGenerator /></PrivateRoute>} />
            <Route path="/likes-views" element={<PrivateRoute><LikesViews /></PrivateRoute>} />
            <Route path="/daily-challenge" element={<PrivateRoute><DailyChallenge /></PrivateRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
