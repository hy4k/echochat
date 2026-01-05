import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Heart, Lock } from "lucide-react";
import { useEffect, useState } from "react";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Continuous soft glow animation
    const interval = setInterval(() => {
      setIsAnimating((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (isAuthenticated) {
    return null; // Redirect to chat
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-[oklch(0.18_0.02_240)] flex items-center justify-center overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-[oklch(0.78_0.14_45)] opacity-5 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[oklch(0.65_0.15_240)] opacity-5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Logo/Icon */}
        <div className="mb-12 flex justify-center">
          <div className={`transition-all duration-1000 ${isAnimating ? "scale-100" : "scale-105"}`}>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-[oklch(0.70_0.10_45)] flex items-center justify-center shadow-2xl soft-glow">
              <Heart className="w-12 h-12 text-accent-foreground" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 bg-gradient-to-r from-accent via-foreground to-accent bg-clip-text text-transparent">
          EchoChat
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-light">
          A private sanctuary for two
        </p>

        {/* Description */}
        <div className="mb-12 space-y-4">
          <p className="text-lg text-foreground/80 leading-relaxed">
            Exclusive, intimate, and designed just for you and one special person. Share moments through text, voice, and video in a space that feels like a shared secret.
          </p>

          {/* Features highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-accent/30 transition-colors">
              <div className="text-accent mb-3 text-2xl">💬</div>
              <h3 className="font-serif font-semibold mb-2">Real-time Chat</h3>
              <p className="text-sm text-muted-foreground">Text, voice, and video in perfect sync</p>
            </div>

            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-accent/30 transition-colors">
              <div className="text-accent mb-3 text-2xl">🌅</div>
              <h3 className="font-serif font-semibold mb-2">Shared Horizon</h3>
              <p className="text-sm text-muted-foreground">Weather and time sync across locations</p>
            </div>

            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-accent/30 transition-colors">
              <div className="text-accent mb-3 text-2xl">✨</div>
              <h3 className="font-serif font-semibold mb-2">Keepsakes</h3>
              <p className="text-sm text-muted-foreground">Pin favorite moments forever</p>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href={getLoginUrl()}>
            <Button
              size="lg"
              className="bg-gradient-to-r from-accent to-[oklch(0.75_0.10_45)] text-accent-foreground hover:shadow-lg hover:shadow-accent/50 transition-all font-semibold px-8"
            >
              Begin Your Journey
            </Button>
          </a>
        </div>

        {/* Privacy note */}
        <div className="mt-12 pt-8 border-t border-border/30 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span>Your connection is private and encrypted</span>
        </div>

        {/* Footer */}
        <div className="mt-16 text-xs text-muted-foreground/60">
          <p>EchoChat • Where two hearts find their rhythm</p>
        </div>
      </div>
    </div>
  );
}
