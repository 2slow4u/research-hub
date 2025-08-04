import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Heading1, 
  Heading2,
  Link,
  Save,
  Eye,
  Edit3
} from "lucide-react";

interface SummaryCanvasProps {
  summary: any;
  onContentChange?: (content: string) => void;
}

export default function SummaryCanvas({ summary, onContentChange }: SummaryCanvasProps) {
  const [content, setContent] = useState(summary?.content || '');
  const [isPreview, setIsPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    setContent(summary?.content || '');
  }, [summary]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);
  };

  const insertMarkdown = (syntax: string, placeholder = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    let newContent = '';
    switch (syntax) {
      case 'bold':
        newContent = content.substring(0, start) + `**${textToInsert}**` + content.substring(end);
        break;
      case 'italic':
        newContent = content.substring(0, start) + `*${textToInsert}*` + content.substring(end);
        break;
      case 'h1':
        newContent = content.substring(0, start) + `# ${textToInsert}` + content.substring(end);
        break;
      case 'h2':
        newContent = content.substring(0, start) + `## ${textToInsert}` + content.substring(end);
        break;
      case 'quote':
        newContent = content.substring(0, start) + `> ${textToInsert}` + content.substring(end);
        break;
      case 'list':
        newContent = content.substring(0, start) + `- ${textToInsert}` + content.substring(end);
        break;
      case 'ordered-list':
        newContent = content.substring(0, start) + `1. ${textToInsert}` + content.substring(end);
        break;
      case 'link':
        newContent = content.substring(0, start) + `[${textToInsert || 'Link text'}](url)` + content.substring(end);
        break;
      default:
        return;
    }
    
    handleContentChange(newContent);
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + newContent.length - content.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering for preview
    return text
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-neutral-300 dark:border-neutral-600 pl-4 italic">$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/gim, '<br>');
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Toolbar */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('bold', 'Bold text')}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('italic', 'Italic text')}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-2" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('h1', 'Heading 1')}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('h2', 'Heading 2')}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-2" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('list', 'List item')}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('ordered-list', 'List item')}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('quote', 'Quote text')}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('link', 'Link text')}
              title="Link"
            >
              <Link className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {lastSaved && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
              className={isPreview ? 'bg-neutral-100 dark:bg-neutral-700' : ''}
            >
              {isPreview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="ml-2 text-sm">{isPreview ? 'Edit' : 'Preview'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        {isPreview ? (
          <div 
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        ) : (
          <Textarea
            id="content-editor"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing your summary... You can use Markdown formatting."
            className="min-h-full resize-none border-none focus:ring-0 text-base leading-relaxed"
            style={{ minHeight: 'calc(100vh - 200px)' }}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 p-3 bg-neutral-50 dark:bg-neutral-800">
        <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center space-x-4">
            <span>{content.length} characters</span>
            <span>{content.split(/\s+/).filter(word => word.length > 0).length} words</span>
            {summary?.contentItems?.length && (
              <Badge variant="outline" className="text-xs">
                {summary.contentItems.length} sources
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={summary?.type === 'full' ? 'default' : 'secondary'}>
              {summary?.type === 'full' ? 'Full Summary' : 'Differential'}
            </Badge>
            <span>Version {summary?.version || 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
