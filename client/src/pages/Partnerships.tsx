import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Users,
  Calendar,
  Clock,
  Star,
  MessageSquare,
  HandHeart,
  Loader2,
  X,
  AlertTriangle,
  ThumbsUp,
  Award
} from "lucide-react";

export default function Partnerships() {
  const [selectedPartnership, setSelectedPartnership] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showEndPartnership, setShowEndPartnership] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    teachingRating: 5,
    communicationRating: 5,
    reliabilityRating: 5,
    comment: "",
    feedbackType: "positive" as "positive" | "neutral" | "negative",
  });
  const [endReason, setEndReason] = useState("");

  // Fetch partnerships
  const { data: partnerships, isLoading, refetch } = trpc.partnerships.getPartnerships.useQuery({
    limit: 20,
  });

  // Mutations
  const submitFeedbackMutation = trpc.partnerships.submitFeedback.useMutation({
    onSuccess: () => {
      setShowFeedback(false);
      setFeedbackForm({
        rating: 5,
        teachingRating: 5,
        communicationRating: 5,
        reliabilityRating: 5,
        comment: "",
        feedbackType: "positive",
      });
    },
  });

  const endPartnershipMutation = trpc.partnerships.endPartnership.useMutation({
    onSuccess: () => {
      setShowEndPartnership(false);
      setSelectedPartnership(null);
      refetch();
    },
  });

  const handleSubmitFeedback = () => {
    if (selectedPartnership) {
      const otherUserId = selectedPartnership.user1Id === 1 ? selectedPartnership.user2Id : selectedPartnership.user1Id;
      submitFeedbackMutation.mutate({
        partnershipId: selectedPartnership.id,
        revieweeId: otherUserId,
        rating: feedbackForm.rating,
        teachingRating: feedbackForm.teachingRating,
        communicationRating: feedbackForm.communicationRating,
        reliabilityRating: feedbackForm.reliabilityRating,
        comment: feedbackForm.comment,
        feedbackType: feedbackForm.feedbackType,
      });
    }
  };

  const handleEndPartnership = () => {
    if (selectedPartnership) {
      endPartnershipMutation.mutate({
        partnershipId: selectedPartnership.id,
        reason: endReason,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-500">Active</Badge>;
      case "paused":
        return <Badge className="bg-yellow-500/20 text-yellow-500">Paused</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/20 text-blue-500">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-500">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const PartnershipCard = ({ partnership }: { partnership: any }) => (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedPartnership(partnership)}
    >
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback>
              <Users className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Partnership #{partnership.id}</h3>
              {getStatusBadge(partnership.status)}
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Started: {formatDate(partnership.startDate)}
              </div>
              {partnership.endDate && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Ended: {formatDate(partnership.endDate)}
                </div>
              )}
            </div>

            {partnership.status === "active" && (
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Message
                </Button>
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPartnership(partnership);
                  setShowFeedback(true);
                }}>
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Feedback
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
            <HandHeart className="w-8 h-8" />
            Partnerships
          </h1>
          <p className="text-muted-foreground">
            Manage your active learning partnerships
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{partnerships?.filter(p => p.status === "active").length || 0}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{partnerships?.filter(p => p.status === "paused").length || 0}</div>
            <p className="text-sm text-muted-foreground">Paused</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{partnerships?.filter(p => p.status === "completed").length || 0}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{partnerships?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Partnerships List */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="active">
            Active ({partnerships?.filter(p => p.status === "active").length || 0})
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused ({partnerships?.filter(p => p.status === "paused").length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({partnerships?.filter(p => p.status === "completed").length || 0})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({partnerships?.filter(p => p.status === "cancelled").length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partnerships?.filter(p => p.status === "active").map((partnership) => (
                <PartnershipCard key={partnership.id} partnership={partnership} />
              ))}
            </div>
          )}
          {(!partnerships || partnerships.filter(p => p.status === "active").length === 0) && !isLoading && (
            <Card className="p-8 text-center">
              <CardContent>
                <HandHeart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No active partnerships</h3>
                <p className="text-sm text-muted-foreground">
                  Accept matches to start learning partnerships
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paused" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partnerships?.filter(p => p.status === "paused").map((partnership) => (
              <PartnershipCard key={partnership.id} partnership={partnership} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partnerships?.filter(p => p.status === "completed").map((partnership) => (
              <PartnershipCard key={partnership.id} partnership={partnership} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partnerships?.filter(p => p.status === "cancelled").map((partnership) => (
              <PartnershipCard key={partnership.id} partnership={partnership} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Feedback</DialogTitle>
            <DialogDescription>
              Rate your learning experience
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Overall Rating</Label>
              <Select
                value={feedbackForm.rating.toString()}
                onValueChange={(value) => setFeedbackForm({ ...feedbackForm, rating: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Poor</SelectItem>
                  <SelectItem value="2">2 - Fair</SelectItem>
                  <SelectItem value="3">3 - Good</SelectItem>
                  <SelectItem value="4">4 - Very Good</SelectItem>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Teaching</Label>
                <Select
                  value={feedbackForm.teachingRating.toString()}
                  onValueChange={(value) => setFeedbackForm({ ...feedbackForm, teachingRating: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Communication</Label>
                <Select
                  value={feedbackForm.communicationRating.toString()}
                  onValueChange={(value) => setFeedbackForm({ ...feedbackForm, communicationRating: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Reliability</Label>
                <Select
                  value={feedbackForm.reliabilityRating.toString()}
                  onValueChange={(value) => setFeedbackForm({ ...feedbackForm, reliabilityRating: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Feedback Type</Label>
              <Select
                value={feedbackForm.feedbackType}
                onValueChange={(value: "positive" | "neutral" | "negative") => setFeedbackForm({ ...feedbackForm, feedbackType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Comments (optional)</Label>
              <Textarea
                value={feedbackForm.comment}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                placeholder="Share your experience..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedback(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback} disabled={submitFeedbackMutation.isPending}>
              {submitFeedbackMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Partnership Dialog */}
      <Dialog open={showEndPartnership} onOpenChange={setShowEndPartnership}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              End Partnership
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to end this partnership?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={endReason}
                onChange={(e) => setEndReason(e.target.value)}
                placeholder="Why are you ending this partnership?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndPartnership(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleEndPartnership} 
              disabled={endPartnershipMutation.isPending}
            >
              {endPartnershipMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              End Partnership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
