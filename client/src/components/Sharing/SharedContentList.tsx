import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Share, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SharedContentListProps {
  workspaceId: string;
}

export function SharedContentList({ workspaceId }: SharedContentListProps) {
  const { data: sharedContent = [], isLoading } = useQuery({
    queryKey: [`/api/workspaces/${workspaceId}/shared-content`],
  });

  const { data: sharedSummaries = [], isLoading: summariesLoading } = useQuery({
    queryKey: [`/api/workspaces/${workspaceId}/shared-summaries`],
  });

  const sharedContentArray = (sharedContent as any[]);
  const sharedSummariesArray = (sharedSummaries as any[]);

  if (isLoading || summariesLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
        <div className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (sharedContentArray.length === 0 && sharedSummariesArray.length === 0) {
    return (
      <div className="text-center py-8">
        <Share className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
        <p className="text-neutral-500 dark:text-neutral-400">
          No shared content or summaries in this workspace yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sharedContentArray.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Shared Content</h3>
          <div className="space-y-3">
            {sharedContentArray.map((item: any) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium line-clamp-1">{item.contentItem.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        From: {item.fromWorkspace.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2 mb-2">
                      {item.contentItem.content}
                    </p>
                    {item.notes && (
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-2 rounded text-sm mb-2">
                        <strong>Notes:</strong> {item.notes}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Shared {formatDistanceToNow(new Date(item.createdAt))} ago
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.contentItem.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.contentItem.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {sharedSummariesArray.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Shared Summaries</h3>
          <div className="space-y-3">
            {sharedSummariesArray.map((item: any) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">Summary</h4>
                      <Badge variant="secondary" className="text-xs">
                        From: {item.fromWorkspace.name}
                      </Badge>
                      {item.isCollaborative && (
                        <Badge variant="outline" className="text-xs">
                          Collaborative
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-3 mb-2">
                      {item.summary.content}
                    </p>
                    {item.notes && (
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-2 rounded text-sm mb-2">
                        <strong>Notes:</strong> {item.notes}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Shared {formatDistanceToNow(new Date(item.createdAt))} ago
                      </span>
                      {item.summary.focus && (
                        <span>Focus: {item.summary.focus}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}