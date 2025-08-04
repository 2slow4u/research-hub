import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspace?: any;
  latestSummary?: any;
}

export default function SummaryModal({ 
  open, 
  onOpenChange, 
  workspaceId, 
  workspace,
  latestSummary 
}: SummaryModalProps) {
  const { toast } = useToast();
  const [summaryType, setSummaryType] = useState<'full' | 'differential'>('full');
  const [focus, setFocus] = useState('');

  const generateSummaryMutation = useMutation({
    mutationFn: async (data: { type: 'full' | 'differential'; focus?: string }) => {
      return await apiRequest('POST', `/api/workspaces/${workspaceId}/summaries`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId, 'summaries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Summary generated",
        description: "Your AI-powered summary has been created successfully.",
      });
      onOpenChange(false);
      setFocus('');
      setSummaryType('full');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    generateSummaryMutation.mutate({
      type: summaryType,
      focus: focus.trim() || undefined,
    });
  };

  const hasPreviousSummary = latestSummary != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Generate Summary</DialogTitle>
          <DialogDescription>
            Create an AI-powered summary of your research content for blog post preparation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-96 space-y-6">
          {hasPreviousSummary && (
            <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                <strong>Previous Summary Found</strong><br />
                A summary from{' '}
                <span className="font-medium">
                  {formatDistanceToNow(new Date(latestSummary.createdAt), { addSuffix: true })}
                </span>{' '}
                exists. Choose how to proceed:
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Summary Type
            </Label>
            <RadioGroup 
              value={summaryType} 
              onValueChange={(value: 'full' | 'differential') => setSummaryType(value)}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer">
                <RadioGroupItem value="full" id="full" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="full" className="text-sm font-medium text-neutral-900 dark:text-neutral-100 cursor-pointer">
                    Full Summary
                  </Label>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Generate a comprehensive summary of all content in this workspace
                    {workspace?.contentCount && ` (${workspace.contentCount} items)`}
                  </p>
                </div>
              </div>

              {hasPreviousSummary && (
                <div className="flex items-start space-x-3 p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer">
                  <RadioGroupItem value="differential" id="differential" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="differential" className="text-sm font-medium text-neutral-900 dark:text-neutral-100 cursor-pointer">
                      Differential Summary
                    </Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      Summarize only new content since the last summary (changes and updates)
                    </p>
                  </div>
                </div>
              )}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="focus" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Summary Focus (Optional)
            </Label>
            <Textarea
              id="focus"
              placeholder="Specify particular aspects to focus on, e.g., 'recent breakthroughs', 'regulatory changes', 'market trends'..."
              rows={3}
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="resize-none"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Help the AI focus on specific aspects of your research content
            </p>
          </div>
        </div>
        
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleGenerate}
              disabled={generateSummaryMutation.isPending}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>
                {generateSummaryMutation.isPending ? 'Generating...' : 'Generate Summary'}
              </span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={generateSummaryMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
