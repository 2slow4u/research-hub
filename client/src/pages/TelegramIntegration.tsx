import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, Bot, Link, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function TelegramIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectForm, setConnectForm] = useState({
    chatId: "",
    username: "",
    defaultWorkspaceId: ""
  });

  // Fetch Telegram connection
  const { data: connection, isLoading: connectionLoading } = useQuery({
    queryKey: ["/api/telegram/connection"],
  });

  // Fetch user workspaces for default selection
  const { data: workspaces } = useQuery({
    queryKey: ["/api/workspaces"],
  });

  // Fetch Telegram submissions
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["/api/telegram/submissions"],
  });

  // Fetch bot status
  const { data: botStatus } = useQuery({
    queryKey: ["/api/telegram/status"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Connect Telegram mutation
  const connectMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/telegram/connect", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Connected successfully",
        description: "Your Telegram bot is now connected to ResearchHub",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/telegram/connection"] });
      setConnectForm({ chatId: "", username: "", defaultWorkspaceId: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect Telegram bot",
        variant: "destructive",
      });
    },
  });

  // Update connection mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      return await apiRequest(`/api/telegram/connection/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      toast({
        title: "Updated successfully",
        description: "Telegram connection settings have been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/telegram/connection"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update connection",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    if (!connectForm.chatId) {
      toast({
        title: "Chat ID required",
        description: "Please provide your Telegram chat ID",
        variant: "destructive",
      });
      return;
    }

    connectMutation.mutate(connectForm);
  };

  const handleUpdateDefaultWorkspace = (workspaceId: string) => {
    if ((connection as any)?.id) {
      updateMutation.mutate({
        id: (connection as any).id,
        defaultWorkspaceId: workspaceId
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Processed
        </Badge>;
      case 'pending':
        return <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'failed':
        return <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Telegram Integration
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Connect your Telegram bot to add content directly to your research workspaces
          </p>
        </div>
      </div>

      {/* Bot Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Bot Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                (botStatus as any)?.botInitialized ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm font-medium">
                {(botStatus as any)?.botInitialized ? 'Online' : 'Offline'}
              </span>
            </div>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Last checked: {botStatus ? formatDate((botStatus as any).timestamp) : 'Never'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Connection Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5" />
            <span>Connection Setup</span>
          </CardTitle>
          <CardDescription>
            Connect your Telegram account to ResearchHub bot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connection ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Connected
                  </span>
                </div>
                <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <p><strong>Chat ID:</strong> {(connection as any)?.telegramChatId}</p>
                  {(connection as any)?.telegramUsername && (
                    <p><strong>Username:</strong> @{(connection as any).telegramUsername}</p>
                  )}
                  <p><strong>Connected:</strong> {formatDate((connection as any)?.createdAt)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Default Workspace</Label>
                <Select
                  value={(connection as any)?.defaultWorkspaceId || ""}
                  onValueChange={handleUpdateDefaultWorkspace}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {(workspaces as any)?.map((workspace: any) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Content sent via Telegram will be added to this workspace by default
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  How to connect:
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>1. Search for "@ResearchHubBot" on Telegram</li>
                  <li>2. Send /start to initialize the bot</li>
                  <li>3. Send /connect &lt;your-email&gt; to link your account</li>
                  <li>4. The bot will confirm your connection</li>
                </ol>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="chatId">Telegram Chat ID</Label>
                  <Input
                    id="chatId"
                    value={connectForm.chatId}
                    onChange={(e) => setConnectForm({ ...connectForm, chatId: e.target.value })}
                    placeholder="Your Telegram chat ID"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Get this from the bot after running /start
                  </p>
                </div>

                <div>
                  <Label htmlFor="username">Telegram Username (Optional)</Label>
                  <Input
                    id="username"
                    value={connectForm.username}
                    onChange={(e) => setConnectForm({ ...connectForm, username: e.target.value })}
                    placeholder="@username (without @)"
                  />
                </div>

                <div>
                  <Label>Default Workspace</Label>
                  <Select
                    value={connectForm.defaultWorkspaceId}
                    onValueChange={(value) => setConnectForm({ ...connectForm, defaultWorkspaceId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {(workspaces as any)?.map((workspace: any) => (
                        <SelectItem key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleConnect}
                  disabled={connectMutation.isPending}
                  className="w-full"
                >
                  {connectMutation.isPending ? "Connecting..." : "Connect Telegram"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      {connection && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>
              Content recently added via Telegram bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissionsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (submissions as any)?.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  No submissions yet
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Send URLs, text, or files to your Telegram bot to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(submissions as any)?.slice(0, 10).map((submission: any) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {submission.submissionType}
                        </Badge>
                        {getStatusBadge(submission.status)}
                      </div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {submission.extractedTitle || 'Untitled'}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatDate(submission.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}