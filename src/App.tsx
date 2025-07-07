
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Navbar from "./components/Navbar";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import VideoWatch from "./pages/VideoWatch";
import Info from "./pages/Info";
import AdminApprovals from "./pages/AdminApprovals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <NotificationProvider>
          <Toaster />
          <BrowserRouter>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
              <Navbar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/watch/:id" element={<VideoWatch />} />
                <Route path="/info" element={<Info />} />
                <Route path="/admin/approvals" element={<AdminApprovals />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
