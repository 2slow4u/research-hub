import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rss, Globe, CheckCircle, XCircle, Plus, ExternalLink } from "lucide-react";

interface SourcesTabProps {
  workspaceId: string;
  onAddSource: () => void;
}

export default function SourcesTab({ workspaceId, onAddSource }: SourcesTabProps) {
  const { data: sources, isLoading } = useQuery({
    queryKey: ['/api/workspaces', workspaceId, 'sources'],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!sources || sources.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-full">
            <Rss className="h-8 w-8 text-neutral-400" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          No sources configured
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
          Add RSS feeds and websites to automatically monitor for new content related to your research keywords.
        </p>
        <Button onClick={onAddSource}>
          <Plus className="h-4 w-4 mr-2" />
          Add Your First Source
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Monitored Sources</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            RSS feeds and websites being monitored for new content
          </p>
        </div>
        <Button onClick={onAddSource}>
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </div>

      <div className="grid gap-4">
        {sources.map((source: any) => (
          <Card key={source.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                    {source.type === 'rss' ? (
                      <Rss className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Globe className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{source.name}</CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-1">
                      <span>{source.url}</span>
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={source.isActive ? "default" : "secondary"}>
                    {source.isActive ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Paused
                      </>
                    )}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {source.type.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4 text-neutral-600 dark:text-neutral-400">
                  <span>Reputation: {source.reputation}%</span>
                  <span>•</span>
                  <span>
                    {source.isWhitelisted ? 'Trusted' : 'Under Review'}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  Added {new Date(source.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}