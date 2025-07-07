
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
import Subscriptions from "./pages/Subscriptions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <NotificationProvider>
          <Toaster />
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/watch/:id" element={<VideoWatch />} />
              <Route path="/info" element={<Info />} />
              <Route path="/admin/approvals" element={<AdminApprovals />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
