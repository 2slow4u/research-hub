import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import SummaryModal from "@/components/Summary/SummaryModal";
import AddContentModal from "@/components/Content/AddContentModal";
import SourcesTab from "@/components/Sources/SourcesTab";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  FileText, 
  Calendar, 
  ExternalLink, 
  Zap,
  Filter,
  Download,
  Edit,
  Trash2,
  PlayCircle,
  PauseCircle,
  Share,
  BookOpen
} from "lucide-react";
import { ShareContentModal } from "@/components/Sharing/ShareContentModal";
import { ShareSummaryModal } from "@/components/Sharing/ShareSummaryModal";
import { SharedContentList } from "@/components/Sharing/SharedContentList";

export default function WorkspaceDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [addContentModalOpen, setAddContentModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("content");

  const { data: workspace, isLoading: workspaceLoading } = useQuery({
    queryKey: ['/api/workspaces', id],
  });

  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/workspaces', id, 'content'],
  });

  const { data: summaries, isLoading: summariesLoading } = useQuery({
    queryKey: ['/api/workspaces', id, 'summaries'],
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      return await apiRequest('DELETE', `/api/content/${contentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', id, 'content'] });
      toast({
        title: "Content deleted",
        description: "The article has been removed from your workspace.",
      });
    },
    onError: () => {
      toast({
        title: "Error deleting content",
        description: "Could not delete the article. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteContent = (contentId: string) => {
    if (window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      deleteContentMutation.mutate(contentId);
    }
  };

  const handleOpenReader = (contentId: string) => {
    window.open(`/reader/${contentId}`, '_blank');
  };

  if (workspaceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Workspace Not Found
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400">
            The workspace you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  const filteredContent = content?.filter((item: any) =>
    !searchQuery || 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-3">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {workspace.name}
                </h2>
                <div className="flex items-center space-x-2">
                  {workspace.status === 'active' ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span className="text-sm text-accent font-medium">Active Monitoring</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Paused</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {workspace.keywords?.map((keyword: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
              
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Created {new Date(workspace.createdAt).toLocaleDateString()} • 
                Last updated {new Date(workspace.updatedAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Toggle workspace status
                }}
              >
                {workspace.status === 'active' ? (
                  <>
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>
              
              <Button onClick={() => setSummaryModalOpen(true)}>
                <Zap className="h-4 w-4 mr-2" />
                Generate Summary
              </Button>
            </div>
          </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="content">Content ({content?.length || 0})</TabsTrigger>
              <TabsTrigger value="summaries">Summaries ({summaries?.length || 0})</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-6">
              {/* Content Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-80 pl-10"
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button onClick={() => setAddContentModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Content
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Content List */}
              {contentLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader className="pb-3">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredContent.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    {searchQuery ? 'No content found' : 'No content yet'}
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                    {searchQuery 
                      ? `No content matches "${searchQuery}"`
                      : 'Add content directly, set up RSS feeds, or configure website monitoring to get started'
                    }
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setAddContentModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Content
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredContent.map((item: any) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg leading-tight">
                            {item.title}
                          </CardTitle>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge variant="outline" className="text-xs">
                              Score: {item.relevanceScore}%
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleOpenReader(item.id)}
                              title="Read in-app with annotations"
                            >
                              <BookOpen className="h-4 w-4" />
                            </Button>
                            <ShareContentModal
                              contentItemId={item.id}
                              workspaceId={id!}
                              trigger={
                                <Button variant="ghost" size="sm">
                                  <Share className="h-4 w-4" />
                                </Button>
                              }
                            />
                            {item.url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteContent(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              title="Delete article"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          {item.publishedAt && (
                            <span>Published {new Date(item.publishedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-neutral-600 dark:text-neutral-300 line-clamp-3">
                          {item.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="summaries" className="space-y-6">
              {/* Summaries Controls */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Generated Summaries
                </h3>
                <Button onClick={() => setSummaryModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Summary
                </Button>
              </div>

              {/* Summaries List */}
              {summariesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : summaries?.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    No summaries yet
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                    Generate your first AI-powered summary from the collected content
                  </p>
                  <Button onClick={() => setSummaryModalOpen(true)}>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Summary
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {summaries?.map((summary: any) => (
                    <Card key={summary.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{summary.title}</CardTitle>
                            <CardDescription className="mt-2">
                              <div className="flex items-center space-x-4 text-sm">
                                <Badge variant={summary.type === 'full' ? 'default' : 'secondary'}>
                                  {summary.type === 'full' ? 'Full Summary' : 'Differential'}
                                </Badge>
                                <span>Version {summary.version}</span>
                                <span>{new Date(summary.createdAt).toLocaleDateString()}</span>
                                <span>{summary.contentItems?.length || 0} sources</span>
                              </div>
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ShareSummaryModal
                              summaryId={summary.id}
                              workspaceId={id!}
                              trigger={
                                <Button variant="ghost" size="sm">
                                  <Share className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-neutral-600 dark:text-neutral-300 line-clamp-2">
                          {summary.content.replace(/[#*`]/g, '').substring(0, 200)}...
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="sources" className="space-y-6">
              <SourcesTab 
                workspaceId={id!} 
                onAddSource={() => setAddContentModalOpen(true)}
              />
            </TabsContent>
            
            <TabsContent value="shared" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Shared Content & Summaries
                </h3>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Content and summaries shared from other workspaces
                </div>
              </div>
              
              <SharedContentList workspaceId={id!} />
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Workspace Settings</CardTitle>
                  <CardDescription>
                    Configure monitoring and content collection settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Monitoring Frequency
                    </label>
                    <select className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700">
                      <option value="hourly">Every hour</option>
                      <option value="6hours">Every 6 hours</option>
                      <option value="daily" selected>Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Keywords
                    </label>
                    <textarea 
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
                      rows={3}
                      defaultValue={workspace.keywords?.join(', ')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Delete Workspace
                      </h4>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Permanently delete this workspace and all its content
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        <SummaryModal 
          open={summaryModalOpen} 
          onOpenChange={setSummaryModalOpen}
          workspaceId={id!}
          workspace={workspace}
          latestSummary={summaries?.[0]}
        />
        
        <AddContentModal
          open={addContentModalOpen}
          onOpenChange={setAddContentModalOpen}
          workspaceId={id!}
        />
      </div>
  );
}
