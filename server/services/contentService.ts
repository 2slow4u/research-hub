import { storage } from "../storage";
import { openaiService } from "./openai";
import type { InsertContentItem } from "@shared/schema";

export class ContentService {
  private monitoringJobs = new Map<string, NodeJS.Timeout>();

  async startMonitoring(workspaceId: string, keywords: string[]) {
    // Clear existing monitoring for this workspace
    this.stopMonitoring(workspaceId);

    // Start periodic content collection
    const job = setInterval(async () => {
      try {
        await this.collectContent(workspaceId, keywords);
      } catch (error) {
        console.error(`Error monitoring workspace ${workspaceId}:`, error);
      }
    }, 60 * 60 * 1000); // Every hour

    this.monitoringJobs.set(workspaceId, job);

    // Do initial collection
    setTimeout(() => this.collectContent(workspaceId, keywords), 1000);
  }

  stopMonitoring(workspaceId: string) {
    const job = this.monitoringJobs.get(workspaceId);
    if (job) {
      clearInterval(job);
      this.monitoringJobs.delete(workspaceId);
    }
  }

  async collectContent(workspaceId: string, keywords: string[]) {
    try {
      const sources = await storage.getActiveWhitelistedSources();
      const contentItems: InsertContentItem[] = [];

      // Mock content collection - in real implementation, this would fetch from APIs, RSS feeds, etc.
      // For now, we'll create sample content based on keywords
      const mockArticles = await this.generateMockContent(keywords);
      
      for (const article of mockArticles) {
        const workspace = await storage.getWorkspace(workspaceId);
        const relevanceScore = await this.calculateRelevanceScore(
          article.content, 
          article.title, 
          keywords, 
          workspace?.purpose || undefined
        );
        
        if (relevanceScore >= 30) { // Lower threshold to allow more content through
          contentItems.push({
            workspaceId,
            sourceId: sources[0]?.id, // Use first available source
            title: article.title,
            content: article.content,
            url: article.url,
            publishedAt: new Date(),

          });
        }
      }

      if (contentItems.length > 0) {
        await storage.bulkAddContentItems(contentItems);
        
        // Create activity
        const workspace = await storage.getWorkspace(workspaceId);
        if (workspace) {
          await storage.createActivity({
            userId: workspace.userId,
            workspaceId,
            type: 'content_added',
            description: `${contentItems.length} new articles added to ${workspace.name}`,
            metadata: { count: contentItems.length },
          });
        }
      }
    } catch (error) {
      console.error("Error collecting content:", error);
    }
  }

  private async generateMockContent(keywords: string[]) {
    // In a real implementation, this would fetch from actual sources
    // For demo purposes, we generate realistic mock content
    const articles: Array<{ title: string; content: string; url: string }> = [];
    
    const templates = [
      {
        title: `Recent Advances in ${keywords[0] || 'Research'}`,
        content: `This article discusses the latest developments in ${keywords.join(', ')}. Researchers have made significant progress in understanding the implications and applications of these concepts. The study reveals new insights that could impact future research directions.`,
        url: `https://example.com/research/${keywords[0]?.toLowerCase().replace(/\s+/g, '-')}`
      },
      {
        title: `${keywords[1] || 'Technology'} Trends and Implications`,
        content: `An analysis of current trends in ${keywords.join(' and ')} shows promising developments. Industry experts believe these advancements will shape the future of the field. Key findings include improved methodologies and novel applications.`,
        url: `https://example.com/trends/${keywords[1]?.toLowerCase().replace(/\s+/g, '-')}`
      }
    ];

    return templates.slice(0, Math.min(2, keywords.length));
  }

  private async calculateRelevanceScore(
    content: string, 
    title: string, 
    keywords: string[], 
    purpose?: string
  ): Promise<number> {
    const fullText = `${title} ${content}`.toLowerCase();
    let score = 0;
    
    // Keyword matching (0-60 points)
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      const titleMatches = (title.toLowerCase().match(new RegExp(keywordLower, 'g')) || []).length;
      const contentMatches = (content.toLowerCase().match(new RegExp(keywordLower, 'g')) || []).length;
      
      // Title matches are worth more
      score += titleMatches * 8;
      score += contentMatches * 3;
    }
    
    // Purpose alignment (0-30 points)
    if (purpose) {
      const purposeWords = purpose.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      for (const word of purposeWords) {
        const matches = (fullText.match(new RegExp(word, 'g')) || []).length;
        score += matches * 2;
      }
    }
    
    // Content quality factors (0-10 points)
    const contentLength = content.length;
    if (contentLength > 500) score += 3;
    if (contentLength > 1000) score += 2;
    if (title.length > 20) score += 2;
    if (title.toLowerCase().includes('research') || title.toLowerCase().includes('study')) score += 3;
    
    return Math.min(100, Math.max(0, score));
  }

  // Function to recalculate relevance scores for all content, including annotations
  async recalculateRelevanceScores(workspaceId: string): Promise<void> {
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace) return;

    const content = await storage.getWorkspaceContent(workspaceId);
    
    for (const item of content) {
      // Get annotations for this content
      const annotations = await storage.getContentAnnotations(item.id);
      
      // Calculate base score
      let score = await this.calculateRelevanceScore(
        item.content, 
        item.title, 
        workspace.keywords, 
        workspace.purpose || undefined
      );
      
      // Add annotation bonus (up to 20 points)
      const annotationCount = annotations.length;
      const annotationBonus = Math.min(20, annotationCount * 5);
      score = Math.min(100, score + annotationBonus);
      
      // Update the content item with new score
      await storage.updateContentRelevanceScore(item.id, score);
    }
  }

  async searchContent(query: string, sources?: string[]) {
    // Implementation for searching content from external sources
    // This would integrate with APIs like News API, academic databases, etc.
    try {
      const results = await this.fetchFromExternalSources(query, sources);
      return results;
    } catch (error) {
      console.error("Error searching content:", error);
      return [];
    }
  }

  private async fetchFromExternalSources(query: string, sources?: string[]) {
    // Mock implementation - would use real APIs in production
    return [
      {
        title: `Research on ${query}`,
        content: `Recent findings related to ${query} show significant progress...`,
        url: `https://example.com/research/${query.replace(/\s+/g, '-')}`,
        source: 'Academic Journal',
        publishedAt: new Date(),
      }
    ];
  }
}
