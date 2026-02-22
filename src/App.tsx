import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import MovieDetails from "@/pages/MovieDetails";
import SeatSelection from "@/pages/SeatSelection";
import Snacks from "@/pages/Snacks";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import AdminDashboard from "@/pages/AdminDashboard";
import MyOrders from "@/pages/MyOrders";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/seats/:showId" element={<SeatSelection />} />
              <Route path="/snacks" element={<Snacks />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success/:orderId" element={<OrderSuccess />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
