import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Film, Ticket, ShoppingBag, CheckCircle, Clock, ChefHat, Star, QrCode, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

const STATUS_STYLES: Record<string, { cls: string; icon: React.ElementType }> = {
    Confirmed: { cls: "bg-primary/10 text-primary", icon: CheckCircle },
    Preparing: { cls: "bg-yellow-500/10 text-yellow-400", icon: ChefHat },
    Ready: { cls: "bg-green-500/10 text-green-400", icon: Star },
    Collected: { cls: "bg-muted/30 text-muted-foreground", icon: CheckCircle },
};

const MyOrders = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"active" | "history">("active");
    const [qrOrder, setQrOrder] = useState<any | null>(null); // order shown in modal

    useEffect(() => {
        if (!authLoading && !user) navigate("/auth");
    }, [user, authLoading]);

    useEffect(() => {
        if (!user) return;
        const fetchOrders = async () => {
            const { data } = await supabase
                .from("orders")
                .select(`*, shows(show_time, screen, movies(title)), order_seats(seat_id, seats(seat_number)), order_items(quantity, snacks(name))`)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (data) setOrders(data);
            setLoading(false);
        };
        fetchOrders();

        const channel = supabase
            .channel("my-orders-realtime")
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, fetchOrders)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user]);

    if (authLoading || loading) return (
        <div className="min-h-screen pt-24 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const active = orders.filter((o) => o.status !== "Collected");
    const history = orders.filter((o) => o.status === "Collected");
    const shown = tab === "active" ? active : history;

    return (
        <div className="min-h-screen pt-20 pb-12 px-4">
            <div className="container mx-auto max-w-2xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">My Orders</h1>

                    {/* Tab toggle */}
                    <div className="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
                        {(["active", "history"] as const).map((t) => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                                    }`}>
                                {t === "active" ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                {t} {t === "active" ? `(${active.length})` : `(${history.length})`}
                            </button>
                        ))}
                    </div>

                    {shown.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Film className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="text-lg">{tab === "active" ? "No active orders." : "No past orders yet."}</p>
                            {tab === "active" && <p className="text-sm mt-1">Book a movie to get started!</p>}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {shown.map((order, i) => {
                                const show = order.shows as any;
                                const seatNums = (order.order_seats as any[])?.map((s: any) => s.seats?.seat_number).filter(Boolean) ?? [];
                                const snackItems = (order.order_items as any[])?.map((it: any) => `${it.snacks?.name} ×${it.quantity}`).filter(Boolean) ?? [];
                                const { cls, icon: Icon } = STATUS_STYLES[order.status] ?? STATUS_STYLES["Confirmed"];

                                return (
                                    <motion.div key={order.id}
                                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className={`glass rounded-xl p-5 ${order.status === "Collected" ? "opacity-60" : ""}`}
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="font-display font-semibold text-base">{show?.movies?.title ?? "—"}</p>
                                                {show && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {format(new Date(show.show_time), "dd MMM yyyy, h:mm a")} · {show.screen}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
                                                <Icon className="w-3 h-3" /> {order.status}
                                            </span>
                                        </div>

                                        {/* Details */}
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-start gap-2">
                                                <Ticket className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Seats</p>
                                                    <p className="font-medium">{seatNums.length > 0 ? seatNums.join(", ") : "—"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <ShoppingBag className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Snacks</p>
                                                    <p className="font-medium">{snackItems.length > 0 ? snackItems.join(", ") : "None"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground font-mono">{order.id.slice(0, 8)}…</p>
                                            <div className="flex items-center gap-3">
                                                <p className="font-display font-bold text-primary">₹{order.total_amount}</p>
                                                {/* QR button — only on active orders */}
                                                {tab === "active" && (
                                                    <Button size="sm" variant="outline"
                                                        className="text-xs border-border/50 hover:border-primary hover:text-primary gap-1"
                                                        onClick={() => setQrOrder({ order, show, seatNums })}>
                                                        <QrCode className="w-3.5 h-3.5" /> View Ticket
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── QR Modal ── */}
            <AnimatePresence>
                {qrOrder && (() => {
                    const { order, show, seatNums } = qrOrder;
                    const qrData = JSON.stringify({
                        orderId: order.id,
                        paymentId: order.payment_id,
                        seats: seatNums,
                        showTime: show?.show_time,
                    });
                    return (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                            onClick={() => setQrOrder(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ type: "spring", duration: 0.3 }}
                                className="glass rounded-2xl p-8 max-w-sm w-full text-center relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Close */}
                                <button onClick={() => setQrOrder(null)}
                                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
                                    <X className="w-5 h-5" />
                                </button>

                                <h2 className="text-xl font-display font-bold mb-1">Your Ticket</h2>
                                <p className="text-muted-foreground text-sm mb-5">{show?.movies?.title}</p>

                                {/* QR Code */}
                                <div className="bg-background/50 rounded-xl p-5 inline-block mb-5 animate-pulse-glow">
                                    <QRCodeSVG value={qrData} size={180} bgColor="transparent" fgColor="hsl(25, 100%, 50%)" level="M" />
                                </div>

                                {/* Details */}
                                <div className="space-y-1.5 text-sm text-left bg-secondary/30 rounded-xl p-4">
                                    {show && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Show</span>
                                                <span className="font-medium">{format(new Date(show.show_time), "dd MMM, h:mm a")}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Screen</span>
                                                <span className="font-medium">{show.screen}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Seats</span>
                                        <span className="font-medium">{seatNums.join(", ") || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status</span>
                                        <span className={`font-medium ${order.status === "Ready" ? "text-green-400" :
                                                order.status === "Preparing" ? "text-yellow-400" : "text-primary"
                                            }`}>{order.status}</span>
                                    </div>
                                    <div className="flex justify-between pt-1.5 border-t border-border/30">
                                        <span className="text-muted-foreground">Total</span>
                                        <span className="font-display font-bold text-primary">₹{order.total_amount}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground mt-4">Show this QR at the counter to collect your order</p>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
};

export default MyOrders;
