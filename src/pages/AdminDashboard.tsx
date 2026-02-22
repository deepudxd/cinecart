import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Package, Clock, CheckCircle, Film, Popcorn, LayoutDashboard, Plus, Trash2, CalendarClock, MonitorPlay } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Tab = "orders" | "movies" | "snacks";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "orders", label: "Orders", icon: LayoutDashboard },
  { id: "movies", label: "Movies", icon: Film },
  { id: "snacks", label: "Snacks", icon: Popcorn },
];

// ─── Add Movie Form ───────────────────────────────────────────────────────────
const AddMovieForm = () => {
  const emptyMovie = { title: "", duration: "", genre: "", rating: "", description: "", poster_url: "" };
  const emptyShow = { movie_id: "", screen: "", show_time: "" };

  const [movieForm, setMovieForm] = useState(emptyMovie);
  const [showForm, setShowForm] = useState(emptyShow);
  const [savingMovie, setSavingMovie] = useState(false);
  const [savingShow, setSavingShow] = useState(false);
  const [movies, setMovies] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);

  const fetchMovies = async () => {
    const { data } = await supabase.from("movies").select("*").order("created_at", { ascending: false });
    if (data) setMovies(data);
  };

  const fetchShows = async () => {
    const { data } = await supabase
      .from("shows")
      .select("*, movies(title)")
      .order("show_time", { ascending: true });
    if (data) setShows(data);
  };

  useEffect(() => { fetchMovies(); fetchShows(); }, []);

  const setM = (k: string, v: string) => setMovieForm((p) => ({ ...p, [k]: v }));
  const setS = (k: string, v: string) => setShowForm((p) => ({ ...p, [k]: v }));

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieForm.title || !movieForm.duration) { toast.error("Title and duration are required"); return; }
    setSavingMovie(true);
    const { error } = await supabase.from("movies").insert([movieForm]);
    setSavingMovie(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Movie added!");
    setMovieForm(emptyMovie);
    fetchMovies();
  };

  const handleAddShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showForm.movie_id || !showForm.screen || !showForm.show_time) {
      toast.error("Movie, screen, and show time are required"); return;
    }
    setSavingShow(true);
    const { data: showData, error } = await supabase.from("shows").insert([{
      movie_id: showForm.movie_id,
      screen: showForm.screen,
      show_time: new Date(showForm.show_time).toISOString(),
    }]).select().single();

    if (error || !showData) { setSavingShow(false); toast.error(error?.message ?? "Failed to create show"); return; }

    // Auto-generate all seats for this show (rows A–H × cols 1–8 = 64 seats)
    const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const COLS = 8;
    const seatRows = ROWS.flatMap((row) =>
      Array.from({ length: COLS }, (_, i) => ({
        show_id: showData.id,
        seat_number: `${row}${i + 1}`,
        is_booked: false,
      }))
    );
    const { error: seatError } = await supabase.from("seats").insert(seatRows);
    setSavingShow(false);
    if (seatError) { toast.error("Show created but seats failed: " + seatError.message); return; }

    toast.success("Show scheduled with 64 seats!");
    setShowForm(emptyShow);
    fetchShows();
  };

  const handleDeleteMovie = async (id: string) => {
    const { error } = await supabase.from("movies").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Movie deleted");
    fetchMovies(); fetchShows();
  };

  const handleDeleteShow = async (id: string) => {
    const { error } = await supabase.from("shows").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Show removed");
    fetchShows();
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Add Movie Form */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Add New Movie
          </h2>
          <form onSubmit={handleAddMovie} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
              <Input className="glass border-border/50" placeholder="e.g. Interstellar" value={movieForm.title} onChange={(e) => setM("title", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Duration *</label>
                <Input className="glass border-border/50" placeholder="e.g. 2h 49m" value={movieForm.duration} onChange={(e) => setM("duration", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Rating</label>
                <Input className="glass border-border/50" placeholder="e.g. PG-13" value={movieForm.rating} onChange={(e) => setM("rating", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Genre</label>
              <Input className="glass border-border/50" placeholder="e.g. Sci-Fi, Action" value={movieForm.genre} onChange={(e) => setM("genre", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Poster URL</label>
              <Input className="glass border-border/50" placeholder="https://..." value={movieForm.poster_url} onChange={(e) => setM("poster_url", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Textarea className="glass border-border/50 resize-none" rows={3} placeholder="Short synopsis..." value={movieForm.description} onChange={(e) => setM("description", e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={savingMovie}>
              {savingMovie ? "Adding..." : "Add Movie"}
            </Button>
          </form>
        </div>

        {/* Movie list */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-display font-semibold mb-4">Existing Movies ({movies.length})</h2>
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {movies.length === 0 && <p className="text-muted-foreground text-sm">No movies yet.</p>}
            {movies.map((m) => (
              <div key={m.id} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                {m.poster_url ? (
                  <img src={m.poster_url} alt={m.title} className="w-10 h-14 object-cover rounded" />
                ) : (
                  <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                    <Film className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.genre} · {m.duration}</p>
                </div>
                <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleDeleteMovie(m.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Schedule Shows ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Add Show Form */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" /> Schedule a Show
          </h2>
          <form onSubmit={handleAddShow} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Movie *</label>
              <Select value={showForm.movie_id} onValueChange={(v) => setS("movie_id", v)}>
                <SelectTrigger className="glass border-border/50">
                  <SelectValue placeholder="Select a movie" />
                </SelectTrigger>
                <SelectContent>
                  {movies.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Screen *</label>
              <Select value={showForm.screen} onValueChange={(v) => setS("screen", v)}>
                <SelectTrigger className="glass border-border/50">
                  <SelectValue placeholder="Select screen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Screen 1">Screen 1</SelectItem>
                  <SelectItem value="Screen 2">Screen 2</SelectItem>
                  <SelectItem value="Screen 3">Screen 3</SelectItem>
                  <SelectItem value="Screen 4">Screen 4</SelectItem>
                  <SelectItem value="IMAX">IMAX</SelectItem>
                  <SelectItem value="4DX">4DX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date & Time *</label>
              <Input
                type="datetime-local"
                className="glass border-border/50"
                value={showForm.show_time}
                onChange={(e) => setS("show_time", e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={savingShow}>
              {savingShow ? "Scheduling..." : "Schedule Show"}
            </Button>
          </form>
        </div>

        {/* Shows list */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-display font-semibold mb-4">Scheduled Shows ({shows.length})</h2>
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {shows.length === 0 && <p className="text-muted-foreground text-sm">No shows scheduled yet.</p>}
            {shows.map((s) => (
              <div key={s.id} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MonitorPlay className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{(s as any).movies?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.screen} · {format(new Date(s.show_time), "dd MMM yyyy, h:mm a")}
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleDeleteShow(s.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Add Snack Form ───────────────────────────────────────────────────────────
const AddSnackForm = () => {
  const empty = { name: "", price: "", category: "snack", image_url: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [snacks, setSnacks] = useState<any[]>([]);

  const fetchSnacks = async () => {
    const { data } = await supabase.from("snacks").select("*").order("created_at", { ascending: false });
    if (data) setSnacks(data);
  };

  useEffect(() => { fetchSnacks(); }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error("Name and price are required"); return; }
    if (isNaN(Number(form.price)) || Number(form.price) <= 0) { toast.error("Enter a valid price"); return; }
    setSaving(true);
    const { error } = await supabase.from("snacks").insert([{ ...form, price: Number(form.price) }]);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Snack added!");
    setForm(empty);
    fetchSnacks();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("snacks").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Snack deleted");
    fetchSnacks();
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Form */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" /> Add New Snack
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
            <Input className="glass border-border/50" placeholder="e.g. Butter Popcorn" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Price (₹) *</label>
              <Input className="glass border-border/50" type="number" placeholder="150" value={form.price} onChange={(e) => set("price", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="glass border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="snack">Snack</SelectItem>
                  <SelectItem value="drink">Drink</SelectItem>
                  <SelectItem value="combo">Combo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Image URL</label>
            <Input className="glass border-border/50" placeholder="https://..." value={form.image_url} onChange={(e) => set("image_url", e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Adding..." : "Add Snack"}
          </Button>
        </form>
      </div>

      {/* Snack list */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-display font-semibold mb-4">Existing Snacks ({snacks.length})</h2>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {snacks.length === 0 && <p className="text-muted-foreground text-sm">No snacks yet.</p>}
          {snacks.map((s) => (
            <div key={s.id} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
              {s.image_url ? (
                <img src={s.image_url} alt={s.name} className="w-10 h-10 object-cover rounded-lg" />
              ) : (
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Popcorn className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{s.category} · ₹{s.price}</p>
              </div>
              <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleDelete(s.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [filterShow, setFilterShow] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [ordersView, setOrdersView] = useState<"active" | "history">("active");

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

  const byShow = filterShow === "all" ? orders : orders.filter((o) => o.show_id === filterShow);
  const activeOrders = byShow.filter((o) => o.status !== "Collected");
  const historyOrders = byShow.filter((o) => o.status === "Collected");
  const filtered = ordersView === "active" ? activeOrders : historyOrders;
  const totalRevenue = activeOrders.reduce((s, o) => s + Number(o.total_amount), 0);

  if (authLoading || loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">Admin Dashboard</h1>

          {/* Stats (only on orders tab) */}
          {activeTab === "orders" && (
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
          )}

          {/* Tab Nav */}
          <div className="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "orders" && (
                <>
                  {/* Filter + sub-tab row */}
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <Select value={filterShow} onValueChange={setFilterShow}>
                      <SelectTrigger className="w-56 glass border-border/50">
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

                    {/* Active / History toggle */}
                    <div className="flex gap-1 glass rounded-xl p-1">
                      {(["active", "history"] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setOrdersView(v)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${ordersView === v ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          {v} ({v === "active" ? activeOrders.length : historyOrders.length})
                        </button>
                      ))}
                    </div>
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
                            {ordersView === "active" && <th className="text-left p-4 text-muted-foreground font-medium">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((order) => (
                            <tr key={order.id} className={`border-b border-border/30 transition-colors ${order.status === "Collected" ? "opacity-50" : "hover:bg-secondary/30"
                              }`}>
                              <td className="p-4 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                              <td className="p-4">{(order.shows as any)?.movies?.title || "—"}</td>
                              <td className="p-4 text-muted-foreground">
                                {order.shows ? format(new Date((order.shows as any).show_time), "MMM d, h:mm a") : "—"}
                              </td>
                              <td className="p-4 font-medium">₹{order.total_amount}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === "Ready" ? "bg-green-500/10 text-green-400" :
                                    order.status === "Preparing" ? "bg-yellow-500/10 text-yellow-400" :
                                      order.status === "Collected" ? "bg-muted/30 text-muted-foreground" :
                                        "bg-primary/10 text-primary"
                                  }`}>
                                  {order.status}
                                </span>
                              </td>
                              {ordersView === "active" && (
                                <td className="p-4">
                                  <div className="flex gap-2 flex-wrap">
                                    <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, "Preparing")}
                                      className="text-xs border-border/50 hover:border-yellow-500 hover:text-yellow-400">
                                      Preparing
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, "Ready")}
                                      className="text-xs border-border/50 hover:border-green-500 hover:text-green-400">
                                      Ready
                                    </Button>
                                    {order.status === "Ready" && (
                                      <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, "Collected")}
                                        className="text-xs border-border/50 hover:border-primary hover:text-primary">
                                        ✓ Collected
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                          {filtered.length === 0 && (
                            <tr><td colSpan={ordersView === "active" ? 6 : 5} className="p-8 text-center text-muted-foreground">
                              {ordersView === "active" ? "No active orders." : "No collected orders yet."}
                            </td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "movies" && <AddMovieForm />}
              {activeTab === "snacks" && <AddSnackForm />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
