import { JSDOM } from 'jsdom';

export interface ExtractedContent {
  title: string;
  content: string;
  htmlContent?: string; // New field for HTML content with images
  url?: string;
  source?: string;
  summary?: string;
  publishedAt?: Date;
  author?: string;
  excerpt?: string;
}

export class ContentExtractor {
  async extractFromUrl(url: string): Promise<ExtractedContent> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ResearchHub/1.0; +https://research-hub.example.com)',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status}`);
      }

      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Extract title
      let title = this.extractTitle(document);
      
      // Extract main content (both text and HTML)
      let content = this.extractContent(document);
      let htmlContent = this.extractHtmlContent(document, url);
      
      // Extract metadata
      const publishedAt = this.extractPublishedDate(document);
      const author = this.extractAuthor(document);
      const excerpt = this.extractExcerpt(document, content);

      return {
        title: title || 'Untitled',
        content: content || 'No content extracted',
        htmlContent: htmlContent || content, // Fallback to text if HTML extraction fails
        publishedAt,
        author,
        excerpt,
      };
    } catch (error) {
      console.error('Content extraction error:', error);
      throw new Error('Failed to extract content from URL');
    }
  }

  private extractTitle(document: Document): string {
    // Try multiple title sources in order of preference
    const selectors = [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'h1',
      'title',
      '.title',
      '.headline',
      '.post-title',
      '.article-title'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const title = selector.startsWith('meta') 
          ? element.getAttribute('content')
          : element.textContent;
        
        if (title && title.trim()) {
          return title.trim();
        }
      }
    }

    return '';
  }

  private extractContent(document: Document): string {
    // Try to find main content area
    const contentSelectors = [
      'article',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.post-body',
      '.article-body',
      'main',
      '[role="main"]'
    ];

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        // Remove script and style tags
        const scripts = element.querySelectorAll('script, style, nav, header, footer, aside');
        scripts.forEach(script => script.remove());
        
        const content = element.textContent || '';
        if (content.trim().length > 100) { // Minimum content length
          return this.cleanText(content);
        }
      }
    }

    // Fallback to body content
    const body = document.querySelector('body');
    if (body) {
      // Remove common non-content elements
      const elementsToRemove = body.querySelectorAll(
        'script, style, nav, header, footer, aside, .navigation, .sidebar, .menu, .ads, .advertisement'
      );
      elementsToRemove.forEach(el => el.remove());
      
      return this.cleanText(body.textContent || '');
    }

    return '';
  }

  private extractHtmlContent(document: Document, baseUrl?: string): string {
    // Try to find main content area
    const contentSelectors = [
      'article',
      '.content',
      '.post-content', 
      '.article-content',
      '.entry-content',
      '.post-body',
      '.article-body',
      'main',
      '[role="main"]'
    ];

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        // Clone the element to avoid modifying the original
        const clonedElement = element.cloneNode(true) as Element;
        
        // Remove unwanted elements but keep content structure
        const unwantedElements = clonedElement.querySelectorAll(
          'script, style, nav, header, footer, aside, .navigation, .sidebar, .menu, .ads, .advertisement, .comments'
        );
        unwantedElements.forEach(el => el.remove());
        
        // Process images to ensure they have absolute URLs
        const images = clonedElement.querySelectorAll('img');
        images.forEach(img => {
          const src = img.getAttribute('src');
          if (src && baseUrl) {
            // Convert relative URLs to absolute
            if (src.startsWith('/')) {
              const urlObj = new URL(baseUrl);
              img.setAttribute('src', `${urlObj.protocol}//${urlObj.host}${src}`);
            } else if (!src.startsWith('http')) {
              try {
                const absoluteUrl = new URL(src, baseUrl);
                img.setAttribute('src', absoluteUrl.href);
              } catch (e) {
                // Keep original src if URL parsing fails
              }
            }
          }
          
          // Add responsive styling
          img.setAttribute('style', 'max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;');
        });

        // Process links to ensure they open in new tabs
        const links = clonedElement.querySelectorAll('a');
        links.forEach(link => {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        });

        // Clean up the HTML content
        const htmlContent = clonedElement.innerHTML;
        if (htmlContent && htmlContent.trim().length > 100) {
          return this.sanitizeHtml(htmlContent);
        }
      }
    }

    // Fallback to body content
    const body = document.querySelector('body');
    if (body) {
      const clonedBody = body.cloneNode(true) as Element;
      
      // Remove common non-content elements
      const elementsToRemove = clonedBody.querySelectorAll(
        'script, style, nav, header, footer, aside, .navigation, .sidebar, .menu, .ads, .advertisement'
      );
      elementsToRemove.forEach(el => el.remove());
      
      return this.sanitizeHtml(clonedBody.innerHTML);
    }

    return '';
  }

  private sanitizeHtml(html: string): string {
    // Basic HTML sanitization - keep safe tags and remove dangerous ones
    const allowedTags = [
      'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'b', 'em', 'i', 'u', 'br', 'img', 'a',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ];
    
    // Remove script, style, and other dangerous elements
    const dangerousPattern = /<(script|style|iframe|object|embed|form|input|button)[^>]*>.*?<\/\1>|<(script|style|iframe|object|embed|form|input|button)[^>]*\/?>|on\w+\s*=\s*["|'][^"']*["|']/gi;
    
    return html.replace(dangerousPattern, '');
  }

  private extractPublishedDate(document: Document): Date | undefined {
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="date"]',
      'meta[name="publish-date"]',
      'time[datetime]',
      '.date',
      '.published',
      '.post-date'
    ];

    for (const selector of dateSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const dateStr = selector.startsWith('meta')
          ? element.getAttribute('content')
          : element.getAttribute('datetime') || element.textContent;
        
        if (dateStr) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
    }

    return undefined;
  }

  private extractAuthor(document: Document): string | undefined {
    const authorSelectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      '.author',
      '.byline',
      '.post-author',
      '[rel="author"]'
    ];

    for (const selector of authorSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const author = selector.startsWith('meta')
          ? element.getAttribute('content')
          : element.textContent;
        
        if (author && author.trim()) {
          return author.trim();
        }
      }
    }

    return undefined;
  }

  private extractExcerpt(document: Document, content: string): string | undefined {
    // Try meta description first
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      const desc = metaDesc.getAttribute('content');
      if (desc && desc.trim()) {
        return desc.trim();
      }
    }

    // Fallback to first paragraph of content
    if (content) {
      const sentences = content.split('.').slice(0, 3);
      const excerpt = sentences.join('.') + (sentences.length >= 3 ? '.' : '');
      return excerpt.length > 20 ? excerpt : undefined;
    }

    return undefined;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n\n') // Clean up line breaks
      .trim();
  }

  async validateRssFeed(url: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      if (!response.ok) return false;
      
      const content = await response.text();
      // Basic RSS/Atom validation
      return content.includes('<rss') || content.includes('<feed') || content.includes('<channel>');
    } catch {
      return false;
    }
  }

  async extractRssItems(url: string): Promise<ExtractedContent[]> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);
      
      const xml = await response.text();
      const dom = new JSDOM(xml, { contentType: 'text/xml' });
      const document = dom.window.document;
      
      const items: ExtractedContent[] = [];
      
      // Try RSS format first
      const rssItems = document.querySelectorAll('item');
      if (rssItems.length > 0) {
        rssItems.forEach(item => {
          const title = item.querySelector('title')?.textContent || '';
          const description = item.querySelector('description')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent;
          
          if (title && description) {
            items.push({
              title: title.trim(),
              content: this.cleanText(description),
              publishedAt: pubDate ? new Date(pubDate) : undefined,
            });
          }
        });
      } else {
        // Try Atom format
        const atomEntries = document.querySelectorAll('entry');
        atomEntries.forEach(entry => {
          const title = entry.querySelector('title')?.textContent || '';
          const content = entry.querySelector('content')?.textContent || 
                         entry.querySelector('summary')?.textContent || '';
          const published = entry.querySelector('published')?.textContent;
          
          if (title && content) {
            items.push({
              title: title.trim(),
              content: this.cleanText(content),
              publishedAt: published ? new Date(published) : undefined,
            });
          }
        });
      }
      
      return items;
    } catch (error) {
      console.error('RSS extraction error:', error);
      throw new Error('Failed to extract RSS content');
    }
  }
}

export const contentExtractor = new ContentExtractor();