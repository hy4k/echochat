import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BookOpen,
  Search,
  Plus,
  Download,
  Star,
  Loader2,
  FileText,
  Video,
  Link,
  Code,
  Image,
  Music,
  Filter,
  ExternalLink,
  Trash2,
  Edit
} from "lucide-react";

const resourceTypeIcons: Record<string, any> = {
  document: FileText,
  video: Video,
  audio: Music,
  link: Link,
  code: Code,
  image: Image,
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-500/20 text-green-500",
  intermediate: "bg-blue-500/20 text-blue-500",
  advanced: "bg-purple-500/20 text-purple-500",
  all: "bg-gray-500/20 text-gray-500",
};

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [showResourceDetails, setShowResourceDetails] = useState(false);
  const [showUploadResource, setShowUploadResource] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    resourceType: "document" as "document" | "video" | "audio" | "link" | "code" | "image",
    url: "",
    content: "",
    difficulty: "all" as "beginner" | "intermediate" | "advanced" | "all",
    tags: "",
    isPublic: true,
    isPremium: false,
  });

  // Fetch resources
  const { data: resources, isLoading, refetch } = trpc.resources.getResources.useQuery({
    limit: 20,
    sortBy: "newest",
  });

  // Mutations
  const createResourceMutation = trpc.resources.createResource.useMutation({
    onSuccess: () => {
      setShowUploadResource(false);
      setNewResource({
        title: "",
        description: "",
        resourceType: "document",
        url: "",
        content: "",
        difficulty: "all",
        tags: "",
        isPublic: true,
        isPremium: false,
      });
      refetch();
    },
  });

  const downloadResourceMutation = trpc.resources.downloadResource.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteResourceMutation = trpc.resources.deleteResource.useMutation({
    onSuccess: () => {
      setShowResourceDetails(false);
      refetch();
    },
  });

  const rateResourceMutation = trpc.resources.rateResource.useMutation();

  const handleCreateResource = () => {
    createResourceMutation.mutate({
      title: newResource.title,
      description: newResource.description,
      resourceType: newResource.resourceType,
      url: newResource.url || undefined,
      content: newResource.content || undefined,
      difficulty: newResource.difficulty,
      tags: newResource.tags.split(",").map(t => t.trim()).filter(Boolean),
      isPublic: newResource.isPublic,
      isPremium: newResource.isPremium,
    });
  };

  const handleDownload = (resourceId: number) => {
    downloadResourceMutation.mutate({ resourceId });
  };

  const handleDelete = (resourceId: number) => {
    deleteResourceMutation.mutate({ resourceId });
  };

  const ResourceCard = ({ resource }: { resource: any }) => {
    const Icon = resourceTypeIcons[resource.resourceType] || FileText;
    
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
        setSelectedResource(resource);
        setShowResourceDetails(true);
      }}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{resource.title}</h3>
                {resource.isPremium && (
                  <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-500">
                    Premium
                  </Badge>
                )}
              </div>
              {resource.description && (
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {resource.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <Badge className={difficultyColors[resource.difficulty] || ""}>
                  {resource.difficulty}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3" />
                  {resource.rating || "0.0"} ({resource.ratingCount || 0})
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Download className="w-3 h-3" />
                  {resource.downloadCount || 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Filter resources
  const filteredResources = resources?.filter(r => {
    if (selectedType !== "all" && r.resourceType !== selectedType) return false;
    if (selectedDifficulty !== "all" && r.difficulty !== selectedDifficulty) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return r.title.toLowerCase().includes(query) || 
             (r.description && r.description.toLowerCase().includes(query));
    }
    return true;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Resources
          </h1>
          <p className="text-muted-foreground">
            Browse and share learning resources
          </p>
        </div>
        <Button onClick={() => setShowUploadResource(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Upload Resource
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources?.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
      {(!filteredResources || filteredResources.length === 0) && !isLoading && (
        <Card className="p-8 text-center">
          <CardContent>
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No resources found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to share a resource
            </p>
            <Button onClick={() => setShowUploadResource(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Resource
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Resource Dialog */}
      <Dialog open={showUploadResource} onOpenChange={setShowUploadResource}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Resource</DialogTitle>
            <DialogDescription>
              Share a learning resource with the community
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="resourceTitle">Title</Label>
              <Input
                id="resourceTitle"
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                placeholder="Resource title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resourceDescription">Description</Label>
              <Textarea
                id="resourceDescription"
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                placeholder="What is this resource about?"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Resource Type</Label>
                <Select
                  value={newResource.resourceType}
                  onValueChange={(value: "document" | "video" | "audio" | "link" | "code" | "image") => setNewResource({ ...newResource, resourceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Difficulty</Label>
                <Select
                  value={newResource.difficulty}
                  onValueChange={(value: "beginner" | "intermediate" | "advanced" | "all") => setNewResource({ ...newResource, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newResource.resourceType === "link" ? (
              <div className="grid gap-2">
                <Label htmlFor="resourceUrl">URL</Label>
                <Input
                  id="resourceUrl"
                  value={newResource.url}
                  onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="resourceContent">Content</Label>
                <Textarea
                  id="resourceContent"
                  value={newResource.content}
                  onChange={(e) => setNewResource({ ...newResource, content: e.target.value })}
                  placeholder="Paste content or write your resource..."
                  rows={4}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="resourceTags">Tags (comma separated)</Label>
              <Input
                id="resourceTags"
                value={newResource.tags}
                onChange={(e) => setNewResource({ ...newResource, tags: e.target.value })}
                placeholder="javascript, react, web development"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newResource.isPublic}
                  onChange={(e) => setNewResource({ ...newResource, isPublic: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Public</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newResource.isPremium}
                  onChange={(e) => setNewResource({ ...newResource, isPremium: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Premium</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadResource(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateResource} disabled={!newResource.title || createResourceMutation.isPending}>
              {createResourceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resource Details Dialog */}
      <Dialog open={showResourceDetails} onOpenChange={setShowResourceDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedResource?.title}</DialogTitle>
            <DialogDescription>
              {selectedResource?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-3">
              <Badge className={difficultyColors[selectedResource?.difficulty] || ""}>
                {selectedResource?.difficulty}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-4 h-4" />
                {selectedResource?.rating || "0.0"} ({selectedResource?.ratingCount || 0} ratings)
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Download className="w-4 h-4" />
                {selectedResource?.downloadCount || 0} downloads
              </span>
            </div>
            
            {selectedResource?.url && (
              <Button variant="outline" className="w-full" asChild>
                <a href={selectedResource.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Resource
                </a>
              </Button>
            )}
            
            {selectedResource?.content && (
              <div className="p-3 bg-muted rounded-lg max-h-[200px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">{selectedResource.content}</pre>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => handleDownload(selectedResource?.id)}
                disabled={downloadResourceMutation.isPending}
              >
                {downloadResourceMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleDelete(selectedResource?.id)}
                disabled={deleteResourceMutation.isPending}
              >
                {deleteResourceMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
