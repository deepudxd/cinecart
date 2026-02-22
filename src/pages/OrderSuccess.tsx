import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { motion } from "framer-motion";

const OrderSuccess = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [show, setShow] = useState<any>(null);
  const [seats, setSeats] = useState<string[]>([]);
  const [countdown, setCountdown] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      const { data: orderData } = await supabase.from("orders").select("*").eq("id", orderId!).single();
      if (!orderData) return;
      setOrder(orderData);

      const [showRes, seatsRes] = await Promise.all([
        supabase.from("shows").select("*, movies(title)").eq("id", orderData.show_id).single(),
        supabase.from("order_seats").select("seat_id, seats(seat_number)").eq("order_id", orderId!),
      ]);
      if (showRes.data) setShow(showRes.data);
      if (seatsRes.data) setSeats(seatsRes.data.map((s: any) => s.seats?.seat_number || ""));
    };
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!show) return;
    const timer = setInterval(() => {
      const diff = differenceInSeconds(new Date(show.show_time), new Date());
      if (diff <= 0) { setCountdown("Show started!"); clearInterval(timer); return; }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setCountdown(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [show]);

  if (!order) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const qrData = JSON.stringify({ orderId: order.id, paymentId: order.payment_id, seats, showTime: show?.show_time });

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-8 max-w-md w-full text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        </motion.div>
        <h1 className="text-2xl font-display font-bold mb-1">Booking Confirmed! 🎬</h1>
        <p className="text-muted-foreground mb-6">Your tickets are ready</p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="bg-background/50 rounded-xl p-6 mb-6 inline-block animate-pulse-glow"
        >
          <QRCodeSVG value={qrData} size={180} bgColor="transparent" fgColor="hsl(25, 100%, 50%)" level="M" />
        </motion.div>

        <div className="space-y-2 text-sm mb-6">
          {show && (
            <>
              <p><span className="text-muted-foreground">Movie:</span> {(show as any).movies?.title}</p>
              <p><span className="text-muted-foreground">Show:</span> {format(new Date(show.show_time), "MMM d, h:mm a")}</p>
            </>
          )}
          <p><span className="text-muted-foreground">Seats:</span> {seats.join(", ")}</p>
          <p><span className="text-muted-foreground">Total:</span> ₹{order.total_amount}</p>
          <p><span className="text-muted-foreground">Payment:</span> {order.payment_id}</p>
        </div>

        {countdown && (
          <div className="glass rounded-lg p-3 mb-6">
            <p className="text-xs text-muted-foreground">Show starts in</p>
            <p className="text-xl font-display font-bold text-gradient">{countdown}</p>
          </div>
        )}

        <Button onClick={() => navigate("/")} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Home className="w-4 h-4 mr-2" /> Back to Home
        </Button>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
