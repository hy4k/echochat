import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Loader2,
  Video,
  Users,
  MapPin,
  X,
  Star,
  ThumbsUp,
  Play,
  Trash2,
  Edit
} from "lucide-react";

export default function Sessions() {
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    sessionType: "one_on_one" as "one_on_one" | "group" | "workshop" | "review",
    maxAttendees: 2,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Fetch sessions
  const { data: sessions, isLoading, refetch } = trpc.sessions.getSessions.useQuery({
    limit: 20,
    upcoming: true,
  });

  // Fetch all sessions (past)
  const { data: pastSessions } = trpc.sessions.getSessions.useQuery({
    limit: 20,
    upcoming: false,
  });

  // Mutations
  const createSessionMutation = trpc.sessions.createSession.useMutation({
    onSuccess: () => {
      setShowCreateSession(false);
      setNewSession({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        sessionType: "one_on_one",
        maxAttendees: 2,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      refetch();
    },
  });

  const cancelSessionMutation = trpc.sessions.cancelSession.useMutation({
    onSuccess: () => {
      setShowSessionDetails(false);
      refetch();
    },
  });

  const joinSessionMutation = trpc.sessions.joinSession.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const leaveSessionMutation = trpc.sessions.leaveSession.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleCreateSession = () => {
    createSessionMutation.mutate({
      title: newSession.title,
      description: newSession.description,
      startTime: newSession.startTime,
      endTime: newSession.endTime,
      sessionType: newSession.sessionType,
      maxAttendees: newSession.maxAttendees,
      timezone: newSession.timezone,
    });
  };

  const handleCancelSession = (sessionId: number) => {
    cancelSessionMutation.mutate({ sessionId });
  };

  const handleJoinSession = (sessionId: number) => {
    joinSessionMutation.mutate({ sessionId });
  };

  const handleLeaveSession = (sessionId: number) => {
    leaveSessionMutation.mutate({ sessionId });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500/20 text-blue-500">Scheduled</Badge>;
      case "in_progress":
        return <Badge className="bg-green-500/20 text-green-500">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-gray-500/20 text-gray-500">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-500">Cancelled</Badge>;
      case "no_show":
        return <Badge className="bg-yellow-500/20 text-yellow-500">No Show</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case "one_on_one":
        return <Users className="w-4 h-4" />;
      case "group":
        return <Users className="w-4 h-4" />;
      case "workshop":
        return <Video className="w-4 h-4" />;
      case "review":
        return <Star className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const SessionCard = ({ session, isPast = false }: { session: any; isPast?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            {getSessionTypeIcon(session.sessionType)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{session.title}</h3>
              {getStatusBadge(session.status)}
            </div>
            
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {formatDateTime(session.startTime)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {session.currentAttendees}/{session.maxAttendees} attendees
              </div>
              {session.sessionType !== "one_on_one" && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {session.sessionType.replace("_", " ")}
                </div>
              )}
            </div>

            {!isPast && session.status === "scheduled" && (
              <div className="mt-4 flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedSession(session);
                    setShowSessionDetails(true);
                  }}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Join
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-8 h-8" />
            Sessions
          </h1>
          <p className="text-muted-foreground">
            Schedule and manage your learning sessions
          </p>
        </div>
        <Button onClick={() => setShowCreateSession(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{sessions?.filter(s => s.status === "scheduled").length || 0}</div>
            <p className="text-sm text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{sessions?.filter(s => s.status === "in_progress").length || 0}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{pastSessions?.filter(s => s.status === "completed").length || 0}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{(sessions?.length || 0) + (pastSessions?.length || 0)}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
          />
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="upcoming">
            Upcoming ({sessions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastSessions?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions?.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
          {(!sessions || sessions.length === 0) && !isLoading && (
            <Card className="p-8 text-center">
              <CardContent>
                <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No upcoming sessions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Schedule a session to start learning
                </p>
                <Button onClick={() => setShowCreateSession(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Session
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastSessions?.map((session) => (
              <SessionCard key={session.id} session={session} isPast />
            ))}
          </div>
          {(!pastSessions || pastSessions.length === 0) && (
            <Card className="p-8 text-center">
              <CardContent>
                <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No past sessions</h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Session Dialog */}
      <Dialog open={showCreateSession} onOpenChange={setShowCreateSession}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule New Session</DialogTitle>
            <DialogDescription>
              Create a new learning session
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sessionTitle">Title</Label>
              <Input
                id="sessionTitle"
                value={newSession.title}
                onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                placeholder="e.g., JavaScript Fundamentals"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sessionDescription">Description</Label>
              <Textarea
                id="sessionDescription"
                value={newSession.description}
                onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                placeholder="What will you cover?"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Session Type</Label>
                <Select
                  value={newSession.sessionType}
                  onValueChange={(value: "one_on_one" | "group" | "workshop" | "review") => setNewSession({ ...newSession, sessionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_on_one">One-on-One</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Max Attendees</Label>
                <Select
                  value={newSession.maxAttendees.toString()}
                  onValueChange={(value) => setNewSession({ ...newSession, maxAttendees: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 5, 10, 15, 20].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Date & Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="datetime-local"
                  value={newSession.startTime}
                  onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                />
                <Input
                  type="datetime-local"
                  value={newSession.endTime}
                  onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Timezone</Label>
              <Select
                value={newSession.timezone}
                onValueChange={(value) => setNewSession({ ...newSession, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  <SelectItem value="Asia/Calcutta">India</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSession(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSession} disabled={!newSession.title || !newSession.startTime || !newSession.endTime || createSessionMutation.isPending}>
              {createSessionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Details Dialog */}
      <Dialog open={showSessionDetails} onOpenChange={setShowSessionDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSession?.title}</DialogTitle>
            <DialogDescription>
              {selectedSession?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedSession && formatDateTime(selectedSession.startTime)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedSession?.currentAttendees}/{selectedSession?.maxAttendees}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => handleLeaveSession(selectedSession?.id)}
                disabled={leaveSessionMutation.isPending}
              >
                <X className="w-4 h-4 mr-1" />
                Leave
              </Button>
              <Button 
                className="flex-1"
                onClick={() => handleJoinSession(selectedSession?.id)}
                disabled={joinSessionMutation.isPending}
              >
                {joinSessionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Join Session
                  </>
                )}
              </Button>
            </div>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => handleCancelSession(selectedSession?.id)}
              disabled={cancelSessionMutation.isPending}
            >
              {cancelSessionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />
              Cancel Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
