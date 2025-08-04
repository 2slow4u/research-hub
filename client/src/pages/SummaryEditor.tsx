import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Layout/Sidebar";
import SummaryCanvas from "@/components/Summary/SummaryCanvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  Download, 
  Share2, 
  History, 
  FileText, 
  Edit3,
  ArrowLeft,
  MoreHorizontal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SummaryEditor() {
  const { id } = useParams();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['/api/summaries', id],
    onSuccess: (data) => {
      setTitle(data?.title || '');
    },
  });

  const updateSummaryMutation = useMutation({
    mutationFn: async (data: { title?: string; content?: string }) => {
      return await apiRequest('PATCH', `/api/summaries/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/summaries', id] });
      toast({
        title: "Summary updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update summary. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = async (content?: string) => {
    const updates: any = {};
    if (title !== summary?.title) updates.title = title;
    if (content) updates.content = content;
    
    if (Object.keys(updates).length > 0) {
      updateSummaryMutation.mutate(updates);
    }
  };

  const handleExport = (format: 'markdown' | 'pdf' | 'docx' | 'txt') => {
    // Implementation for exporting summaries
    toast({
      title: "Export started",
      description: `Exporting summary as ${format.toUpperCase()}...`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Summary Not Found
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400">
            The summary you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 max-w-2xl">
                {isEditing ? (
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => {
                      setIsEditing(false);
                      if (title !== summary.title) {
                        handleSave();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditing(false);
                        if (title !== summary.title) {
                          handleSave();
                        }
                      }
                    }}
                    className="text-xl font-bold"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <h1 
                      className="text-xl font-bold text-neutral-900 dark:text-neutral-100 cursor-pointer hover:text-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      {title}
                    </h1>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={summary.type === 'full' ? 'default' : 'secondary'}>
                  {summary.type === 'full' ? 'Full Summary' : 'Differential'}
                </Badge>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  Version {summary.version}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              
              <div className="flex items-center">
                <Button variant="outline" size="sm" onClick={() => handleExport('markdown')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <div className="relative group">
                  <Button variant="outline" size="sm" className="px-2 ml-1">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <div className="py-1 min-w-32">
                      <button 
                        className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        onClick={() => handleExport('pdf')}
                      >
                        Export as PDF
                      </button>
                      <button 
                        className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        onClick={() => handleExport('docx')}
                      >
                        Export as Word
                      </button>
                      <button 
                        className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        onClick={() => handleExport('txt')}
                      >
                        Export as Text
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => handleSave()}
                disabled={updateSummaryMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateSummaryMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center space-x-6 text-sm text-neutral-500 dark:text-neutral-400">
              <span>Created {new Date(summary.createdAt).toLocaleDateString()}</span>
              <span>Last updated {new Date(summary.updatedAt).toLocaleDateString()}</span>
              <span>{summary.contentItems?.length || 0} sources</span>
            </div>
            
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </header>

        {/* Editor */}
        <main className="flex-1 overflow-hidden">
          <SummaryCanvas 
            summary={summary}
            onContentChange={(content) => {
              // Auto-save after a delay
              setTimeout(() => handleSave(content), 1000);
            }}
          />
        </main>
      </div>
    </div>
  );
}
