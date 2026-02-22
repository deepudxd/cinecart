import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Film, ShoppingCart, LogOut, Shield, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { seats, snacks } = useCart();
  const navigate = useNavigate();
  const itemCount = seats.length + snacks.reduce((s, i) => s + i.quantity, 0);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Film className="w-7 h-7 text-primary transition-transform group-hover:rotate-12" />
          <span className="text-xl font-display font-bold text-gradient">CineCart</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-primary hover:text-primary/80">
                  <Shield className="w-4 h-4 mr-1" /> Admin
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate("/my-orders")}>
                <Receipt className="w-4 h-4 mr-1" /> My Orders
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/checkout")} className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
