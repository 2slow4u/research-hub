import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertWorkspaceSchema, insertSummarySchema, insertAnnotationSchema } from "@shared/schema";
import { ContentService } from "./services/contentService";
import { SummaryService } from "./services/summaryService";
import { telegramBot } from "./services/telegramBot";
import { contentExtractor } from "./services/contentExtractor";

const contentService = new ContentService();
const summaryService = new SummaryService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      console.log(`Dashboard stats for user ${userId}:`, stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Workspace routes
  app.get('/api/workspaces', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaces = await storage.getUserWorkspaces(userId);
      
      // Get content counts for each workspace
      const workspacesWithStats = await Promise.all(
        workspaces.map(async (workspace) => {
          const contentCount = await storage.getWorkspaceContentCount(workspace.id);
          const summaryCount = await storage.getWorkspaceSummaryCount(workspace.id);
          return {
            ...workspace,
            _count: {
              contentItems: contentCount,
              summaries: summaryCount,
            },
          };
        })
      );
      
      res.json(workspacesWithStats);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      res.status(500).json({ message: "Failed to fetch workspaces" });
    }
  });

  app.get('/api/workspaces/archived', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaces = await storage.getArchivedWorkspaces(userId);
      
      // Get content counts for each workspace
      const workspacesWithStats = await Promise.all(
        workspaces.map(async (workspace) => {
          const contentCount = await storage.getWorkspaceContentCount(workspace.id);
          const summaryCount = await storage.getWorkspaceSummaryCount(workspace.id);
          return {
            ...workspace,
            _count: {
              contentItems: contentCount,
              summaries: summaryCount,
            },
          };
        })
      );
      
      res.json(workspacesWithStats);
    } catch (error) {
      console.error("Error fetching archived workspaces:", error);
      res.status(500).json({ message: "Failed to fetch archived workspaces" });
    }
  });

  app.get('/api/workspaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const workspace = await storage.getWorkspace(id);
      if (!workspace || workspace.userId !== userId) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      res.json(workspace);
    } catch (error) {
      console.error("Error fetching workspace:", error);
      res.status(500).json({ message: "Failed to fetch workspace" });
    }
  });

  app.post('/api/workspaces', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertWorkspaceSchema.parse(req.body);
      
      const workspace = await storage.createWorkspace({
        ...validatedData,
        userId,
      });

      // Create activity
      await storage.createActivity({
        userId,
        workspaceId: workspace.id,
        type: 'workspace_created',
        description: `Created workspace: ${workspace.name}`,
      });

      // Start monitoring content for this workspace
      contentService.startMonitoring(workspace.id, validatedData.keywords);
      
      res.status(201).json(workspace);
    } catch (error) {
      console.error("Error creating workspace:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create workspace" });
    }
  });

  app.patch('/api/workspaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const workspace = await storage.getWorkspace(id);
      if (!workspace || workspace.userId !== userId) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      const updates = req.body;
      const updatedWorkspace = await storage.updateWorkspace(id, updates);
      
      res.json(updatedWorkspace);
    } catch (error) {
      console.error("Error updating workspace:", error);
      res.status(500).json({ message: "Failed to update workspace" });
    }
  });

  app.delete('/api/workspaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const workspace = await storage.getWorkspace(id);
      if (!workspace || workspace.userId !== userId) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      await storage.deleteWorkspace(id);
      
      // Create activity
      await storage.createActivity({
        userId,
        type: 'workspace_deleted',
        description: `Deleted workspace: ${workspace.name}`,
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workspace:", error);
      res.status(500).json({ message: "Failed to delete workspace" });
    }
  });

  // Archive/Restore workspace routes
  app.post('/api/workspaces/:id/archive', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const workspace = await storage.getWorkspace(id);
      if (!workspace || workspace.userId !== userId) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      if (workspace.status === 'archived') {
        return res.status(400).json({ message: "Workspace is already archived" });
      }
      
      const archivedWorkspace = await storage.archiveWorkspace(id);
      
      // Stop monitoring for archived workspace
      contentService.stopMonitoring(id);
      
      // Create activity
      await storage.createActivity({
        userId,
        workspaceId: id,
        type: 'workspace_archived',
        description: `Archived workspace: ${workspace.name}`,
      });
      
      res.json(archivedWorkspace);
    } catch (error) {
      console.error("Error archiving workspace:", error);
      res.status(500).json({ message: "Failed to archive workspace" });
    }
  });

  app.post('/api/workspaces/:id/restore', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const workspace = await storage.getWorkspace(id);
      if (!workspace || workspace.userId !== userId) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      if (workspace.status !== 'archived') {
        return res.status(400).json({ message: "Workspace is not archived" });
      }
      
      const restoredWorkspace = await storage.restoreWorkspace(id);
      
      // Resume monitoring for restored workspace
      contentService.startMonitoring(id, restoredWorkspace.keywords);
      
      // Create activity
      await storage.createActivity({
        userId,
        workspaceId: id,
        type: 'workspace_restored',
        description: `Restored workspace: ${workspace.name}`,
      });
      
      res.json(restoredWorkspace);
    } catch (error) {
      console.error("Error restoring workspace:", error);
      res.status(500).json({ message: "Failed to restore workspace" });
    }
  });

  // Content routes
  app.get('/api/workspaces/:id/content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const workspace = await storage.getWorkspace(id);
      if (!workspace || workspace.userId !== userId) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      const content = await storage.getWorkspaceContent(id, limit);
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Get single content item
  app.get('/api/content/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const content = await storage.getContentItem(id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Check if user has access to this content through workspace ownership
      const workspace = await storage.getWorkspace(content.workspaceId);
      if (!workspace || workspace.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Refresh content item with re-extraction
  app.post('/api/content/:id/refresh', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const content = await storage.getContentItem(id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Check if user has access to this content through workspace ownership
      const workspace = await storage.getWorkspace(content.workspaceId);
      if (!workspace || workspace.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Re-extract content if URL is available
      if (content.url) {
        const { ContentExtractor } = await import('./services/contentExtractor');
        const extractor = new ContentExtractor();
        
        try {
          const extractedData = await extractor.extractFromUrl(content.url);
          
          // Update content with newly extracted data
          await storage.updateContentItem(id, {
            content: extractedData.content,
            htmlContent: extractedData.htmlContent,
            title: extractedData.title || content.title,
            publishedAt: extractedData.publishedAt || content.publishedAt,
          });
          
          res.json({ message: "Content refreshed successfully" });
        } catch (extractionError) {
          console.error("Content re-extraction failed:", extractionError);
          res.status(400).json({ message: "Failed to re-extract content from URL" });
        }
      } else {
        res.status(400).json({ message: "No URL available for content re-extraction" });
      }
    } catch (error) {
      console.error("Error refreshing content:", error);
      res.status(500).json({ message: "Failed to refresh content" });
    }
  });

  // Recalculate relevance scores for workspace content
  app.post('/api/workspaces/:id/recalculate-scores', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const workspace = await storage.getWorkspace(id);
      if (!workspace || workspace.userId !== userId) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      const contentService = new ContentService();
      await contentService.recalculateRelevanceScores(id);
      
      res.json({ message: "Relevance scores recalculated successfully" });
    } catch (error) {
      console.error("Error recalculating scores:", error);
      res.status(500).json({ message: "Failed to recalculate scores" });
    }
  });

  // Content ingestion routes
  app.post('/api/workspaces/:id/content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { type, url, title, content } = req.body;
      
      const workspace = await storage.getWorkspace(id);
      if (!workspace || workspace.userId !== userId) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      let extractedContent;
      
      if (type === 'url') {
        if (!url) {
          return res.status(400).json({ message: "URL is required" });
        }
        
        // Extract content from URL
        extractedContent = await contentExtractor.extractFromUrl(url);
        
        // Use custom title and content if provided
        const finalTitle = title || extractedContent.title;
        const finalContent = content || extractedContent.content;
        
        // Create content item
        const contentItem = await storage.createContentItem({
          workspaceId: id,
          title: finalTitle,
          content: finalContent,
          url: url,
          publishedAt: extractedContent.publishedAt || new Date(),
          relevanceScore: 85 // Default relevance for manually added content
        });

        // Create activity
        await storage.createActivity({
          userId,
          workspaceId: id,
          type: 'content_added',
          description: `Added content: ${finalTitle}`,
          metadata: { contentItemId: contentItem.id, source: 'manual_url' },
        });

        res.status(201).json(contentItem);
      } else {
        res.status(400).json({ message: "Invalid content type" });
      }
    } catch (error) {
      console.error("Error adding content:", error);
      res.status(500).json({ message: "Failed to add content" });
    }
  });

  // Delete content item
  app.delete('/api/content/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Get content item first to get workspace ID for activity
      const content = await storage.getContentItem(id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Verify workspace ownership
      const workspace = await storage.getWorkspace(content.workspaceId);
      if (!workspace || workspace.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete the content item
      await storage.deleteContentItem(id, userId);
      
      // Create activity with proper workspace ID
      await storage.createActivity({
        userId,
        workspaceId: content.workspaceId,
        type: 'content_deleted',
        description: `Deleted content: ${content.title}`,
      });
      
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting content:", error);
      res.status(500).json({ message: "Failed to delete content", error: error.message });
    }
  });

  // Source management routes
  app.post('/api/workspaces/:id/sources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { type, url, name, selectors } = req.body;
      
      const workspace = await storage.getWorkspace(id);
      if (!workspace || workspace.userId !== userId) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      if (!url || !name) {
        return res.status(400).json({ message: "URL and name are required" });
      }

      // Validate RSS feed if it's RSS type
      if (type === 'rss') {
        const isValid = await contentExtractor.validateRssFeed(url);
        if (!isValid) {
          return res.status(400).json({ message: "Invalid RSS feed URL" });
        }
      }

      // Create source
      const source = await storage.createSource({
        name,
        url,
        type,
        isWhitelisted: true,
        isActive: true,
        reputation: 100,
      });

      // Create activity
      await storage.createActivity({
        userId,
        workspaceId: id,
        type: 'source_added',
        description: `Added ${type} source: ${name}`,
        metadata: { sourceId: source.id, type, url },
      });

      res.status(201).json(source);
    } catch (error) {
      console.error("Error adding source:", error);
      res.status(500).json({ message: "Failed to add source" });
    }
  });

  app.get('/api/workspaces/:id/sources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const workspace = await storage.getWorkspace(id);
      if (!workspace || workspace.userId !== userId) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      const sources = await storage.getWorkspaceSources(id);
      res.json(sources);
    } catch (error) {
      console.error("Error fetching sources:", error);
      res.status(500).json({ message: "Failed to fetch sources" });
    }
  });

  // Summary routes
  app.get('/api/workspaces/:id/summaries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const workspace = await storage.getWorkspace(id);
      if (!workspace || workspace.userId !== userId) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      const summaries = await storage.getWorkspaceSummaries(id);
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching summaries:", error);
      res.status(500).json({ message: "Failed to fetch summaries" });
    }
  });

  app.post('/api/workspaces/:id/summaries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { type, focus } = req.body;
      
      const workspace = await storage.getWorkspace(id);
      if (!workspace || workspace.userId !== userId) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      // Check for existing summaries
      const latestSummary = await storage.getLatestSummary(id);
      
      // Generate summary based on type
      const summary = await summaryService.generateSummary({
        workspaceId: id,
        type: type || 'full',
        focus,
        latestSummary,
        userId,
      });

      // Create activity
      await storage.createActivity({
        userId,
        workspaceId: id,
        type: 'summary_generated',
        description: `Generated ${type} summary for ${workspace.name}`,
        metadata: { summaryId: summary.id, type },
      });
      
      res.status(201).json(summary);
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  app.patch('/api/summaries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const updates = req.body;
      
      // Verify ownership through workspace
      const summary = await storage.getWorkspaceSummaries(''); // This needs to be improved
      // For now, we'll trust the middleware
      
      const updatedSummary = await storage.updateSummary(id, updates);
      res.json(updatedSummary);
    } catch (error) {
      console.error("Error updating summary:", error);
      res.status(500).json({ message: "Failed to update summary" });
    }
  });

  app.delete('/api/summaries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      await storage.deleteSummary(id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting summary:", error);
      res.status(500).json({ message: "Failed to delete summary" });
    }
  });

  // Activity routes
  app.get('/api/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const activities = await storage.getUserActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Source management routes
  app.get('/api/sources', isAuthenticated, async (req: any, res) => {
    try {
      const sources = await storage.getAllSources();
      res.json(sources);
    } catch (error) {
      console.error("Error fetching sources:", error);
      res.status(500).json({ message: "Failed to fetch sources" });
    }
  });

  // Content move/copy routes
  app.post('/api/content/:contentId/move', isAuthenticated, async (req: any, res) => {
    try {
      const { contentId } = req.params;
      const { targetWorkspaceId, notes } = req.body;
      const userId = req.user.claims.sub;

      // Get the content item and verify ownership
      const content = await storage.getContentItem(contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const sourceWorkspace = await storage.getWorkspace(content.workspaceId);
      const targetWorkspace = await storage.getWorkspace(targetWorkspaceId);
      
      if (!sourceWorkspace || sourceWorkspace.userId !== userId || 
          !targetWorkspace || targetWorkspace.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Move content by updating workspace ID
      const movedContent = await storage.moveContentToWorkspace(contentId, targetWorkspaceId);

      // Create activity logs
      await storage.createActivity({
        userId,
        workspaceId: content.workspaceId,
        type: 'content_moved_out',
        description: `Moved content "${content.title}" to ${targetWorkspace.name}`,
        metadata: { targetWorkspaceId, notes }
      });

      await storage.createActivity({
        userId,
        workspaceId: targetWorkspaceId,
        type: 'content_moved_in',
        description: `Received content "${content.title}" from ${sourceWorkspace.name}`,
        metadata: { sourceWorkspaceId: content.workspaceId, notes }
      });

      res.json({ message: "Content moved successfully", content: movedContent });
    } catch (error: any) {
      console.error("Error moving content:", error);
      res.status(500).json({ message: "Failed to move content", error: error.message });
    }
  });

  app.post('/api/content/:contentId/copy', isAuthenticated, async (req: any, res) => {
    try {
      const { contentId } = req.params;
      const { targetWorkspaceId, notes } = req.body;
      const userId = req.user.claims.sub;

      // Get the content item and verify ownership
      const content = await storage.getContentItem(contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const sourceWorkspace = await storage.getWorkspace(content.workspaceId);
      const targetWorkspace = await storage.getWorkspace(targetWorkspaceId);
      
      if (!sourceWorkspace || sourceWorkspace.userId !== userId || 
          !targetWorkspace || targetWorkspace.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Copy content to target workspace
      const copiedContent = await storage.copyContentToWorkspace(contentId, targetWorkspaceId);

      // Create activity logs
      await storage.createActivity({
        userId,
        workspaceId: content.workspaceId,
        type: 'content_copied_from',
        description: `Copied content "${content.title}" to ${targetWorkspace.name}`,
        metadata: { targetWorkspaceId, notes }
      });

      await storage.createActivity({
        userId,
        workspaceId: targetWorkspaceId,
        type: 'content_copied_to',
        description: `Received copy of "${content.title}" from ${sourceWorkspace.name}`,
        metadata: { sourceWorkspaceId: content.workspaceId, notes }
      });

      res.json({ message: "Content copied successfully", content: copiedContent });
    } catch (error: any) {
      console.error("Error copying content:", error);
      res.status(500).json({ message: "Failed to copy content", error: error.message });
    }
  });





  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { id } = req.params;
      const { role } = req.body;
      
      const updatedUser = await storage.updateUserRole(id, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Telegram bot routes
  app.get("/api/telegram/connection", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.getTelegramConnection(userId);
      res.json(connection || null);
    } catch (error) {
      console.error("Error fetching Telegram connection:", error);
      res.status(500).json({ message: "Failed to fetch Telegram connection" });
    }
  });

  app.post("/api/telegram/connect", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { chatId, username, defaultWorkspaceId } = req.body;

      const connection = await storage.createTelegramConnection({
        userId,
        telegramChatId: chatId,
        telegramUsername: username,
        defaultWorkspaceId,
        isActive: true
      });

      res.json(connection);
    } catch (error) {
      console.error("Error creating Telegram connection:", error);
      res.status(500).json({ message: "Failed to create Telegram connection" });
    }
  });

  app.patch("/api/telegram/connection/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const connection = await storage.updateTelegramConnection(id, updates);
      res.json(connection);
    } catch (error) {
      console.error("Error updating Telegram connection:", error);
      res.status(500).json({ message: "Failed to update Telegram connection" });
    }
  });

  app.get("/api/telegram/submissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.getTelegramConnection(userId);
      
      if (!connection) {
        return res.json([]);
      }

      const submissions = await storage.getTelegramSubmissions(connection.id);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching Telegram submissions:", error);
      res.status(500).json({ message: "Failed to fetch Telegram submissions" });
    }
  });

  app.get("/api/telegram/status", async (req, res) => {
    res.json({
      botInitialized: telegramBot.isInitialized(),
      timestamp: new Date().toISOString()
    });
  });

  // AI Model Configuration routes
  app.get('/api/ai-configs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const configs = await storage.getAiModelConfigs(userId);
      
      // Hide API keys in response for security
      const safeConfigs = configs.map(config => ({
        ...config,
        apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : null
      }));
      
      res.json(safeConfigs);
    } catch (error) {
      console.error('Failed to get AI configs:', error);
      res.status(500).json({ message: 'Failed to get AI configurations' });
    }
  });

  app.post('/api/ai-configs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const configData = { ...req.body, userId };
      
      // Validate required fields
      const { insertAiModelConfigSchema } = await import('@shared/schema');
      const validatedData = insertAiModelConfigSchema.parse(configData);
      
      const config = await storage.createAiModelConfig(validatedData);
      
      // Hide API key in response
      const safeConfig = {
        ...config,
        apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : null
      };
      
      res.status(201).json(safeConfig);
    } catch (error: any) {
      console.error('Failed to create AI config:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Invalid configuration data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create AI configuration' });
      }
    }
  });

  app.put('/api/ai-configs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify ownership
      const existingConfig = await storage.getAiModelConfig(id);
      if (!existingConfig || existingConfig.userId !== userId) {
        return res.status(404).json({ message: 'Configuration not found' });
      }
      
      const updateData = { ...req.body, userId };
      const config = await storage.updateAiModelConfig(id, updateData);
      
      // Hide API key in response
      const safeConfig = {
        ...config,
        apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : null
      };
      
      res.json(safeConfig);
    } catch (error) {
      console.error('Failed to update AI config:', error);
      res.status(500).json({ message: 'Failed to update AI configuration' });
    }
  });

  app.delete('/api/ai-configs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify ownership
      const existingConfig = await storage.getAiModelConfig(id);
      if (!existingConfig || existingConfig.userId !== userId) {
        return res.status(404).json({ message: 'Configuration not found' });
      }
      
      await storage.deleteAiModelConfig(id);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete AI config:', error);
      res.status(500).json({ message: 'Failed to delete AI configuration' });
    }
  });

  // AI Usage Statistics
  app.get('/api/ai-usage/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timeframe = req.query.timeframe as 'day' | 'week' | 'month' | undefined;
      
      const stats = await storage.getAiUsageStats(userId, timeframe);
      res.json(stats);
    } catch (error) {
      console.error('Failed to get AI usage stats:', error);
      res.status(500).json({ message: 'Failed to get usage statistics' });
    }
  });

  // Content item routes
  app.get('/api/content/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const contentItem = await storage.getContentItem(id);
      if (!contentItem) {
        return res.status(404).json({ message: "Content not found" });
      }

      // Verify access through workspace ownership
      const workspace = await storage.getWorkspace(contentItem.workspaceId);
      if (!workspace || workspace.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(contentItem);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });



  // Annotation routes
  app.get('/api/content/:id/annotations', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify access to content item
      const contentItem = await storage.getContentItem(id);
      if (!contentItem) {
        return res.status(404).json({ message: "Content not found" });
      }

      const workspace = await storage.getWorkspace(contentItem.workspaceId);
      if (!workspace || workspace.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const annotations = await storage.getContentAnnotations(id, userId);
      res.json(annotations);
    } catch (error) {
      console.error("Error fetching annotations:", error);
      res.status(500).json({ message: "Failed to fetch annotations" });
    }
  });

  app.post('/api/content/:id/annotations', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify access to content item
      const contentItem = await storage.getContentItem(id);
      if (!contentItem) {
        return res.status(404).json({ message: "Content not found" });
      }

      const workspace = await storage.getWorkspace(contentItem.workspaceId);
      if (!workspace || workspace.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertAnnotationSchema.parse({
        ...req.body,
        contentItemId: id,
        userId,
      });

      const annotation = await storage.createAnnotation(validatedData);
      res.json(annotation);
    } catch (error) {
      console.error("Error creating annotation:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid annotation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create annotation" });
    }
  });

  app.delete('/api/annotations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      await storage.deleteAnnotation(id, userId);
      res.json({ message: "Annotation deleted successfully" });
    } catch (error) {
      console.error("Error deleting annotation:", error);
      res.status(500).json({ message: "Failed to delete annotation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
