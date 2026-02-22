import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock, Star, Calendar } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface Movie {
  id: string; title: string; poster_url: string | null; duration: string;
  genre: string | null; rating: string | null; description: string | null;
}
interface Show {
  id: string; show_time: string; screen: string | null;
}

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedShow } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const [movieRes, showsRes] = await Promise.all([
        supabase.from("movies").select("*").eq("id", id!).single(),
        supabase.from("shows").select("*").eq("movie_id", id!).gte("show_time", new Date().toISOString()).order("show_time"),
      ]);
      if (movieRes.data) setMovie(movieRes.data);
      if (showsRes.data) setShows(showsRes.data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const selectShow = (show: Show) => {
    if (!user) { navigate("/auth"); return; }
    setSelectedShow({ id: show.id, movie_title: movie!.title, show_time: show.show_time, screen: show.screen || "Screen 1" });
    navigate(`/seats/${show.id}`);
  };

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!movie) return <div className="min-h-screen pt-24 flex items-center justify-center text-muted-foreground">Movie not found</div>;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 shrink-0">
            <div className="glass rounded-xl overflow-hidden aspect-[2/3]">
              {movie.poster_url ? (
                <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Poster</div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {movie.duration}</span>
              {movie.rating && <span className="flex items-center gap-1"><Star className="w-4 h-4 text-primary" /> {movie.rating}</span>}
              {movie.genre && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">{movie.genre}</span>}
            </div>
            {movie.description && <p className="text-muted-foreground mb-8 leading-relaxed">{movie.description}</p>}

            <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Available Shows
            </h2>
            {shows.length === 0 ? (
              <p className="text-muted-foreground">No upcoming shows available.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {shows.map((show) => (
                  <Button
                    key={show.id}
                    variant="outline"
                    onClick={() => selectShow(show)}
                    className="glass border-border/50 hover:border-primary hover:glow-primary-sm transition-all flex flex-col h-auto py-3"
                  >
                    <span className="text-sm font-semibold">{format(new Date(show.show_time), "MMM d, h:mm a")}</span>
                    <span className="text-xs text-muted-foreground">{show.screen || "Screen 1"}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MovieDetails;
