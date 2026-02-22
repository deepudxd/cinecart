import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Star } from "lucide-react";
import { motion } from "framer-motion";

interface Movie {
  id: string;
  title: string;
  poster_url: string | null;
  duration: string;
  genre: string | null;
  rating: string | null;
}

const Home = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovies = async () => {
      const { data } = await supabase.from("movies").select("*").order("created_at", { ascending: false });
      if (data) setMovies(data);
      setLoading(false);
    };
    fetchMovies();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
            Now <span className="text-gradient">Showing</span>
          </h1>
          <p className="text-muted-foreground text-lg">Book your seats for the latest blockbusters</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-xl">No movies available yet.</p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie, i) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="glass rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 hover:glow-primary-sm hover:scale-[1.02]"
              >
                <div className="aspect-[2/3] bg-secondary overflow-hidden">
                  {movie.poster_url ? (
                    <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Poster</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-sm md:text-base truncate">{movie.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {movie.duration}</span>
                    {movie.rating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-primary" /> {movie.rating}</span>}
                  </div>
                  {movie.genre && <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{movie.genre}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
