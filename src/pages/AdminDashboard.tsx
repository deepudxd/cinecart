import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Package, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const AdminDashboard = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [filterShow, setFilterShow] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/");
  }, [isAdmin, authLoading]);

  useEffect(() => {
    const fetchData = async () => {
      const [ordersRes, showsRes] = await Promise.all([
        supabase.from("orders").select("*, shows(show_time, screen, movies(title))").order("created_at", { ascending: false }),
        supabase.from("shows").select("*, movies(title)").order("show_time"),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (showsRes.data) setShows(showsRes.data);
      setLoading(false);
    };
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const filtered = filterShow === "all" ? orders : orders.filter((o) => o.show_id === filterShow);
  const totalRevenue = filtered.reduce((s, o) => s + Number(o.total_amount), 0);

  if (authLoading || loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">Admin Dashboard</h1>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: DollarSign, label: "Revenue", value: `₹${totalRevenue}` },
              { icon: Package, label: "Orders", value: filtered.length },
              { icon: CheckCircle, label: "Confirmed", value: filtered.filter((o) => o.status === "Confirmed").length },
              { icon: Clock, label: "Preparing", value: filtered.filter((o) => o.status === "Preparing").length },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="glass rounded-xl p-4">
                <Icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-display font-bold">{value}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="mb-6">
            <Select value={filterShow} onValueChange={setFilterShow}>
              <SelectTrigger className="w-64 glass border-border/50">
                <SelectValue placeholder="Filter by show" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shows</SelectItem>
                {shows.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {(s as any).movies?.title} - {format(new Date(s.show_time), "MMM d, h:mm a")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Orders table */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 text-muted-foreground font-medium">Order ID</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Movie</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Show</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Amount</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr key={order.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="p-4 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                      <td className="p-4">{(order.shows as any)?.movies?.title || "—"}</td>
                      <td className="p-4 text-muted-foreground">{order.shows ? format(new Date((order.shows as any).show_time), "MMM d, h:mm a") : "—"}</td>
                      <td className="p-4 font-medium">₹{order.total_amount}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "Ready" ? "bg-green-500/10 text-green-400" :
                          order.status === "Preparing" ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-primary/10 text-primary"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, "Preparing")}
                            className="text-xs border-border/50 hover:border-yellow-500 hover:text-yellow-400">
                            Preparing
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, "Ready")}
                            className="text-xs border-border/50 hover:border-green-500 hover:text-green-400">
                            Ready
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No orders yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
