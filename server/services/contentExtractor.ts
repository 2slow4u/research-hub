interface ExtractedContent {
  title: string;
  content: string;
  summary?: string;
  source: string;
  url: string;
  publishedDate?: string;
  author?: string;
  metadata?: any;
}

export class ContentExtractor {
  
  async extractFromUrl(url: string): Promise<ExtractedContent> {
    try {
      // For now, we'll do a simple fetch and basic content extraction
      // In a production app, you might want to use a more sophisticated service
      const response = await fetch(url);
      const html = await response.text();
      
      // Basic HTML parsing to extract title and content
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
      
      // Extract meta description as a basic summary
      const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']*)["\'][^>]*>/i);
      const summary = descMatch ? descMatch[1].trim() : '';
      
      // Try to extract main content (very basic approach)
      // Remove script and style tags
      let content = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      
      // Extract text from body
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        content = bodyMatch[1];
      }
      
      // Remove HTML tags and clean up
      content = content.replace(/<[^>]*>/g, ' ');
      content = content.replace(/\s+/g, ' ').trim();
      
      // Limit content length
      if (content.length > 5000) {
        content = content.substring(0, 5000) + '...';
      }
      
      return {
        title,
        content,
        summary,
        source: this.extractDomain(url),
        url,
        metadata: {
          extractedAt: new Date().toISOString(),
          contentLength: content.length
        }
      };
      
    } catch (error) {
      console.error('Content extraction error:', error);
      throw new Error(`Failed to extract content from URL: ${error.message}`);
    }
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'unknown';
    }
  }
}