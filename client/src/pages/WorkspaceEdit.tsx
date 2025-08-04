import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save } from "lucide-react";

const editWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  purpose: z.string().optional(),
  keywords: z.string().min(1, "At least one keyword is required"),
  monitoringFrequency: z.enum(["hourly", "6hours", "daily", "weekly"]),
});

type EditWorkspaceForm = z.infer<typeof editWorkspaceSchema>;

interface Workspace {
  id: string;
  name: string;
  purpose: string | null;
  keywords: string[];
  monitoringFrequency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorkspaceEdit() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: workspace, isLoading } = useQuery<Workspace>({
    queryKey: ['/api/workspaces', id],
    queryFn: () => apiRequest(`/api/workspaces/${id}`, 'GET'),
  });

  const form = useForm<EditWorkspaceForm>({
    resolver: zodResolver(editWorkspaceSchema),
    defaultValues: {
      name: "",
      purpose: "",
      keywords: "",
      monitoringFrequency: "daily",
    },
  });

  // Update form when workspace data loads
  useEffect(() => {
    if (workspace) {
      form.reset({
        name: workspace.name,
        purpose: workspace.purpose || "",
        keywords: workspace.keywords.join(", "),
        monitoringFrequency: workspace.monitoringFrequency as any,
      });
    }
  }, [workspace, form]);

  const updateWorkspaceMutation = useMutation({
    mutationFn: async (data: EditWorkspaceForm) => {
      const keywordsArray = data.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      return await apiRequest(`/api/workspaces/${id}`, 'PATCH', {
        ...data,
        keywords: keywordsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', id] });
      toast({
        title: "Workspace updated",
        description: "Your workspace has been updated successfully.",
      });
      setLocation(`/workspace/${id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating workspace",
        description: error.message || "Could not update the workspace.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditWorkspaceForm) => {
    updateWorkspaceMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation(`/workspace/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <Card>
            <CardHeader>
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                <div className="h-20 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Workspace not found
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                The workspace you're trying to edit doesn't exist or you don't have permission to access it.
              </p>
              <Button onClick={() => setLocation('/workspaces')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workspaces
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Edit Workspace
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2">
              Update your workspace settings and monitoring preferences
            </p>
          </div>
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Workspace Settings</CardTitle>
            <CardDescription>
              Configure your workspace name, purpose, keywords, and monitoring frequency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Workspace Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Artificial Intelligence Trends" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your research workspace
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Purpose */}
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Monitor the latest developments in AI research for my thesis"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe the goal or purpose of this workspace to improve content relevance scoring
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Keywords */}
                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., artificial intelligence, machine learning, neural networks"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated keywords to monitor for relevant content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Monitoring Frequency */}
                <FormField
                  control={form.control}
                  name="monitoringFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monitoring Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select monitoring frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="6hours">Every 6 Hours</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often to check for new content matching your keywords
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateWorkspaceMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateWorkspaceMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}