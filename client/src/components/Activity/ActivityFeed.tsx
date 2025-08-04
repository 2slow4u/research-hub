import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  FolderPlus, 
  Zap, 
  FilePlus,
  Settings,
  Trash2,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  activities?: any[];
}

const activityIcons = {
  content_added: FilePlus,
  summary_generated: Zap,
  workspace_created: FolderPlus,
  workspace_updated: Settings,
  workspace_deleted: Trash2,
  summary_updated: FileText,
  user_created: User,
};

const activityColors = {
  content_added: 'text-primary bg-primary/10',
  summary_generated: 'text-accent bg-accent/10',
  workspace_created: 'text-secondary bg-secondary/10',
  workspace_updated: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
  workspace_deleted: 'text-red-600 bg-red-100 dark:bg-red-900/20',
  summary_updated: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  user_created: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
};

export default function ActivityFeed({ activities = [] }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card className="border border-neutral-200 dark:border-neutral-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">No activity yet</p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
              Activity will appear here as you use the platform
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-neutral-200 dark:border-neutral-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const IconComponent = activityIcons[activity.type as keyof typeof activityIcons] || FileText;
            const iconColor = activityColors[activity.type as keyof typeof activityColors] || 'text-neutral-600 bg-neutral-100';
            
            return (
              <div key={activity.id} className="activity-item">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">
                    {activity.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                    {activity.metadata?.count && (
                      <Badge variant="outline" className="text-xs">
                        {activity.metadata.count} items
                      </Badge>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary hover:text-blue-600"
                >
                  View
                </Button>
              </div>
            );
          })}
        </div>

        {activities.length > 0 && (
          <div className="mt-6 text-center">
            <Button variant="ghost" size="sm" className="text-neutral-500 dark:text-neutral-400 hover:text-primary">
              View all activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
