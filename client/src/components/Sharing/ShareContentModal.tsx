import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Share } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const shareContentSchema = z.object({
  toWorkspaceId: z.string().min(1, "Please select a workspace"),
  notes: z.string().optional(),
});

type ShareContentFormData = z.infer<typeof shareContentSchema>;

interface ShareContentModalProps {
  contentItemId: string;
  workspaceId: string;
  trigger?: React.ReactNode;
}

export function ShareContentModal({ contentItemId, workspaceId, trigger }: ShareContentModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ShareContentFormData>({
    resolver: zodResolver(shareContentSchema),
    defaultValues: {
      notes: "",
    },
  });

  const { data: workspaces = [] } = useQuery({
    queryKey: ["/api/workspaces"],
  });

  const shareContentMutation = useMutation({
    mutationFn: async (data: ShareContentFormData) => {
      return apiRequest(`/api/workspaces/${workspaceId}/share-content`, "POST", {
        contentItemId,
        toWorkspaceId: data.toWorkspaceId,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Content shared",
        description: "Content has been successfully shared to the selected workspace.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/shared-content`] });
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

  const handleSubmit = (data: ShareContentFormData) => {
    shareContentMutation.mutate(data);
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
          <DialogTitle>Share Content</DialogTitle>
          <DialogDescription>
            Share this content item to another workspace.
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes about why you're sharing this content..."
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
                disabled={shareContentMutation.isPending}
              >
                {shareContentMutation.isPending ? "Sharing..." : "Share Content"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}