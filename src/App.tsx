
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

import LandingPage from "@/pages/LandingPage";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PrivateRoute from "@/components/PrivateRoute";
import VideoIdeas from "@/pages/VideoIdeas";
import HashtagGenerator from "@/pages/HashtagGenerator";
import ProfileAnalysis from "@/pages/ProfileAnalysis";
import DailyChallenge from "@/pages/DailyChallenge";
import ConnectEarn from "@/pages/ConnectEarn";
import LikesViews from "@/pages/LikesViews";
import NotFound from "@/pages/NotFound";
import MyProfile from "@/pages/MyProfile";

import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/connect-earn"
              element={
                <PrivateRoute>
                  <ConnectEarn />
                </PrivateRoute>
              }
            />
            <Route
              path="/video-ideas"
              element={
                <PrivateRoute>
                  <VideoIdeas />
                </PrivateRoute>
              }
            />
            <Route
              path="/hashtag-generator"
              element={
                <PrivateRoute>
                  <HashtagGenerator />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile-analysis"
              element={
                <PrivateRoute>
                  <ProfileAnalysis />
                </PrivateRoute>
              }
            />
            <Route
              path="/likes-views"
              element={
                <PrivateRoute>
                  <LikesViews />
                </PrivateRoute>
              }
            />
            <Route
              path="/daily-challenge"
              element={
                <PrivateRoute>
                  <DailyChallenge />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-profile"
              element={
                <PrivateRoute>
                  <MyProfile />
                </PrivateRoute>
              }
            />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
