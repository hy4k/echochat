import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cloud, Sun, Moon, CloudRain, Wind } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface HorizonData {
  weatherCondition: string;
  temperature: string;
  timeOfDay: string;
  backgroundColor: string;
  accentColor: string;
}

export default function SharedHorizon() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [myHorizon, setMyHorizon] = useState<HorizonData>({
    weatherCondition: "sunny",
    temperature: "72°F",
    timeOfDay: "afternoon",
    backgroundColor: "#1a3a52",
    accentColor: "#d4af37",
  });

  const [theirHorizon, setTheirHorizon] = useState<HorizonData>({
    weatherCondition: "cloudy",
    temperature: "68°F",
    timeOfDay: "evening",
    backgroundColor: "#2c3e50",
    accentColor: "#e8b4a8",
  });

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "sunny":
        return <Sun className="w-12 h-12" />;
      case "cloudy":
        return <Cloud className="w-12 h-12" />;
      case "rainy":
        return <CloudRain className="w-12 h-12" />;
      default:
        return <Sun className="w-12 h-12" />;
    }
  };

  const getTimeOfDayEmoji = (time: string) => {
    switch (time.toLowerCase()) {
      case "dawn":
        return "🌅";
      case "morning":
        return "☀️";
      case "noon":
        return "🌞";
      case "afternoon":
        return "🌤️";
      case "sunset":
        return "🌅";
      case "dusk":
        return "🌆";
      case "night":
        return "🌙";
      default:
        return "☀️";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/chat")}
            className="text-muted-foreground hover:text-accent"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-serif text-lg font-semibold">Shared Horizon</h1>
            <p className="text-xs text-muted-foreground">
              Connected through time and weather
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Horizon */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold mb-6">Your Sky</h2>

            {/* Horizon visualization */}
            <div
              className="rounded-2xl overflow-hidden shadow-2xl h-64 flex flex-col items-center justify-center relative"
              style={{
                background: `linear-gradient(180deg, ${myHorizon.backgroundColor} 0%, ${myHorizon.accentColor}40 100%)`,
              }}
            >
              <div className="text-center text-white z-10">
                <div className="mb-4 text-accent">
                  {getWeatherIcon(myHorizon.weatherCondition)}
                </div>
                <p className="text-4xl font-serif font-bold mb-2">
                  {getTimeOfDayEmoji(myHorizon.timeOfDay)}
                </p>
                <p className="text-lg font-semibold capitalize">
                  {myHorizon.timeOfDay}
                </p>
              </div>
            </div>

            {/* Weather details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Weather</p>
                <p className="font-semibold capitalize">
                  {myHorizon.weatherCondition}
                </p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Temperature</p>
                <p className="font-semibold">{myHorizon.temperature}</p>
              </div>
            </div>
          </div>

          {/* Their Horizon */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold mb-6">Their Sky</h2>

            {/* Horizon visualization */}
            <div
              className="rounded-2xl overflow-hidden shadow-2xl h-64 flex flex-col items-center justify-center relative"
              style={{
                background: `linear-gradient(180deg, ${theirHorizon.backgroundColor} 0%, ${theirHorizon.accentColor}40 100%)`,
              }}
            >
              <div className="text-center text-white z-10">
                <div className="mb-4 text-accent">
                  {getWeatherIcon(theirHorizon.weatherCondition)}
                </div>
                <p className="text-4xl font-serif font-bold mb-2">
                  {getTimeOfDayEmoji(theirHorizon.timeOfDay)}
                </p>
                <p className="text-lg font-semibold capitalize">
                  {theirHorizon.timeOfDay}
                </p>
              </div>
            </div>

            {/* Weather details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Weather</p>
                <p className="font-semibold capitalize">
                  {theirHorizon.weatherCondition}
                </p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Temperature</p>
                <p className="font-semibold">{theirHorizon.temperature}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection info */}
        <div className="mt-12 bg-card rounded-2xl p-6 border border-border/50">
          <h3 className="font-serif text-lg font-semibold mb-4">About Shared Horizon</h3>
          <p className="text-muted-foreground mb-4">
            This feature synchronizes the weather and time of day from both your locations, creating a visual representation of your shared moment in time. Even though you may be miles apart, you can see what the sky looks like where they are.
          </p>
          <div className="flex gap-2 text-sm">
            <Wind className="w-5 h-5 text-accent flex-shrink-0" />
            <span className="text-muted-foreground">
              Updates automatically based on your location and local weather data
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
