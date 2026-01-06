import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Sun, Heart, LayoutDashboard, Lock } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export default function Landing() {
  const { isAuthenticated, login, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/chat");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (username: string) => {
    await login(username);
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col selection:bg-accent/20">

      {/* Refined Header */}
      <header className="absolute top-0 w-full p-6 z-20 flex justify-between items-center opacity-0 animate-[fadeIn_1s_ease-out_forwards]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-foreground" />
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-foreground/80">EchoChat</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/50">
          <Lock className="w-2.5 h-2.5 text-foreground/40" />
          <span className="text-[9px] font-medium tracking-widest uppercase text-foreground/40">Private</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">

        {/* Elegant Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto space-y-12"
        >
          <div className="space-y-4">
            <span className="inline-block py-1 px-3 rounded-full border border-foreground/10 bg-white/30 text-[9px] uppercase tracking-[0.3em] font-medium text-foreground/60">
              Invitation Only
            </span>

            <h1 className="text-6xl font-serif text-foreground leading-[0.95] tracking-tight sm:text-7xl">
              <span className="block italic opacity-60">echo</span>
              <span className="block">chat.space</span>
            </h1>

            <p className="text-base font-light text-foreground/60 max-w-[280px] mx-auto leading-relaxed">
              A permanent digital sanctuary for two. <br />
              Where silence speaks and memories stay.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-sm mx-auto px-4">
            <Button
              onClick={() => handleLogin("mithun")}
              disabled={loading}
              className="w-full button-premium h-14 rounded-full text-xs tracking-[0.2em] font-medium bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              {loading ? "Opening..." : "I am Mithun"}
            </Button>

            <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/30 font-medium">or</div>

            <Button
              onClick={() => handleLogin("yashika")}
              disabled={loading}
              className="w-full button-premium h-14 rounded-full text-xs tracking-[0.2em] font-medium bg-white text-foreground hover:bg-white/90 border border-foreground/5 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              {loading ? "Opening..." : "I am Yashika"}
            </Button>
          </div>
        </motion.div>

        {/* Minimal Feature Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="grid grid-cols-3 gap-8 mt-24 max-w-xs mx-auto opacity-0 animate-[fadeIn_1s_ease-out_0.8s_forwards]"
        >
          <FeatureItem icon={<Heart className="w-5 h-5" />} label="Text" delay={0.9} />
          <FeatureItem icon={<Sun className="w-5 h-5" />} label="Voice" delay={1.0} />
          <FeatureItem icon={<Sparkles className="w-5 h-5" />} label="Video" delay={1.1} />
        </motion.div>
      </main>

      {/* Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-tr from-white/0 via-white/50 to-white/0" />
      <div className="fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-[#eaddcf]/10 rounded-full blur-[120px]" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#e6efe9]/20 rounded-full blur-[100px]" />

      <footer className="absolute bottom-8 w-full text-center">
        <span className="text-[10px] uppercase tracking-[0.4em] text-foreground/20 font-medium">
          v3.0 • Premium Edition
        </span>
      </footer>
    </div>
  );
}

function FeatureItem({ icon, label, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8 }}
      className="flex flex-col items-center gap-4 group cursor-default"
    >
      <div className="w-12 h-12 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-center text-foreground/40 group-hover:text-foreground/80 group-hover:scale-105 transition-all duration-500 shadow-sm">
        {icon}
      </div>
      <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 group-hover:text-foreground/60 transition-colors font-medium text-center">
        {label}
      </span>
    </motion.div>
  )
}
