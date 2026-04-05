import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import ListingForm from "./pages/ListingForm";
import MyListings from "./pages/MyListings";
import MyRequests from "./pages/MyRequests";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/new" element={<ListingForm />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/listings/:id/edit" element={<ListingForm />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
