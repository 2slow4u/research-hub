import { storage } from "../storage";
import { openaiService } from "./openai";
import type { InsertSummary, Summary } from "@shared/schema";

export interface GenerateSummaryRequest {
  workspaceId: string;
  type: 'full' | 'differential';
  focus?: string;
  latestSummary?: Summary | null;
}

export class SummaryService {
  async generateSummary(request: GenerateSummaryRequest): Promise<Summary> {
    const { workspaceId, type, focus, latestSummary } = request;

    try {
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        throw new Error("Workspace not found");
      }

      let contentItems;
      if (type === 'differential' && latestSummary) {
        // Get content since last summary
        contentItems = await storage.getContentSinceDate(workspaceId, latestSummary.createdAt!);
      } else {
        // Get all content for full summary
        contentItems = await storage.getWorkspaceContent(workspaceId, 100);
      }

      if (contentItems.length === 0) {
        throw new Error("No content available for summary generation");
      }

      // Prepare content for AI processing
      const contentTexts = contentItems.map(item => `${item.title}\n${item.content}`);
      const contentItemIds = contentItems.map(item => item.id);

      // Generate summary using OpenAI
      const aiSummary = await openaiService.generateSummary({
        content: contentTexts,
        keywords: workspace.keywords,
        focus,
        type,
        previousSummary: latestSummary?.content,
      });

      // Create summary record
      const summaryData: InsertSummary = {
        workspaceId,
        title: aiSummary.title,
        content: aiSummary.content,
        type,
        focus,
        contentItems: contentItemIds,
      };

      const summary = await storage.createSummary(summaryData);
      return summary;
    } catch (error) {
      console.error("Error generating summary:", error);
      throw error;
    }
  }

  async exportSummary(summaryId: string, format: 'markdown' | 'pdf' | 'docx' | 'txt'): Promise<Buffer | string> {
    const summaries = await storage.getWorkspaceSummaries(''); // This needs workspace context
    // For now, we'll implement basic markdown export
    
    // In a real implementation, this would use libraries like:
    // - markdown-pdf for PDF generation
    // - docx for Word document generation
    // - Return appropriate buffer/string based on format
    
    return "# Summary Export\n\nExport functionality would be implemented here.";
  }

  async updateSummaryContent(summaryId: string, content: string, userId: string): Promise<Summary> {
    try {
      // Increment version for content updates
      const currentSummary = await storage.getWorkspaceSummaries(''); // This needs improvement
      const newVersion = 1; // Would calculate based on current version
      
      const updatedSummary = await storage.updateSummary(summaryId, {
        content,
        version: newVersion,
      });

      // Create activity for the update
      const workspace = await storage.getWorkspace(updatedSummary.workspaceId);
      if (workspace) {
        await storage.createActivity({
          userId,
          workspaceId: workspace.id,
          type: 'summary_updated',
          description: `Updated summary: ${updatedSummary.title}`,
          metadata: { summaryId, version: newVersion },
        });
      }

      return updatedSummary;
    } catch (error) {
      console.error("Error updating summary:", error);
      throw error;
    }
  }

  async duplicateSummary(summaryId: string, userId: string): Promise<Summary> {
    try {
      // Implementation for duplicating summaries with version control
      const originalSummary = await storage.getWorkspaceSummaries(''); // This needs improvement
      
      // Create new summary based on original
      const duplicateData: InsertSummary = {
        workspaceId: '', // Would get from original
        title: `${''} (Copy)`, // Would use original title
        content: '', // Would use original content
        type: 'full',
        contentItems: [],
      };

      const duplicate = await storage.createSummary(duplicateData);
      return duplicate;
    } catch (error) {
      console.error("Error duplicating summary:", error);
      throw error;
    }
  }
}
