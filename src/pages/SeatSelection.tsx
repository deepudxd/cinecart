import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Seat {
  id: string; seat_number: string; is_booked: boolean;
}

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = 8;

const SeatSelection = () => {
  const { showId } = useParams<{ showId: string }>();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const { seats: cartSeats, addSeat, removeSeat, selectedShow } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSeats = async () => {
      const { data } = await supabase.from("seats").select("*").eq("show_id", showId!);
      if (data) setSeats(data);
      setLoading(false);
    };
    fetchSeats();
  }, [showId]);

  const getSeat = (row: string, col: number) => {
    const seatNum = `${row}${col}`;
    return seats.find((s) => s.seat_number === seatNum);
  };

  const isSelected = (seatId: string) => cartSeats.some((s) => s.id === seatId);

  const toggleSeat = (seat: Seat) => {
    if (seat.is_booked) return;
    if (isSelected(seat.id)) {
      removeSeat(seat.id);
    } else {
      addSeat({ id: seat.id, seat_number: seat.seat_number, show_id: showId! });
    }
  };

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-1">Select Your Seats</h1>
          {selectedShow && <p className="text-muted-foreground mb-6">{selectedShow.movie_title} • {selectedShow.screen}</p>}

          {/* Screen indicator */}
          <div className="mb-8">
            <div className="w-3/4 mx-auto h-2 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full glow-primary mb-2" />
            <p className="text-center text-xs text-muted-foreground">SCREEN</p>
          </div>

          {/* Seat grid */}
          <div className="flex flex-col items-center gap-2 mb-8">
            {ROWS.map((row) => (
              <div key={row} className="flex items-center gap-2">
                <span className="w-6 text-xs text-muted-foreground text-right">{row}</span>
                <div className="flex gap-1.5">
                  {Array.from({ length: COLS }, (_, i) => {
                    const seat = getSeat(row, i + 1);
                    if (!seat) return <div key={i} className="w-8 h-8 md:w-10 md:h-10" />;
                    const booked = seat.is_booked;
                    const selected = isSelected(seat.id);
                    return (
                      <button
                        key={seat.id}
                        onClick={() => toggleSeat(seat)}
                        disabled={booked}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-md text-xs font-medium transition-all duration-200
                          ${booked ? "bg-secondary/60 text-muted-foreground cursor-not-allowed" : ""}
                          ${selected ? "bg-primary text-primary-foreground glow-primary-sm scale-105" : ""}
                          ${!booked && !selected ? "bg-secondary hover:bg-primary/20 hover:border-primary border border-border/50 cursor-pointer" : ""}
                        `}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mb-8 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-secondary border border-border/50" /> Available</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-primary glow-primary-sm" /> Selected</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-secondary/60" /> Booked</div>
          </div>

          {/* Summary & continue */}
          <div className="glass rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{cartSeats.length} seat(s) selected</p>
              <p className="font-display font-bold text-lg">₹{cartSeats.length * 200}</p>
            </div>
            <Button
              onClick={() => navigate("/snacks")}
              disabled={cartSeats.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-sm"
            >
              Continue to Snacks
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SeatSelection;
