import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

interface Snack {
  id: string; name: string; price: number; image_url: string | null; category: string | null;
}

const Snacks = () => {
  const [snackList, setSnackList] = useState<Snack[]>([]);
  const [loading, setLoading] = useState(true);
  const { snacks: cartSnacks, addSnack, updateSnackQty, getSnackTotal, getSeatTotal, getTotal, seats } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("snacks").select("*").order("category");
      if (data) setSnackList(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const getQty = (id: string) => cartSnacks.find((s) => s.id === id)?.quantity || 0;

  const combos = snackList.filter((s) => s.category === "combo");
  const regular = snackList.filter((s) => s.category !== "combo");

  return (
    <div className="min-h-screen pt-20 pb-32 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-1">Grab Some Snacks</h1>
          <p className="text-muted-foreground mb-8">Make your movie experience better!</p>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-xl h-48 animate-pulse" />)}
            </div>
          ) : (
            <>
              {combos.length > 0 && (
                <>
                  <h2 className="text-lg font-display font-semibold mb-4 text-gradient">🍿 Combos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {combos.map((snack) => <SnackCard key={snack.id} snack={snack} qty={getQty(snack.id)} onAdd={() => addSnack(snack)} onUpdate={(q) => updateSnackQty(snack.id, q)} />)}
                  </div>
                </>
              )}
              <h2 className="text-lg font-display font-semibold mb-4">🥤 Snacks & Drinks</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {regular.map((snack) => <SnackCard key={snack.id} snack={snack} qty={getQty(snack.id)} onAdd={() => addSnack(snack)} onUpdate={(q) => updateSnackQty(snack.id, q)} />)}
              </div>
              {snackList.length === 0 && <p className="text-center text-muted-foreground py-10">No snacks available.</p>}
            </>
          )}
        </motion.div>
      </div>

      {/* Floating cart summary */}
      <div className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/50 p-4 z-40">
        <div className="container mx-auto max-w-3xl flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{seats.length} seats • {cartSnacks.reduce((s, i) => s + i.quantity, 0)} snacks</p>
            <p className="font-display font-bold text-xl">₹{getTotal()}</p>
          </div>
          <Button onClick={() => navigate("/checkout")} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-sm">
            <ShoppingCart className="w-4 h-4 mr-2" /> Checkout
          </Button>
        </div>
      </div>
    </div>
  );
};

const SnackCard = ({ snack, qty, onAdd, onUpdate }: { snack: any; qty: number; onAdd: () => void; onUpdate: (q: number) => void }) => (
  <div className="glass rounded-xl overflow-hidden transition-all hover:glow-primary-sm">
    <div className="aspect-square bg-secondary/50 flex items-center justify-center overflow-hidden">
      {snack.image_url ? (
        <img src={snack.image_url} alt={snack.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-4xl">🍿</span>
      )}
    </div>
    <div className="p-3">
      <h3 className="font-medium text-sm truncate">{snack.name}</h3>
      <p className="text-primary font-display font-bold">₹{snack.price}</p>
      {qty === 0 ? (
        <Button size="sm" onClick={onAdd} className="w-full mt-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30">
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      ) : (
        <div className="flex items-center justify-between mt-2 bg-secondary/50 rounded-lg p-1">
          <button onClick={() => onUpdate(qty - 1)} className="w-7 h-7 flex items-center justify-center rounded bg-secondary hover:bg-primary/20 transition">
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-medium text-sm">{qty}</span>
          <button onClick={() => onUpdate(qty + 1)} className="w-7 h-7 flex items-center justify-center rounded bg-secondary hover:bg-primary/20 transition">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  </div>
);

export default Snacks;
