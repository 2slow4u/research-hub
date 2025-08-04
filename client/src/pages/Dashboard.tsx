import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/Layout/Sidebar";
import WorkspaceCard from "@/components/Workspace/WorkspaceCard";
import CreateWorkspaceModal from "@/components/Workspace/CreateWorkspaceModal";
import ActivityFeed from "@/components/Activity/ActivityFeed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Folder, FileText, Rss, Zap } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: isAuthenticated,
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const { data: workspaces, isLoading: workspacesLoading } = useQuery({
    queryKey: ['/api/workspaces'],
    enabled: isAuthenticated,
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const { data: activities } = useQuery({
    queryKey: ['/api/activities'],
    enabled: isAuthenticated,
  });

  const filteredWorkspaces = workspaces?.filter((workspace: any) =>
    !searchQuery || workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Research Workspaces</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Manage your research topics and monitor latest publications
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              </div>
              
              {/* Create New Workspace */}
              <Button onClick={() => setCreateModalOpen(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Workspace</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Workspace Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Active Workspaces</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {statsLoading ? '-' : stats?.activeWorkspaces || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Folder className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Content Items</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {statsLoading ? '-' : stats?.contentItems || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Generated Summaries</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {statsLoading ? '-' : stats?.summaries || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Sources Monitored</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {statsLoading ? '-' : stats?.sourcesMonitored || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Rss className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Workspaces Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Recent Workspaces</h3>
              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm">All</Button>
                <Button variant="ghost" size="sm">Active</Button>
                <Button variant="ghost" size="sm">Archived</Button>
              </div>
            </div>

            {workspacesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 animate-pulse">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {searchQuery ? 'No workspaces found' : 'No workspaces yet'}
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                  {searchQuery 
                    ? `No workspaces match "${searchQuery}"`
                    : 'Create your first research workspace to get started'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workspace
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkspaces.map((workspace: any) => (
                  <WorkspaceCard key={workspace.id} workspace={workspace} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <ActivityFeed activities={activities} />
        </main>
      </div>

      <CreateWorkspaceModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />
    </div>
  );
}
