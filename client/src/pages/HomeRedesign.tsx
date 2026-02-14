import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  Flame, 
  Calendar, 
  Users, 
  Target, 
  BookOpen, 
  Trophy,
  ArrowRight,
  Play,
  Clock,
  Star,
  MessageSquare,
  Zap
} from "lucide-react";

export default function HomeRedesign() {
  const { user } = useAuth();

  // Fetch user data
  const { data: profile } = trpc.profile.getProfile.useQuery();
  const { data: userAchievements } = trpc.achievements.getUserAchievements.useQuery();
  const { data: partnerships } = trpc.partnerships.getPartnerships.useQuery({ status: "active" });
  const { data: upcomingSessions } = trpc.sessions.getSessions.useQuery({ limit: 3 });
  const { data: recommendedMatches } = trpc.matching.getMatches.useQuery({ status: "suggested", limit: 3 });
  const { data: skills } = trpc.skills.getUserSkills.useQuery();

  // Calculate streak (mock for now)
  const streakDays = 7;
  const weeklyGoal = 5;
  const sessionsThisWeek = 3;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {getGreeting()}, {user?.name?.split(" ")[0] || "Learner"}!
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to continue your learning journey?
          </p>
        </div>
        
        {/* Learning Streak */}
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{streakDays} day streak</div>
                <p className="text-sm text-muted-foreground">
                  {sessionsThisWeek}/{weeklyGoal} sessions this week
                </p>
                <Progress value={(sessionsThisWeek / weeklyGoal) * 100} className="h-2 mt-1 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{skills?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Skills</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{partnerships?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Partnerships</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{upcomingSessions?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{userAchievements?.filter(a => a.isCompleted).length || 0}</div>
                <p className="text-xs text-muted-foreground">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Sessions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription>Your scheduled learning sessions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href="/sessions">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingSessions && upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Play className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">{session.title}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(session.startTime).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                      <Button size="sm">
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                  <Button size="sm" className="mt-2" asChild>
                    <a href="/sessions">Schedule one</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Partnerships */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Recent Partnerships
                </CardTitle>
                <CardDescription>Your active learning connections</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href="/partnerships">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              {partnerships && partnerships.length > 0 ? (
                <div className="space-y-3">
                  {partnerships.slice(0, 3).map((partnership) => (
                    <div key={partnership.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            <Users className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">Partnership #{partnership.id}</div>
                          <div className="text-sm text-muted-foreground">
                            Started {new Date(partnership.startDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No active partnerships</p>
                  <Button size="sm" className="mt-2" asChild>
                    <a href="/matching">Find matches</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Matches */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Recommended Matches
                </CardTitle>
                <CardDescription>People you might learn from</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href="/matching">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              {recommendedMatches && recommendedMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recommendedMatches.map((match) => (
                    <div key={match.id} className="p-3 rounded-lg border text-center">
                      <Avatar className="h-12 w-12 mx-auto mb-2">
                        <AvatarFallback>
                          <Users className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium text-sm">Match #{match.id}</div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs">{match.compatibilityScore}%</span>
                      </div>
                      <Button size="sm" className="mt-2 w-full">
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Zap className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No recommendations yet</p>
                  <Button size="sm" className="mt-2" asChild>
                    <a href="/matching">Generate matches</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Learning Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Learning Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.learningGoals && profile.learningGoals.filter(g => g.status === "active").length > 0 ? (
                <div className="space-y-3">
                  {profile.learningGoals.filter(g => g.status === "active").slice(0, 3).map((goal) => (
                    <div key={goal.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="font-medium text-sm">{goal.title}</div>
                      {goal.targetLevel && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {goal.targetLevel}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Target className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No active goals</p>
                  <Button size="sm" variant="outline" className="mt-2" asChild>
                    <a href="/profile">Set goals</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-20 flex-col gap-1" asChild>
                <a href="/discover">
                  <Users className="w-5 h-5" />
                  <span className="text-xs">Discover</span>
                </a>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-1" asChild>
                <a href="/rooms">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-xs">Rooms</span>
                </a>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-1" asChild>
                <a href="/resources">
                  <Trophy className="w-5 h-5" />
                  <span className="text-xs">Resources</span>
                </a>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-1" asChild>
                <a href="/achievements">
                  <Star className="w-5 h-5" />
                  <span className="text-xs">Achievements</span>
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Your Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Your Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {skills && skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 6).map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                  {skills.length > 6 && (
                    <Badge variant="outline">+{skills.length - 6} more</Badge>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <BookOpen className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No skills added</p>
                  <Button size="sm" variant="outline" className="mt-2" asChild>
                    <a href="/profile">Add skills</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
