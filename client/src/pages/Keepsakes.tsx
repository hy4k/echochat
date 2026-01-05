import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, ArrowLeft, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface Keepsake {
  id: number;
  messageId?: number;
  title?: string;
  description?: string;
  pinnedAt: Date;
  messageContent?: string;
}

export default function Keepsakes() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [keepsakes, setKeepsakes] = useState<Keepsake[]>([
    {
      id: 1,
      title: "First Hello",
      description: "When we first connected",
      pinnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      messageContent: "Hi there! 👋",
    },
    {
      id: 2,
      title: "Sunset Moment",
      description: "That beautiful evening",
      pinnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      messageContent: "The sky looks amazing tonight ✨",
    },
  ]);

  const handleDelete = (id: number) => {
    setKeepsakes(keepsakes.filter((k) => k.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat")}
              className="text-muted-foreground hover:text-accent"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Digital Keepsakes
              </h1>
              <p className="text-xs text-muted-foreground">
                Treasured moments from our journey
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {keepsakes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h2 className="font-serif text-2xl font-semibold mb-2">No Keepsakes Yet</h2>
            <p className="text-muted-foreground max-w-sm">
              Pin your favorite moments from our conversations to create a gallery of memories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {keepsakes.map((keepsake) => (
              <div
                key={keepsake.id}
                className="group relative"
              >
                {/* Polaroid-style card */}
                <div className="bg-white text-black p-6 shadow-2xl transform transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-1"
                  style={{
                    aspectRatio: "3/4",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.3), 0 0 1px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* Polaroid top section */}
                  <div className="h-full flex flex-col justify-between">
                    {/* Content area */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="mb-4">
                        <h3 className="font-serif text-xl font-semibold text-gray-900 mb-2">
                          {keepsake.title}
                        </h3>
                        {keepsake.description && (
                          <p className="text-sm text-gray-600 mb-4">
                            {keepsake.description}
                          </p>
                        )}
                      </div>

                      {/* Message preview */}
                      {keepsake.messageContent && (
                        <div className="bg-gray-50 rounded p-3 border border-gray-200">
                          <p className="text-sm text-gray-700 italic">
                            "{keepsake.messageContent}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Polaroid bottom section with date */}
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-center">
                        {keepsake.pinnedAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delete button - appears on hover */}
                <button
                  onClick={() => handleDelete(keepsake.id)}
                  className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  title="Delete keepsake"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Heart accent */}
                <div className="absolute -top-2 -left-2 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  <Heart className="w-5 h-5" fill="currentColor" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
