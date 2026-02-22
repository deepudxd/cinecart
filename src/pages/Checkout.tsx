import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Ticket, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Checkout = () => {
  const { selectedShow, seats, snacks, getTotal, getSeatTotal, getSnackTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!user || !selectedShow || seats.length === 0) {
      toast({ title: "Missing info", description: "Please select seats first.", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      // Simulate Razorpay test payment
      const paymentId = `pay_test_${Date.now()}`;

      // Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({ user_id: user.id, show_id: selectedShow.id, total_amount: getTotal(), status: "Confirmed", payment_id: paymentId })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // Book seats
      for (const seat of seats) {
        await supabase.from("seats").update({ is_booked: true }).eq("id", seat.id);
        await supabase.from("order_seats").insert({ order_id: order.id, seat_id: seat.id });
      }

      // Save snack order items
      for (const snack of snacks) {
        await supabase.from("order_items").insert({ order_id: order.id, snack_id: snack.id, quantity: snack.quantity });
      }

      clearCart();
      toast({ title: "Payment Successful! 🎬" });
      navigate(`/order-success/${order.id}`);
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (!selectedShow || seats.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <p>Your cart is empty.</p>
        <Button onClick={() => navigate("/")} className="bg-primary text-primary-foreground">Browse Movies</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">Checkout</h1>

          <div className="glass rounded-xl p-5 mb-4">
            <h2 className="font-display font-semibold mb-3 flex items-center gap-2"><Ticket className="w-4 h-4 text-primary" /> {selectedShow.movie_title}</h2>
            <p className="text-sm text-muted-foreground">{format(new Date(selectedShow.show_time), "EEEE, MMM d • h:mm a")} • {selectedShow.screen}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {seats.map((s) => (
                <span key={s.id} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">{s.seat_number}</span>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">{seats.length} × ₹200</span>
              <span className="font-medium">₹{getSeatTotal()}</span>
            </div>
          </div>

          {snacks.length > 0 && (
            <div className="glass rounded-xl p-5 mb-4">
              <h2 className="font-display font-semibold mb-3 flex items-center gap-2"><UtensilsCrossed className="w-4 h-4 text-primary" /> Snacks</h2>
              {snacks.map((s) => (
                <div key={s.id} className="flex justify-between text-sm py-1">
                  <span>{s.name} × {s.quantity}</span>
                  <span>₹{s.price * s.quantity}</span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-border/50 flex justify-between text-sm">
                <span className="text-muted-foreground">Snacks Total</span>
                <span className="font-medium">₹{getSnackTotal()}</span>
              </div>
            </div>
          )}

          <div className="glass rounded-xl p-5 mb-6">
            <div className="flex justify-between text-lg font-display font-bold">
              <span>Total</span>
              <span className="text-gradient">₹{getTotal()}</span>
            </div>
          </div>

          <Button
            onClick={handlePayment}
            disabled={processing}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary h-12 text-base font-semibold"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-5 h-5 mr-2" /> Pay ₹{getTotal()}</>}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">Razorpay Test Mode • No real charges</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
