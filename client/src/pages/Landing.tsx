import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight, Sun, Heart, LayoutDashboard, Lock, Feather } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export default function Landing() {
  const { isAuthenticated, login, loading } = useAuth();
  const [, navigate] = useLocation();
  const [secondPersonName, setSecondPersonName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/chat");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (username: string) => {
    if (isSubmitting || loading) return;
    setIsSubmitting(true);
    try {
      await login(username);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col selection:bg-accent/20">

      {/* Refined Header */}
      <header className="absolute top-0 w-full p-8 z-20 flex justify-between items-center opacity-0 animate-[fadeIn_1s_ease-out_forwards]">
        <div className="flex items-center gap-3">
          <Feather className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-light tracking-[0.15em] uppercase text-foreground/70">EchoChat</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-50 to-rose-50 backdrop-blur-md border border-amber-200/30">
          <Lock className="w-3 h-3 text-amber-700/60" />
          <span className="text-[10px] font-light tracking-widest uppercase text-amber-700/60">Private</span>
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
            <h1 className="text-7xl sm:text-8xl font-serif text-foreground leading-[0.9] tracking-tight">
              <span className="block font-light italic text-amber-700/40">echo</span>
              <span className="block font-normal">chat</span>
              <span className="block font-light text-amber-600/50">space</span>
            </h1>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-2xl mx-auto px-4">
            <Button
              onClick={() => handleLogin("mithun")}
              disabled={loading || isSubmitting}
              className="flex-1 h-16 rounded-full text-sm tracking-[0.15em] font-light bg-gradient-to-r from-amber-700 to-amber-600 text-white hover:from-amber-800 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-amber-600/50"
            >
              {loading || isSubmitting ? "Opening..." : "I am Mithun"}
            </Button>

            <div className="text-[11px] uppercase tracking-[0.25em] text-foreground/25 font-light">or</div>

            <div className="flex-1 flex gap-3">
              <Input
                type="text"
                placeholder="Your name"
                value={secondPersonName}
                onChange={(e) => setSecondPersonName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && secondPersonName.trim() && !loading && !isSubmitting) {
                    handleLogin(secondPersonName.trim());
                  }
                }}
                disabled={loading || isSubmitting}
                className="flex-1 h-16 rounded-full text-sm tracking-[0.1em] font-light border border-amber-200/40 bg-gradient-to-br from-white to-amber-50/30 text-foreground placeholder:text-foreground/30 focus:border-amber-300/60 focus:ring-amber-200/20 transition-all"
              />
              <Button
                onClick={() => secondPersonName.trim() && handleLogin(secondPersonName.trim())}
                disabled={loading || isSubmitting || !secondPersonName.trim()}
                className="h-16 px-8 rounded-full text-sm tracking-[0.15em] font-light bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:from-rose-700 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-rose-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || isSubmitting ? "..." : "Enter"}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Minimal Feature Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="grid grid-cols-3 gap-12 mt-28 max-w-md mx-auto opacity-0 animate-[fadeIn_1s_ease-out_0.8s_forwards]"
        >
          <FeatureItem icon={<Heart className="w-6 h-6" />} label="Text" delay={0.9} />
          <FeatureItem icon={<Sun className="w-6 h-6" />} label="Voice" delay={1.0} />
          <FeatureItem icon={<Sparkles className="w-6 h-6" />} label="Video" delay={1.1} />
        </motion.div>
      </main>

      {/* Elegant Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-br from-white via-amber-50/20 to-rose-50/10" />
      <div className="fixed top-[-15%] right-[-5%] w-[45vw] h-[45vw] bg-gradient-to-br from-amber-200/15 to-rose-200/10 rounded-full blur-[140px]" />
      <div className="fixed bottom-[-15%] left-[-8%] w-[50vw] h-[50vw] bg-gradient-to-tr from-amber-100/10 to-transparent rounded-full blur-[150px]" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-gradient-to-r from-rose-100/5 to-amber-100/5 rounded-full blur-[160px]" />

      <footer className="absolute bottom-8 w-full text-center">
        <span className="text-[10px] uppercase tracking-[0.4em] text-foreground/15 font-light">
          v3.0 • Luxury Edition
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
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100/40 to-rose-100/30 border border-amber-200/40 flex items-center justify-center text-amber-700/50 group-hover:text-amber-700/80 group-hover:scale-110 transition-all duration-500 shadow-sm">
        {icon}
      </div>
      <span className="text-[11px] uppercase tracking-[0.25em] text-foreground/35 group-hover:text-amber-700/60 transition-colors font-light text-center">
        {label}
      </span>
    </motion.div>
  )
}
