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

  const handleEnter = async () => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user") === "2" ? 2 : 1;
    await login(userId);
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col selection:bg-accent/20">

      {/* Refined Header */}
      <header className="absolute top-0 w-full p-8 md:p-12 z-20 flex justify-between items-center opacity-0 animate-[fadeIn_1s_ease-out_forwards]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-foreground" />
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-foreground/80">EchoChat</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-white/50">
          <Lock className="w-3 h-3 text-foreground/40" />
          <span className="text-[10px] font-medium tracking-widest uppercase text-foreground/40">Private Encryption</span>
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
          <div className="space-y-6">
            <span className="inline-block py-1 px-3 rounded-full border border-foreground/10 bg-white/30 text-[10px] uppercase tracking-[0.3em] font-medium text-foreground/60">
              Invitation Only
            </span>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif text-foreground leading-[0.9] tracking-tight">
              <span className="block italic opacity-60">echo</span>
              <span className="block">chat.space</span>
            </h1>

            <p className="text-lg md:text-xl font-light text-foreground/60 max-w-lg mx-auto leading-relaxed">
              A permanent digital sanctuary for two. <br className="hidden md:block" />
              Where silence speaks and memories never fade.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <Button
              onClick={handleEnter}
              disabled={loading}
              className="button-premium h-14 px-10 rounded-full text-xs tracking-[0.2em] font-medium bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-background/30 border-t-background animate-spin" />
                  <span>Opening...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Step Inside</span>
                  <ArrowRight className="w-4 h-4 opacity-60" />
                </div>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Minimal Feature Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="grid grid-cols-3 gap-8 md:gap-24 mt-32 max-w-5xl mx-auto opacity-0 animate-[fadeIn_1s_ease-out_0.8s_forwards]"
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
