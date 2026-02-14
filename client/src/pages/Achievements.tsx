import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy, Award, Star, Flame, Target, Zap, Crown, Medal, Gift } from "lucide-react";

const categoryIcons: Record<string, any> = {
  learning: Target,
  teaching: Award,
  social: Star,
  streak: Flame,
  milestone: Trophy,
};

const categoryColors: Record<string, string> = {
  learning: "bg-blue-500/20 text-blue-500",
  teaching: "bg-purple-500/20 text-purple-500",
  social: "bg-pink-500/20 text-pink-500",
  streak: "bg-orange-500/20 text-orange-500",
  milestone: "bg-yellow-500/20 text-yellow-500",
};

export default function Achievements() {
  // Fetch all achievements
  const { data: achievements, isLoading: achievementsLoading } = trpc.achievements.getAchievements.useQuery();
  
  // Fetch user achievements
  const { data: userAchievements, isLoading: userAchievementsLoading, refetch: refetchUserAchievements } = trpc.achievements.getUserAchievements.useQuery();
  
  // Fetch all badges
  const { data: badges } = trpc.achievements.getBadges.useQuery();
  
  // Fetch user badges
  const { data: userBadges, isLoading: userBadgesLoading } = trpc.achievements.getUserBadges.useQuery();

  // Check achievements mutation
  const checkAchievementsMutation = trpc.achievements.checkAndAwardAchievements.useMutation({
    onSuccess: () => {
      refetchUserAchievements();
    },
  });

  const handleCheckAchievements = () => {
    checkAchievementsMutation.mutate({
      trigger: "session_completed",
    });
  };

  const AchievementCard = ({ achievement, userAchievement }: { achievement: any; userAchievement?: any }) => {
    const Icon = categoryIcons[achievement.category] || Trophy;
    const isEarned = userAchievement?.isCompleted;
    const progress = userAchievement?.progress || 0;
    const target = achievement.criteria?.value || 1;
    const progressPercent = Math.min((progress / target) * 100, 100);

    return (
      <Card className={isEarned ? "" : "opacity-70"}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              isEarned ? "bg-yellow-500/20" : "bg-muted"
            }`}>
              <Icon className={`w-6 h-6 ${isEarned ? "text-yellow-500" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{achievement.name}</h3>
                {isEarned && (
                  <Badge className="bg-green-500/20 text-green-500">Earned</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {achievement.description}
              </p>
              
              {!isEarned && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{progress}/{target}</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              )}
              
              {isEarned && userAchievement?.earnedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Earned on {new Date(userAchievement.earnedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const BadgeCard = ({ badge, userBadge }: { badge: any; userBadge?: any }) => {
    const isEarned = !!userBadge;
    
    return (
      <Card className={`${isEarned ? "" : "opacity-50"}`}>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center text-center">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-3 ${
              isEarned ? "bg-gradient-to-br from-yellow-400 to-yellow-600" : "bg-muted"
            }`}>
              <Crown className={`w-8 h-8 ${isEarned ? "text-white" : "text-muted-foreground"}`} />
            </div>
            <h3 className="font-semibold">{badge.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {badge.description}
            </p>
            {isEarned && (
              <Badge className="mt-2 bg-green-500/20 text-green-500">
                Earned
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Group achievements by category
  const groupedAchievements = achievements?.reduce((acc, achievement) => {
    const category = achievement.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  // Get user achievement map
  const userAchievementMap = userAchievements?.reduce((acc, ua) => {
    acc[ua.achievementId] = ua;
    return acc;
  }, {} as Record<number, typeof userAchievements[0]>);

  // Get user badge map
  const userBadgeMap = userBadges?.reduce((acc, ub) => {
    acc[ub.badgeId] = ub;
    return acc;
  }, {} as Record<number, typeof userBadges[0]>);

  const totalEarned = userAchievements?.filter(ua => ua.isCompleted).length || 0;
  const totalBadgesEarned = userBadges?.length || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8" />
            Achievements
          </h1>
          <p className="text-muted-foreground">
            Track your progress and earn badges
          </p>
        </div>
        <Button onClick={handleCheckAchievements} disabled={checkAchievementsMutation.isPending}>
          {checkAchievementsMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          Check Progress
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalEarned}</div>
            <p className="text-sm text-muted-foreground">Achievements Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{achievements?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total Achievements</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalBadgesEarned}</div>
            <p className="text-sm text-muted-foreground">Badges Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {achievements?.length ? Math.round((totalEarned / achievements.length) * 100) : 0}%
            </div>
            <p className="text-sm text-muted-foreground">Completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Showcase */}
      {userAchievements?.filter(ua => ua.isCompleted).slice(0, 3).map((ua) => {
        const achievement = achievements?.find(a => a.id === ua.achievementId);
        if (!achievement) return null;
        const Icon = categoryIcons[achievement.category] || Trophy;
        
        return (
          <Card key={ua.id} className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{achievement.name}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-500">
                  <Award className="w-3 h-3 mr-1" />
                  NEW
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Tabs */}
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="achievements">
            Achievements ({achievements?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="badges">
            Badges ({badges?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="mt-6">
          {achievementsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedAchievements || {}).map(([category, categoryAchievements]) => (
                <div key={category}>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <span className={`p-1.5 rounded-lg ${categoryColors[category] || "bg-muted"}`}>
                      {categoryIcons[category] && React.createElement(categoryIcons[category], { className: "w-4 h-4" })}
                    </span>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                    <span className="text-sm text-muted-foreground font-normal">
                      ({categoryAchievements.filter((a: any) => userAchievementMap?.[a.id]?.isCompleted).length}/{categoryAchievements.length})
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryAchievements.map((achievement: any) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        userAchievement={userAchievementMap?.[achievement.id]}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="badges" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges?.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                userBadge={userBadgeMap?.[badge.id]}
              />
            ))}
          </div>
          {(!badges || badges.length === 0) && (
            <Card className="p-8 text-center">
              <CardContent>
                <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No badges yet</h3>
                <p className="text-sm text-muted-foreground">
                  Badges will appear here as you progress
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
