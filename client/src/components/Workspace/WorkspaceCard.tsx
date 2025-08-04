import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WorkspaceCardProps {
  workspace: {
    id: string;
    name: string;
    keywords: string[];
    status: 'active' | 'paused' | 'archived';
    contentCount?: number;
    summaryCount?: number;
    updatedAt: string;
    createdAt: string;
  };
}

export default function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const statusConfig = {
    active: { color: 'bg-accent', text: 'Active Monitoring', textColor: 'text-accent' },
    paused: { color: 'bg-yellow-500', text: 'Paused', textColor: 'text-yellow-600 dark:text-yellow-400' },
    archived: { color: 'bg-neutral-400', text: 'Archived', textColor: 'text-neutral-500' },
  };

  const status = statusConfig[workspace.status];

  return (
    <Link href={`/workspace/${workspace.id}`}>
      <div className="workspace-card group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-primary transition-colors">
              {workspace.name}
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {workspace.keywords?.slice(0, 3).map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {workspace.keywords?.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{workspace.keywords.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Handle workspace menu
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Content Items</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
              {workspace.contentCount || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Last Updated</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
              {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Summaries</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
              {workspace.summaryCount || 0}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Circle className={`w-2 h-2 ${status.color} rounded-full`} />
            <span className={`text-sm font-medium ${status.textColor}`}>
              {status.text}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-blue-600"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Handle view summaries
            }}
          >
            View Summaries
          </Button>
        </div>
      </div>
    </Link>
  );
}
