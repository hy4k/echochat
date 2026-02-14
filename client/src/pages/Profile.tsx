import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  Edit2,
  Star,
  CheckCircle,
  Award,
  Target,
  BookOpen,
  GraduationCap,
  MapPin,
  Globe,
  Clock,
  Languages,
  MessageSquare,
  ThumbsUp,
  Plus,
  X,
  Loader2
} from "lucide-react";

const proficiencyLevels = [
  { value: "beginner", label: "Beginner", color: "bg-green-500" },
  { value: "intermediate", label: "Intermediate", color: "bg-blue-500" },
  { value: "advanced", label: "Advanced", color: "bg-purple-500" },
  { value: "expert", label: "Expert", color: "bg-orange-500" },
  { value: "master", label: "Master", color: "bg-red-500" },
];

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: "",
    headline: "",
    timezone: "",
    country: "",
    city: "",
    languages: "",
    teachingStyle: "",
    learningStyle: "",
    isAvailableForMentoring: true,
    preferredSessionLength: 60,
  });

  // Fetch profile data
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = trpc.profile.getProfile.useQuery();
  
  // Fetch user skills
  const { data: skills, isLoading: skillsLoading } = trpc.skills.getUserSkills.useQuery();
  
  // Fetch categories for skill selection
  const { data: categories } = trpc.skills.getCategories.useQuery();

  // Mutations
  const updateProfileMutation = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      refetchProfile();
      setIsEditing(false);
    },
  });

  const addSkillMutation = trpc.skills.createSkill.useMutation({
    onSuccess: () => {
      // Would refetch skills
    },
  });

  const updateSkillMutation = trpc.skills.updateSkill.useMutation();

  const removeSkillMutation = trpc.skills.deleteSkill.useMutation();

  const addInterestMutation = trpc.profile.addInterest.useMutation();

  const addGoalMutation = trpc.profile.addLearningGoal.useMutation({
    onSuccess: () => {
      refetchProfile();
    },
  });

  const [newSkill, setNewSkill] = useState({
    name: "",
    categoryId: "",
    proficiencyLevel: "beginner" as const,
    teachingLevel: "none" as const,
    learningLevel: "beginner" as const,
    isTeachEnabled: false,
    isLearnEnabled: true,
  });

  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    targetLevel: "" as "",
  });

  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate({
      bio: editForm.bio,
      headline: editForm.headline,
      timezone: editForm.timezone,
      country: editForm.country,
      city: editForm.city,
      languages: editForm.languages.split(",").map(l => l.trim()).filter(Boolean),
      teachingStyle: editForm.teachingStyle,
      learningStyle: editForm.learningStyle,
      isAvailableForMentoring: editForm.isAvailableForMentoring,
      preferredSessionLength: editForm.preferredSessionLength,
    });
  };

  const handleAddSkill = () => {
    addSkillMutation.mutate({
      name: newSkill.name,
      categoryId: newSkill.categoryId ? parseInt(newSkill.categoryId) : undefined,
      proficiencyLevel: newSkill.proficiencyLevel,
      teachingLevel: newSkill.teachingLevel,
      learningLevel: newSkill.learningLevel,
      isTeachEnabled: newSkill.isTeachEnabled,
      isLearnEnabled: newSkill.isLearnEnabled,
    });
    setNewSkill({
      name: "",
      categoryId: "",
      proficiencyLevel: "beginner",
      teachingLevel: "none",
      learningLevel: "beginner",
      isTeachEnabled: false,
      isLearnEnabled: true,
    });
    setShowAddSkill(false);
  };

  const handleAddGoal = () => {
    addGoalMutation.mutate({
      title: newGoal.title,
      description: newGoal.description,
      targetLevel: newGoal.targetLevel as "beginner" | "intermediate" | "advanced" | "expert" | "master" | undefined,
    });
    setNewGoal({ title: "", description: "", targetLevel: "" });
    setShowAddGoal(false);
  };

  const startEditing = () => {
    if (profile) {
      setEditForm({
        bio: profile.bio || "",
        headline: profile.headline || "",
        timezone: profile.timezone || "",
        country: profile.country || "",
        city: profile.city || "",
        languages: profile.languages?.join(", ") || "",
        teachingStyle: profile.teachingStyle || "",
        learningStyle: profile.learningStyle || "",
        isAvailableForMentoring: profile.isAvailableForMentoring ?? true,
        preferredSessionLength: profile.preferredSessionLength || 60,
      });
    }
    setIsEditing(true);
  };

  const getProficiencyColor = (level: string) => {
    return proficiencyLevels.find(p => p.value === level)?.color || "bg-gray-500";
  };

  const getProficiencyLabel = (level: string) => {
    return proficiencyLevels.find(p => p.value === level)?.label || level;
  };

  if (profileLoading || skillsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-violet-600 to-indigo-600" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-12">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile?.avatarUrl || user?.avatarUrl} />
              <AvatarFallback className="text-2xl">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{user?.name}</h1>
                {profile?.isAvailableForMentoring && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Available for Mentoring
                  </Badge>
                )}
                {profile?.isVerified && (
                  <Badge variant="outline" className="border-blue-500 text-blue-500">
                    <Star className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{profile?.headline || "Add a headline to your profile"}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {profile?.country && profile?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.city}, {profile.country}
                  </span>
                )}
                {profile?.timezone && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {profile.timezone}
                  </span>
                )}
                {profile?.languages && profile.languages.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Languages className="w-4 h-4" />
                    {profile.languages.join(", ")}
                  </span>
                )}
              </div>
            </div>
            <Button onClick={startEditing} variant="outline">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Skills & Stats */}
        <div className="space-y-6">
          {/* Skills I Can Teach */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Skills I Can Teach
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddSkill(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {skills?.filter(s => s.isTeachEnabled && s.teachingLevel !== "none").map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{skill.name}</span>
                          {skill.isVerified && (
                            <Badge variant="outline" className="text-[10px] h-5 border-blue-500 text-blue-500">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress 
                            value={(proficiencyLevels.findIndex(p => p.value === skill.proficiencyLevel) + 1) * 20} 
                            className="h-1.5 flex-1" 
                          />
                          <span className="text-xs text-muted-foreground">
                            {getProficiencyLabel(skill.teachingLevel)}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => removeSkillMutation.mutate({ id: skill.id })}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {(!skills || skills.filter(s => s.isTeachEnabled && s.teachingLevel !== "none").length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No teaching skills added yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Skills I Want to Learn */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Skills I Want to Learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {skills?.filter(s => s.isLearnEnabled && s.learningLevel !== "none").map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <div className="font-medium">{skill.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress 
                            value={(proficiencyLevels.findIndex(p => p.value === skill.proficiencyLevel) + 1) * 20} 
                            className="h-1.5 flex-1" 
                          />
                          <span className="text-xs text-muted-foreground">
                            {getProficiencyLabel(skill.learningLevel)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!skills || skills.filter(s => s.isLearnEnabled && s.learningLevel !== "none").length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No learning skills added yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Learning Goals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Learning Goals
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddGoal(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile?.learningGoals?.filter(g => g.status === "active").map((goal) => (
                  <div key={goal.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{goal.title}</div>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                        )}
                      </div>
                      {goal.targetLevel && (
                        <Badge variant="outline">{goal.targetLevel}</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {(!profile?.learningGoals || profile.learningGoals.filter(g => g.status === "active").length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active learning goals
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details & Endorsements */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="endorsements">Endorsements</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>About Me</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {profile?.bio || "No bio added yet. Tell others about yourself!"}
                  </p>
                  {profile?.teachingStyle && (
                    <div className="mt-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Teaching Style
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{profile.teachingStyle}</p>
                    </div>
                  )}
                  {profile?.learningStyle && (
                    <div className="mt-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Learning Style
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{profile.learningStyle}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="endorsements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Skill Endorsements</CardTitle>
                  <CardDescription>
                    Endorsements from other users validate your skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skills?.filter(s => s.isTeachEnabled).map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <div className="font-medium">{skill.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Teaching: {getProficiencyLabel(skill.teachingLevel)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">0</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Preferred Session Length</Label>
                      <div className="font-medium">{profile?.preferredSessionLength || 60} minutes</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Timezone</Label>
                      <div className="font-medium">{profile?.timezone || "Not set"}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Availability</Label>
                      <div className="font-medium">
                        {profile?.isAvailableForMentoring ? "Available" : "Not available"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Profile Visibility</Label>
                      <div className="font-medium">
                        {profile?.isPublicProfile ? "Public" : "Private"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={editForm.headline}
                onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                placeholder="A brief description of what you do"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell others about yourself"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                  placeholder="Country"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="City"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={editForm.timezone}
                onValueChange={(value) => setEditForm({ ...editForm, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
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
            <div className="grid gap-2">
              <Label htmlFor="languages">Languages (comma separated)</Label>
              <Input
                id="languages"
                value={editForm.languages}
                onChange={(e) => setEditForm({ ...editForm, languages: e.target.value })}
                placeholder="English, Spanish, French"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teachingStyle">Teaching Style</Label>
              <Textarea
                id="teachingStyle"
                value={editForm.teachingStyle}
                onChange={(e) => setEditForm({ ...editForm, teachingStyle: e.target.value })}
                placeholder="Describe your teaching approach"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="learningStyle">Learning Style</Label>
              <Textarea
                id="learningStyle"
                value={editForm.learningStyle}
                onChange={(e) => setEditForm({ ...editForm, learningStyle: e.target.value })}
                placeholder="How do you prefer to learn?"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sessionLength">Preferred Session Length (minutes)</Label>
              <Select
                value={editForm.preferredSessionLength.toString()}
                onValueChange={(value) => setEditForm({ ...editForm, preferredSessionLength: parseInt(value) })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Skill Dialog */}
      <Dialog open={showAddSkill} onOpenChange={setShowAddSkill}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
            <DialogDescription>
              Add a skill you can teach or want to learn
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="skillName">Skill Name</Label>
              <Input
                id="skillName"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                placeholder="e.g., JavaScript, Photography"
              />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={newSkill.categoryId}
                onValueChange={(value) => setNewSkill({ ...newSkill, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Proficiency Level</Label>
                <Select
                  value={newSkill.proficiencyLevel}
                  onValueChange={(value) => setNewSkill({ ...newSkill, proficiencyLevel: value as typeof newSkill.proficiencyLevel })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {proficiencyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Teaching Level</Label>
                <Select
                  value={newSkill.teachingLevel}
                  onValueChange={(value) => setNewSkill({ ...newSkill, teachingLevel: value as typeof newSkill.teachingLevel })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {proficiencyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="canTeach"
                checked={newSkill.isTeachEnabled}
                onChange={(e) => setNewSkill({ ...newSkill, isTeachEnabled: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="canTeach">I can teach this skill</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="wantToLearn"
                checked={newSkill.isLearnEnabled}
                onChange={(e) => setNewSkill({ ...newSkill, isLearnEnabled: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="wantToLearn">I want to learn this skill</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSkill(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSkill} disabled={!newSkill.name || addSkillMutation.isPending}>
              {addSkillMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Goal Dialog */}
      <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Learning Goal</DialogTitle>
            <DialogDescription>
              Set a new learning goal for yourself
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="goalTitle">Goal Title</Label>
              <Input
                id="goalTitle"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder="e.g., Learn React Native"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goalDescription">Description (optional)</Label>
              <Textarea
                id="goalDescription"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                placeholder="Describe your goal"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>Target Level</Label>
              <Select
                value={newGoal.targetLevel}
                onValueChange={(value) => setNewGoal({ ...newGoal, targetLevel: value as typeof newGoal.targetLevel })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target level" />
                </SelectTrigger>
                <SelectContent>
                  {proficiencyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGoal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGoal} disabled={!newGoal.title || addGoalMutation.isPending}>
              {addGoalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
