import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  DoorOpen,
  Users,
  Plus,
  MessageSquare,
  Send,
  Loader2,
  Search,
  Lock,
  Globe,
  Hash,
  LogIn,
  LogOut,
  Settings,
  Trash2,
  MoreVertical
} from "lucide-react";

export default function LearningRooms() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    roomType: "public" as "public" | "private" | "invite_only",
    maxParticipants: 10,
    topic: "",
  });
  const [message, setMessage] = useState("");

  // Fetch rooms
  const { data: rooms, isLoading: roomsLoading, refetch } = trpc.rooms.getRooms.useQuery({
    limit: 20,
  });

  // Fetch categories
  const { data: categories } = trpc.skills.getCategories.useQuery();

  // Fetch room messages if room selected
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = trpc.rooms.getRoomMessages.useQuery(
    { roomId: selectedRoom?.id || 0, limit: 50 },
    { enabled: !!selectedRoom?.id }
  );

  // Mutations
  const createRoomMutation = trpc.rooms.createRoom.useMutation({
    onSuccess: () => {
      setShowCreateRoom(false);
      setNewRoom({
        name: "",
        description: "",
        roomType: "public",
        maxParticipants: 10,
        topic: "",
      });
      refetch();
    },
  });

  const joinRoomMutation = trpc.rooms.joinRoom.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const leaveRoomMutation = trpc.rooms.leaveRoom.useMutation({
    onSuccess: () => {
      setSelectedRoom(null);
      refetch();
    },
  });

  const deleteRoomMutation = trpc.rooms.deleteRoom.useMutation({
    onSuccess: () => {
      setSelectedRoom(null);
      refetch();
    },
  });

  const handleCreateRoom = () => {
    createRoomMutation.mutate({
      name: newRoom.name,
      description: newRoom.description,
      roomType: newRoom.roomType,
      maxParticipants: newRoom.maxParticipants,
      topic: newRoom.topic || undefined,
    });
  };

  const handleJoinRoom = (roomId: number) => {
    joinRoomMutation.mutate({ roomId });
  };

  const handleLeaveRoom = (roomId: number) => {
    leaveRoomMutation.mutate({ roomId });
  };

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case "public":
        return <Globe className="w-4 h-4" />;
      case "private":
        return <Lock className="w-4 h-4" />;
      case "invite_only":
        return <Hash className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const RoomCard = ({ room }: { room: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {room.name}
                {getRoomTypeIcon(room.roomType)}
              </h3>
              {room.topic && (
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {room.topic}
                </p>
              )}
            </div>
          </div>
        </div>

        {room.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {room.description}
          </p>
        )}

        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {room.currentParticipants}/{room.maxParticipants}
          </span>
          {room.tags && room.tags.length > 0 && (
            <div className="flex gap-1">
              {room.tags.slice(0, 2).map((tag: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => {
              setSelectedRoom(room);
              setShowRoomDetails(true);
            }}
          >
            <LogIn className="w-4 h-4 mr-1" />
            Join
          </Button>
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
            <DoorOpen className="w-8 h-8" />
            Learning Rooms
          </h1>
          <p className="text-muted-foreground">
            Join collaborative learning rooms and study together
          </p>
        </div>
        <Button onClick={() => setShowCreateRoom(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Room
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms by name or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rooms Grid */}
      {roomsLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms?.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
      {(!rooms || rooms.length === 0) && !roomsLoading && (
        <Card className="p-8 text-center">
          <CardContent>
            <DoorOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No rooms available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a room to start collaborating with others
            </p>
            <Button onClick={() => setShowCreateRoom(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Room Dialog */}
      <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Learning Room</DialogTitle>
            <DialogDescription>
              Create a new collaborative learning room
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                placeholder="e.g., JavaScript Study Group"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="roomDescription">Description</Label>
              <Textarea
                id="roomDescription"
                value={newRoom.description}
                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                placeholder="What will this room be about?"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="roomTopic">Topic</Label>
              <Input
                id="roomTopic"
                value={newRoom.topic}
                onChange={(e) => setNewRoom({ ...newRoom, topic: e.target.value })}
                placeholder="e.g., Web Development"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Room Type</Label>
                <Select
                  value={newRoom.roomType}
                  onValueChange={(value: "public" | "private" | "invite_only") => setNewRoom({ ...newRoom, roomType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Public
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Private
                      </div>
                    </SelectItem>
                    <SelectItem value="invite_only">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Invite Only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Max Participants</Label>
                <Select
                  value={newRoom.maxParticipants.toString()}
                  onValueChange={(value) => setNewRoom({ ...newRoom, maxParticipants: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20, 30, 50].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRoom(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRoom} disabled={!newRoom.name || createRoomMutation.isPending}>
              {createRoomMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Details Dialog */}
      <Dialog open={showRoomDetails} onOpenChange={setShowRoomDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRoom?.name}
              {selectedRoom && getRoomTypeIcon(selectedRoom.roomType)}
            </DialogTitle>
            <DialogDescription>
              {selectedRoom?.description || selectedRoom?.topic}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Room Info */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedRoom?.currentParticipants}/{selectedRoom?.maxParticipants}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleLeaveRoom(selectedRoom?.id)}
                  disabled={leaveRoomMutation.isPending}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Leave
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleJoinRoom(selectedRoom?.id)}
                  disabled={joinRoomMutation.isPending}
                >
                  {joinRoomMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-1" />
                      Join Room
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="border rounded-lg">
              <div className="p-3 border-b">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Room Chat
                </h4>
              </div>
              <ScrollArea className="h-[200px] p-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((msg: any) => (
                      <div key={msg.id} className="flex gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {msg.messageType === "system" ? "SYS" : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium">
                              {msg.messageType === "system" ? "System" : `User ${msg.userId}`}
                            </span>
                            <span className="text-muted-foreground text-xs ml-2">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No messages yet
                  </p>
                )}
              </ScrollArea>
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === "Enter" && setMessage("")}
                  />
                  <Button size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
