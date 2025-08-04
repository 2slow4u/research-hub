import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Share } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const shareSummarySchema = z.object({
  toWorkspaceId: z.string().min(1, "Please select a workspace"),
  notes: z.string().optional(),
  isCollaborative: z.boolean().default(false),
});

type ShareSummaryFormData = z.infer<typeof shareSummarySchema>;

interface ShareSummaryModalProps {
  summaryId: string;
  workspaceId: string;
  trigger?: React.ReactNode;
}

export function ShareSummaryModal({ summaryId, workspaceId, trigger }: ShareSummaryModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ShareSummaryFormData>({
    resolver: zodResolver(shareSummarySchema),
    defaultValues: {
      notes: "",
      isCollaborative: false,
    },
  });

  const { data: workspaces = [] } = useQuery({
    queryKey: ["/api/workspaces"],
  });

  const shareSummaryMutation = useMutation({
    mutationFn: async (data: ShareSummaryFormData) => {
      return apiRequest(`/api/workspaces/${workspaceId}/share-summary`, "POST", {
        summaryId,
        toWorkspaceId: data.toWorkspaceId,
        notes: data.notes,
        isCollaborative: data.isCollaborative,
      });
    },
    onSuccess: () => {
      toast({
        title: "Summary shared",
        description: "Summary has been successfully shared to the selected workspace.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/shared-summaries`] });
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ShareSummaryFormData) => {
    shareSummaryMutation.mutate(data);
  };

  const availableWorkspaces = (workspaces as any[]).filter((ws: any) => ws.id !== workspaceId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Summary</DialogTitle>
          <DialogDescription>
            Share this summary to another workspace for collaboration.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="toWorkspaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Workspace</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a workspace" />
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
              name="isCollaborative"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Enable collaborative editing
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Allow others to edit and track changes to this summary.
                    </p>
                  </div>
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
                      placeholder="Add notes about why you're sharing this summary..."
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
                disabled={shareSummaryMutation.isPending}
              >
                {shareSummaryMutation.isPending ? "Sharing..." : "Share Summary"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}