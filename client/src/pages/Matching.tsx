import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Heart,
  HeartHandshake,
  Settings,
  Sparkles,
  Check,
  X,
  Loader2,
  Target,
  Clock,
  Users,
  Zap,
  MessageSquare,
  UserPlus
} from "lucide-react";

export default function Matching() {
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    minCompatibilityScore: "50",
    preferredSessionLength: 60,
    autoMatch: false,
    notificationFrequency: "daily" as "immediate" | "daily" | "weekly",
    teachingStylePreference: "",
    learningStylePreference: "",
  });

  // Fetch match preferences
  const { data: matchPreferences, isLoading: prefsLoading, refetch: refetchPrefs } = trpc.matching.getMatchPreferences.useQuery();
  
  // Fetch matches
  const { data: matches, isLoading: matchesLoading, refetch: refetchMatches } = trpc.matching.getMatches.useQuery({
    limit: 20,
  });

  // Mutations
  const updatePreferencesMutation = trpc.matching.updateMatchPreferences.useMutation({
    onSuccess: () => {
      refetchPrefs();
      setShowPreferences(false);
    },
  });

  const generateMatchesMutation = trpc.matching.generateMatches.useMutation({
    onSuccess: () => {
      refetchMatches();
    },
  });

  const respondToMatchMutation = trpc.matching.respondToMatch.useMutation({
    onSuccess: () => {
      refetchMatches();
    },
  });

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate({
      minCompatibilityScore: preferences.minCompatibilityScore,
      preferredSessionLength: preferences.preferredSessionLength,
      autoMatch: preferences.autoMatch,
      notificationFrequency: preferences.notificationFrequency,
      teachingStylePreference: preferences.teachingStylePreference || undefined,
      learningStylePreference: preferences.learningStylePreference || undefined,
    });
  };

  const handleGenerateMatches = () => {
    generateMatchesMutation.mutate({ limit: 10 });
  };

  const handleRespondToMatch = (matchId: number, action: "accepted" | "rejected") => {
    respondToMatchMutation.mutate({ matchId, action });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "suggested":
        return <Badge variant="outline" className="bg-purple-500/20 text-purple-500">Suggested</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500">Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-500/20 text-green-500">Accepted</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/20 text-red-500">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const MatchCard = ({ match }: { match: any }) => {
    const compatibilityScore = parseInt(match.compatibilityScore || "0");
    const isSuggested = match.status === "suggested" || match.status === "pending";
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                <Users className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Match #{match.id}</h3>
                {getStatusBadge(match.status)}
              </div>
              
              {/* Compatibility Score */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Compatibility</span>
                  <span className="font-medium">{compatibilityScore}%</span>
                </div>
                <Progress 
                  value={compatibilityScore} 
                  className="h-2"
                  style={{
                    background: compatibilityScore >= 70 ? "hsl(var(--success))" : 
                               compatibilityScore >= 50 ? "hsl(var(--warning))" : 
                               "hsl(var(--destructive))"
                  }}
                />
              </div>

              {/* Match Details */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Target className="w-3 h-3" />
                  Skill Match: {parseInt(match.skillMatchScore || "0")}%
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Availability: {parseInt(match.availabilityMatchScore || "0")}%
                </div>
              </div>

              {/* Actions */}
              {isSuggested && (
                <div className="mt-4 flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleRespondToMatch(match.id, "accepted")}
                    disabled={respondToMatchMutation.isPending}
                  >
                    {respondToMatchMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleRespondToMatch(match.id, "rejected")}
                    disabled={respondToMatchMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Decline
                  </Button>
                </div>
              )}
              
              {match.status === "accepted" && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <UserPlus className="w-4 h-4 mr-1" />
                    Start Partnership
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HeartHandshake className="w-8 h-8" />
            Matching
          </h1>
          <p className="text-muted-foreground">
            Find your perfect learning partners
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreferences(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
          <Button onClick={handleGenerateMatches} disabled={generateMatchesMutation.isPending}>
            {generateMatchesMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Find Matches
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{matches?.filter(m => m.status === "suggested").length || 0}</div>
            <p className="text-sm text-muted-foreground">Suggested</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{matches?.filter(m => m.status === "pending").length || 0}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{matches?.filter(m => m.status === "accepted").length || 0}</div>
            <p className="text-sm text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{matches?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total Matches</p>
          </CardContent>
        </Card>
      </div>

      {/* Matches List */}
      <Tabs defaultValue="suggested" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="suggested">
            Suggested ({matches?.filter(m => m.status === "suggested").length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({matches?.filter(m => m.status === "pending").length || 0})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({matches?.filter(m => m.status === "accepted").length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggested" className="mt-6">
          {matchesLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches?.filter(m => m.status === "suggested").map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
          {(!matches || matches.filter(m => m.status === "suggested").length === 0) && !matchesLoading && (
            <Card className="p-8 text-center">
              <CardContent>
                <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No suggested matches</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click "Find Matches" to discover new learning partners
                </p>
                <Button onClick={handleGenerateMatches}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Matches
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches?.filter(m => m.status === "pending").map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
          {(!matches || matches.filter(m => m.status === "pending").length === 0) && (
            <Card className="p-8 text-center">
              <CardContent>
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No pending matches</h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches?.filter(m => m.status === "accepted").map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
          {(!matches || matches.filter(m => m.status === "accepted").length === 0) && (
            <Card className="p-8 text-center">
              <CardContent>
                <Heart className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="font-semibold mb-2">No accepted matches yet</h3>
                <p className="text-sm text-muted-foreground">
                  Accept matches to start learning together
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Match Preferences</DialogTitle>
            <DialogDescription>
              Customize how we find your learning partners
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Minimum Compatibility Score</Label>
              <Select
                value={preferences.minCompatibilityScore}
                onValueChange={(value) => setPreferences({ ...preferences, minCompatibilityScore: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30%</SelectItem>
                  <SelectItem value="40">40%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="60">60%</SelectItem>
                  <SelectItem value="70">70%</SelectItem>
                  <SelectItem value="80">80%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Preferred Session Length</Label>
              <Select
                value={preferences.preferredSessionLength.toString()}
                onValueChange={(value) => setPreferences({ ...preferences, preferredSessionLength: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Teaching Style Preference</Label>
              <Select
                value={preferences.teachingStylePreference}
                onValueChange={(value) => setPreferences({ ...preferences, teachingStylePreference: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="structured">Structured</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                  <SelectItem value="project_based">Project-based</SelectItem>
                  <SelectItem value="theory_focused">Theory-focused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Learning Style Preference</Label>
              <Select
                value={preferences.learningStylePreference}
                onValueChange={(value) => setPreferences({ ...preferences, learningStylePreference: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="visual">Visual</SelectItem>
                  <SelectItem value="auditory">Auditory</SelectItem>
                  <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
                  <SelectItem value="reading">Reading/Writing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notification Frequency</Label>
              <Select
                value={preferences.notificationFrequency}
                onValueChange={(value: "immediate" | "daily" | "weekly") => setPreferences({ ...preferences, notificationFrequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-match</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically accept high-compatibility matches
                </p>
              </div>
              <Switch
                checked={preferences.autoMatch}
                onCheckedChange={(checked) => setPreferences({ ...preferences, autoMatch: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreferences(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences} disabled={updatePreferencesMutation.isPending}>
              {updatePreferencesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
