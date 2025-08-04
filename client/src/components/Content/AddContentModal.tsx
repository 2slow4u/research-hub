import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Link, 
  Rss, 
  Globe, 
  Plus,
  FileText,
  ExternalLink
} from "lucide-react";

interface AddContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export default function AddContentModal({ open, onOpenChange, workspaceId }: AddContentModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("url");
  
  // URL/Link form
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [customContent, setCustomContent] = useState("");
  
  // RSS Feed form
  const [feedUrl, setFeedUrl] = useState("");
  const [feedName, setFeedName] = useState("");
  
  // Website monitoring form
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteName, setWebsiteName] = useState("");
  const [selectors, setSelectors] = useState("");

  const addContentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', `/api/workspaces/${workspaceId}/content`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId, 'content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: "Content added",
        description: "Your content has been added successfully.",
      });
      onOpenChange(false);
      resetForms();
    },
    onError: (error) => {
      toast({
        title: "Error adding content",
        description: "Please check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  const addSourceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', `/api/workspaces/${workspaceId}/sources`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId, 'sources'] });
      toast({
        title: "Source added",
        description: "Your source has been added and will be monitored regularly.",
      });
      onOpenChange(false);
      resetForms();
    },
    onError: (error) => {
      toast({
        title: "Error adding source",
        description: "Please check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  const resetForms = () => {
    setUrl("");
    setTitle("");
    setCustomContent("");
    setFeedUrl("");
    setFeedName("");
    setWebsiteUrl("");
    setWebsiteName("");
    setSelectors("");
  };

  const handleAddUrl = () => {
    if (!url.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      return;
    }

    addContentMutation.mutate({
      type: 'url',
      url: url.trim(),
      title: title.trim() || undefined,
      content: customContent.trim() || undefined,
    });
  };

  const handleAddRssFeed = () => {
    if (!feedUrl.trim() || !feedName.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please enter both feed URL and name.",
        variant: "destructive",
      });
      return;
    }

    addSourceMutation.mutate({
      type: 'rss',
      url: feedUrl.trim(),
      name: feedName.trim(),
    });
  };

  const handleAddWebsite = () => {
    if (!websiteUrl.trim() || !websiteName.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please enter both website URL and name.",
        variant: "destructive",
      });
      return;
    }

    addSourceMutation.mutate({
      type: 'web',
      url: websiteUrl.trim(),
      name: websiteName.trim(),
      selectors: selectors.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
          <DialogDescription>
            Add content directly, set up RSS feed monitoring, or configure website tracking.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url" className="flex items-center space-x-2">
              <Link className="h-4 w-4" />
              <span>Direct Link</span>
            </TabsTrigger>
            <TabsTrigger value="rss" className="flex items-center space-x-2">
              <Rss className="h-4 w-4" />
              <span>RSS Feed</span>
            </TabsTrigger>
            <TabsTrigger value="website" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Website</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  placeholder="Custom title for this content"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="customContent">Custom Content (optional)</Label>
                <Textarea
                  id="customContent"
                  placeholder="Add your own notes or content about this link..."
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  The content will be extracted and processed automatically
                </div>
                <Button 
                  onClick={handleAddUrl}
                  disabled={addContentMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addContentMutation.isPending ? 'Adding...' : 'Add Content'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rss" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="feedUrl">RSS Feed URL *</Label>
                <Input
                  id="feedUrl"
                  placeholder="https://example.com/feed.xml"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="feedName">Feed Name *</Label>
                <Input
                  id="feedName"
                  placeholder="TechCrunch AI News"
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
                />
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  New posts will be automatically monitored and processed
                </div>
                <Button 
                  onClick={handleAddRssFeed}
                  disabled={addSourceMutation.isPending}
                >
                  <Rss className="h-4 w-4 mr-2" />
                  {addSourceMutation.isPending ? 'Adding...' : 'Add RSS Feed'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="website" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="websiteUrl">Website URL *</Label>
                <Input
                  id="websiteUrl"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="websiteName">Source Name *</Label>
                <Input
                  id="websiteName"
                  placeholder="Company Blog"
                  value={websiteName}
                  onChange={(e) => setWebsiteName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="selectors">CSS Selectors (optional)</Label>
                <Input
                  id="selectors"
                  placeholder=".article-content, .post-title"
                  value={selectors}
                  onChange={(e) => setSelectors(e.target.value)}
                />
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Specify CSS selectors to target specific content areas
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Website changes will be monitored based on your keywords
                </div>
                <Button 
                  onClick={handleAddWebsite}
                  disabled={addSourceMutation.isPending}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {addSourceMutation.isPending ? 'Adding...' : 'Add Website'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}