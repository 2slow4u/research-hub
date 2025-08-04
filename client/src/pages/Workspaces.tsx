import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Calendar, 
  FileText, 
  BarChart3,
  Edit,
  Trash2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Workspace {
  id: string;
  name: string;
  keywords: string[];
  purpose: string | null;
  createdAt: string;
  _count?: {
    contentItems: number;
    summaries: number;
  };
}

export default function Workspaces() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ['/api/workspaces'],
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      return await apiRequest(`/api/workspaces/${workspaceId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
      toast({
        title: "Workspace deleted",
        description: "The workspace has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting workspace",
        description: error.message || "Could not delete the workspace.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteWorkspace = (workspace: Workspace) => {
    if (window.confirm(`Are you sure you want to delete "${workspace.name}"? This will also delete all content and summaries in this workspace.`)) {
      deleteWorkspaceMutation.mutate(workspace.id);
    }
  };

  const filteredWorkspaces = workspaces?.filter(workspace =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workspace.keywords.some(keyword => 
      keyword.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    (workspace.purpose && workspace.purpose.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const sortedWorkspaces = filteredWorkspaces.sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Workspaces
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2">
              Manage your research workspaces and organize your content
            </p>
          </div>
          <Link href="/workspace/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Workspace
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Workspaces Grid */}
        {sortedWorkspaces.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="max-w-md mx-auto">
                <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  {searchQuery ? 'No matching workspaces' : 'No workspaces yet'}
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Create your first workspace to start organizing research content'
                  }
                </p>
                {!searchQuery && (
                  <Link href="/workspace/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Workspace
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedWorkspaces.map((workspace) => (
              <Card key={workspace.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {workspace.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(workspace.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/workspace/${workspace.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteWorkspace(workspace)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {workspace.purpose && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3 line-clamp-2">
                      {workspace.purpose}
                    </p>
                  )}
                  
                  {/* Keywords */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {workspace.keywords.slice(0, 3).map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {workspace.keywords.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{workspace.keywords.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>{workspace._count?.contentItems || 0} articles</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="w-3 h-3" />
                      <span>{workspace._count?.summaries || 0} summaries</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <Link href={`/workspace/${workspace.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Open Workspace
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}