import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Move, Copy, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const contentActionSchema = z.object({
  targetWorkspaceId: z.string().min(1, "Please select a workspace"),
  action: z.enum(["move", "copy"], {
    required_error: "Please select an action",
  }),
  notes: z.string().optional(),
});

type ContentActionFormData = z.infer<typeof contentActionSchema>;

interface ContentActionModalProps {
  contentItemId: string;
  currentWorkspaceId: string;
  contentTitle: string;
  trigger?: React.ReactNode;
}

export function ContentActionModal({ 
  contentItemId, 
  currentWorkspaceId, 
  contentTitle,
  trigger 
}: ContentActionModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ContentActionFormData>({
    resolver: zodResolver(contentActionSchema),
    defaultValues: {
      action: "copy",
      notes: "",
    },
  });

  const watchedAction = form.watch("action");

  const { data: workspaces = [] } = useQuery({
    queryKey: ["/api/workspaces"],
  });

  // Filter out current workspace from available options
  const availableWorkspaces = (workspaces as any[]).filter(
    (workspace) => workspace.id !== currentWorkspaceId && workspace.status !== 'archived'
  );

  const contentActionMutation = useMutation({
    mutationFn: async (data: ContentActionFormData) => {
      return apiRequest(`/api/content/${contentItemId}/${data.action}`, "POST", {
        targetWorkspaceId: data.targetWorkspaceId,
        notes: data.notes,
      });
    },
    onSuccess: (_, variables) => {
      const actionText = variables.action === "move" ? "moved" : "copied";
      toast({
        title: `Content ${actionText}`,
        description: `"${contentTitle}" has been ${actionText} to the selected workspace.`,
      });
      
      // Force immediate refresh of content lists
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', currentWorkspaceId, 'content'] });
      queryClient.refetchQueries({ queryKey: ['/api/workspaces', currentWorkspaceId, 'content'] });
      
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', variables.targetWorkspaceId, 'content'] });
      queryClient.refetchQueries({ queryKey: ['/api/workspaces', variables.targetWorkspaceId, 'content'] });
      
      // Also refresh workspace counts and dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to process content action. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ContentActionFormData) => {
    contentActionMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ArrowRight className="h-4 w-4 mr-2" />
            Move/Copy
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Move or Copy Content</DialogTitle>
          <DialogDescription>
            Choose whether to move or copy "{contentTitle}" to another workspace.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Action</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="copy" id="copy" />
                        <Label htmlFor="copy" className="flex items-center cursor-pointer flex-1">
                          <Copy className="h-4 w-4 mr-2 text-blue-600" />
                          <div>
                            <div className="font-medium">Copy to workspace</div>
                            <div className="text-sm text-neutral-500">
                              Content appears in both workspaces (original stays)
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="move" id="move" />
                        <Label htmlFor="move" className="flex items-center cursor-pointer flex-1">
                          <Move className="h-4 w-4 mr-2 text-green-600" />
                          <div>
                            <div className="font-medium">Move to workspace</div>
                            <div className="text-sm text-neutral-500">
                              Content transfers completely (removed from current workspace)
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetWorkspaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Workspace</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination workspace" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableWorkspaces.map((workspace: any) => (
                        <SelectItem key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Add notes about why you're ${watchedAction === "move" ? "moving" : "copying"} this content...`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={contentActionMutation.isPending}
                className={watchedAction === "move" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {contentActionMutation.isPending 
                  ? `${watchedAction === "move" ? "Moving" : "Copying"}...` 
                  : `${watchedAction === "move" ? "Move" : "Copy"} Content`
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}