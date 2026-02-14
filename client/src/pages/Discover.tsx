import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  Star,
  MapPin,
  Clock,
  GraduationCap,
  BookOpen,
  Filter,
  Loader2,
  UserPlus,
  MessageSquare,
  Heart
} from "lucide-react";

const proficiencyLevels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
  { value: "master", label: "Master" },
];

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("both");

  // Fetch categories
  const { data: categories } = trpc.skills.getCategories.useQuery();
  
  // Fetch recommended users
  const { data: recommendedUsers, isLoading: recommendedLoading } = trpc.discovery.getRecommendedUsers.useQuery({
    type: selectedType as "learners" | "teachers" | "both",
    limit: 10,
  });
  
  // Fetch featured users
  const { data: featuredUsers, isLoading: featuredLoading } = trpc.discovery.getFeaturedUsers.useQuery({
    limit: 10,
  });
  
  // Fetch search results
  const { data: searchResults, isLoading: searchLoading, refetch: searchRefetch } = trpc.discovery.searchUsers.useQuery({
    query: searchQuery,
    categoryIds: selectedCategory !== "all" ? [parseInt(selectedCategory)] : undefined,
    limit: 20,
  });

  const handleSearch = () => {
    searchRefetch();
  };

  const getProficiencyLabel = (level: string) => {
    return proficiencyLevels.find(p => p.value === level)?.label || level;
  };

  const UserCard = ({ userData }: { userData: any }) => {
    const user = userData.user;
    const profile = userData.profile;
    const skills = userData.skills || [];
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile?.avatarUrl} />
              <AvatarFallback className="text-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{user?.name}</h3>
                {profile?.isVerified && (
                  <Badge variant="outline" className="text-[10px] h-5 border-blue-500 text-blue-500">
                    <Star className="w-2.5 h-2.5" />
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {profile?.headline || "No headline"}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {profile?.country && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />
                    {profile.country}
                  </span>
                )}
                {profile?.timezone && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {profile.timezone}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Skills */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-1.5">
              {skills.slice(0, 4).map((skill: any) => (
                <Badge key={skill.id} variant="secondary" className="text-xs">
                  {skill.isTeachEnabled && skill.teachingLevel !== "none" && (
                    <GraduationCap className="w-2.5 h-2.5 mr-1" />
                  )}
                  {skill.name}
                  <span className="ml-1 text-[10px] opacity-70">
                    {getProficiencyLabel(skill.proficiencyLevel)}
                  </span>
                </Badge>
              ))}
              {skills.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{skills.length - 4} more
                </Badge>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="flex-1">
              <UserPlus className="w-4 h-4 mr-1" />
              Connect
            </Button>
            <Button size="sm" variant="outline">
              <MessageSquare className="w-4 h-4" />
            </Button>
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
          <h1 className="text-3xl font-bold">Discover</h1>
          <p className="text-muted-foreground">
            Find learners and teachers who match your interests
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">All</SelectItem>
                  <SelectItem value="teachers">Teachers</SelectItem>
                  <SelectItem value="learners">Learners</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="recommended" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="search">All Results</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recommended for You
            </h2>
            <p className="text-sm text-muted-foreground">
              Based on your interests and learning goals
            </p>
          </div>
          {recommendedLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedUsers?.map((userData: any) => (
                <UserCard key={userData.user?.id} userData={userData} />
              ))}
            </div>
          )}
          {(!recommendedUsers || recommendedUsers.length === 0) && !recommendedLoading && (
            <Card className="p-8 text-center">
              <CardContent>
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No recommendations yet</h3>
                <p className="text-sm text-muted-foreground">
                  Add skills and interests to your profile to get personalized recommendations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Star className="w-5 h-5" />
              Featured Learners & Teachers
            </h2>
            <p className="text-sm text-muted-foreground">
              Top community members this week
            </p>
          </div>
          {featuredLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredUsers?.map((userData: any) => (
                <UserCard key={userData.user?.id} userData={userData} />
              ))}
            </div>
          )}
          {(!featuredUsers || featuredUsers.length === 0) && !featuredLoading && (
            <Card className="p-8 text-center">
              <CardContent>
                <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No featured users yet</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later for featured community members
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              {searchQuery ? `Results for "${searchQuery}"` : "All Users"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {searchResults?.length || 0} users found
            </p>
          </div>
          {searchLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults?.map((userData: any) => (
                <UserCard key={userData.user?.id} userData={userData} />
              ))}
            </div>
          )}
          {(!searchResults || searchResults.length === 0) && !searchLoading && (
            <Card className="p-8 text-center">
              <CardContent>
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No users found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
