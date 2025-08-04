import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Highlighter, 
  MessageCircle, 
  Trash2,
  ExternalLink,
  Calendar,
  Save,
  X,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Annotation, InsertAnnotation, ContentItem } from "@shared/schema";

interface AnnotationTooltip {
  x: number;
  y: number;
  selectedText: string;
  range: Range;
}

export default function ArticleReader() {
  const { id } = useParams();
  const { toast } = useToast();
  const [showTooltip, setShowTooltip] = useState<AnnotationTooltip | null>(null);
  const [annotationForm, setAnnotationForm] = useState<{
    type: "highlight" | "comment";
    content: string;
    color: string;
  } | null>(null);
  const [activeAnnotations, setActiveAnnotations] = useState<Annotation[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: article, isLoading: articleLoading } = useQuery<ContentItem>({
    queryKey: ['/api/content', id],
  });

  const { data: annotations, isLoading: annotationsLoading } = useQuery<Annotation[]>({
    queryKey: ['/api/content', id, 'annotations'],
  });

  const createAnnotationMutation = useMutation({
    mutationFn: async (annotation: InsertAnnotation) => {
      return await apiRequest('POST', `/api/content/${id}/annotations`, annotation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content', id, 'annotations'] });
      setAnnotationForm(null);
      setShowTooltip(null);
      toast({
        title: "Annotation saved",
        description: "Your annotation has been added to the article.",
      });
    },
    onError: () => {
      toast({
        title: "Error saving annotation",
        description: "Could not save your annotation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAnnotationMutation = useMutation({
    mutationFn: async (annotationId: string) => {
      return await apiRequest('DELETE', `/api/annotations/${annotationId}`);
    },
    onSuccess: (_, annotationId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/content', id, 'annotations'] });
      // Also update local state immediately for better UX
      setActiveAnnotations(prev => prev.filter(ann => ann.id !== annotationId));
      toast({
        title: "Annotation deleted",
        description: "The annotation has been removed.",
      });
    },
  });

  useEffect(() => {
    if (annotations) {
      setActiveAnnotations(annotations);
    }
  }, [annotations]);

  useEffect(() => {
    const handleSelection = () => {
      // Small delay to ensure selection is complete
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          // Only clear tooltip if no annotation form is open
          if (!annotationForm) {
            setShowTooltip(null);
          }
          return;
        }

        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();

        if (selectedText.length > 0 && contentRef.current?.contains(range.commonAncestorContainer)) {
          const rect = range.getBoundingClientRect();
          // If annotation form is open, don't override the tooltip
          if (!annotationForm) {
            setShowTooltip({
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
              selectedText,
              range,
            });
          }
        }
      }, 100);
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      
      // Don't close anything when clicking on annotation UI elements
      if (target?.closest('.selection-tooltip') || target?.closest('.annotation-form')) {
        return;
      }
      
      // Only close tooltip if no annotation form is open
      if (!annotationForm && showTooltip) {
        setShowTooltip(null);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [annotationForm]);

  const handleCreateAnnotation = (type: "highlight" | "comment") => {
    if (!showTooltip) return;

    const position = {
      startOffset: showTooltip.range.startOffset,
      endOffset: showTooltip.range.endOffset,
      startContainer: showTooltip.range.startContainer.nodeValue || '',
      endContainer: showTooltip.range.endContainer.nodeValue || '',
    };

    if (type === "highlight") {
      const annotation: InsertAnnotation = {
        contentItemId: id!,
        userId: '', // This will be set by the backend from auth
        type,
        text: showTooltip.selectedText,
        content: null,
        position,
        color: "#fbbf24",
      };
      createAnnotationMutation.mutate(annotation);
    } else {
      setAnnotationForm({
        type,
        content: "",
        color: "#10b981",
      });
    }
  };

  const handleSaveAnnotation = () => {
    if (!showTooltip || !annotationForm) return;

    const position = {
      startOffset: showTooltip.range.startOffset,
      endOffset: showTooltip.range.endOffset,
      startContainer: showTooltip.range.startContainer.nodeValue || '',
      endContainer: showTooltip.range.endContainer.nodeValue || '',
    };

    const annotation: InsertAnnotation = {
      contentItemId: id!,
      userId: '', // This will be set by the backend from auth
      type: annotationForm.type,
      text: showTooltip.selectedText,
      content: annotationForm.content,
      position,
      color: annotationForm.color,
    };

    createAnnotationMutation.mutate(annotation);
  };

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case "highlight": return <Highlighter className="h-4 w-4" />;
      case "comment": return <MessageCircle className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getAnnotationColor = (type: string) => {
    switch (type) {
      case "highlight": return "bg-yellow-200 dark:bg-yellow-800";
      case "comment": return "bg-green-200 dark:bg-green-800";
      default: return "bg-gray-200 dark:bg-gray-800";
    }
  };

  if (articleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Article Not Found
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400">
            The article you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
                <Calendar className="h-4 w-4" />
                <span>{article.createdAt ? new Date(article.createdAt).toLocaleDateString() : 'No date'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Force refresh content with HTML re-extraction
                  apiRequest(`/api/content/${id}/refresh`, 'POST').then(() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/content', id] });
                    queryClient.invalidateQueries({ queryKey: ['/api/content', id, 'annotations'] });
                    toast({
                      title: "Content refreshed",
                      description: "Article content has been reloaded with latest formatting",
                    });
                  }).catch((error) => {
                    toast({
                      title: "Refresh failed",
                      description: error.message || "Failed to refresh content",
                      variant: "destructive",
                    });
                  });
                }}
                title="Refresh article and re-extract content"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {article.url && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Original
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Article Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl leading-tight">
                  {article.title}
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-400">
                  <Badge variant="outline">
                    Score: {article.relevanceScore}%
                  </Badge>
                  {article.publishedAt && (
                    <span>Published {new Date(article.publishedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  ref={contentRef}
                  className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed"
                  style={{ 
                    userSelect: 'text', 
                    wordBreak: 'break-word',
                    lineHeight: '1.7'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: (article as any).htmlContent || article.content.replace(/\n/g, '<br/>') 
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Annotations Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Annotations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {annotationsLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : activeAnnotations.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                    No annotations yet. Select text to add your first annotation.
                  </p>
                ) : (
                  activeAnnotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className={`p-3 rounded-lg border ${getAnnotationColor(annotation.type)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getAnnotationIcon(annotation.type)}
                          <span className="text-xs font-medium capitalize">
                            {annotation.type}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAnnotationMutation.mutate(annotation.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <blockquote className="text-xs italic border-l-2 border-neutral-400 pl-2 mb-2">
                        "{annotation.text}"
                      </blockquote>
                      {annotation.content && (
                        <p className="text-sm">{annotation.content}</p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Selection Tooltip */}
      {showTooltip && !annotationForm && (
        <div 
          className="selection-tooltip fixed z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-2"
          style={{ 
            left: showTooltip.x - 100, 
            top: showTooltip.y - 60,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCreateAnnotation("highlight")}
              title="Highlight"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCreateAnnotation("comment")}
              title="Add Comment"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Annotation Form */}
      {annotationForm && showTooltip && (
        <div 
          className="annotation-form fixed z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-4 w-80"
          style={{ 
            left: showTooltip.x - 160, 
            top: showTooltip.y + 20
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getAnnotationIcon(annotationForm.type)}
              <span className="text-sm font-medium capitalize">
                Add {annotationForm.type}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setAnnotationForm(null);
                setShowTooltip(null);
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <blockquote className="text-xs italic border-l-2 border-neutral-400 pl-2 mb-3 text-neutral-600 dark:text-neutral-400">
            "{showTooltip.selectedText}"
          </blockquote>
          
          <Textarea
            placeholder={`Enter your ${annotationForm.type}...`}
            value={annotationForm.content}
            onChange={(e) => {
              e.stopPropagation();
              setAnnotationForm({
                ...annotationForm,
                content: e.target.value
              });
            }}
            onKeyDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            className="mb-3 min-h-[80px]"
            autoFocus
          />
          
          <div className="flex items-center justify-end space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setAnnotationForm(null);
                setShowTooltip(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveAnnotation();
              }}
              disabled={!annotationForm.content.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}