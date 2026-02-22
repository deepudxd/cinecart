import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Film, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      toast({ title: isLogin ? "Welcome back!" : "Account created!" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Film className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-display font-bold text-gradient">CineCart</h1>
        </div>
        <h2 className="text-xl font-semibold text-center mb-6">{isLogin ? "Sign In" : "Create Account"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="bg-secondary/50 border-border/50 focus:border-primary"
          />
          <Input
            type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="bg-secondary/50 border-border/50 focus:border-primary"
          />
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-sm" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>
        <p className="text-center text-muted-foreground text-sm mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
