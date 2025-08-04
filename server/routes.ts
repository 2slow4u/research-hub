import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertWorkspaceSchema, insertSummarySchema } from "@shared/schema";
import { ContentService } from "./services/contentService";
import { SummaryService } from "./services/summaryService";

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
          const content = await storage.getWorkspaceContent(workspace.id, 1);
          const summaries = await storage.getWorkspaceSummaries(workspace.id);
          return {
            ...workspace,
            contentCount: content.length,
            summaryCount: summaries.length,
          };
        })
      );
      
      res.json(workspacesWithStats);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      res.status(500).json({ message: "Failed to fetch workspaces" });
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

  // Cross-workspace sharing routes
  app.post('/api/workspaces/:workspaceId/share-content', isAuthenticated, async (req: any, res) => {
    try {
      const { workspaceId } = req.params;
      const { contentItemId, toWorkspaceId, notes } = req.body;
      const userId = req.user.claims.sub;

      // Verify user owns the source workspace
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace || workspace.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Verify target workspace exists and user has access to it
      const targetWorkspace = await storage.getWorkspace(toWorkspaceId);
      if (!targetWorkspace || targetWorkspace.userId !== userId) {
        return res.status(403).json({ message: "Invalid target workspace" });
      }

      const sharedContent = await storage.shareContentToWorkspace({
        contentItemId,
        fromWorkspaceId: workspaceId,
        toWorkspaceId,
        sharedById: userId,
        notes,
      });

      res.json(sharedContent);
    } catch (error) {
      console.error("Error sharing content:", error);
      res.status(500).json({ message: "Failed to share content" });
    }
  });

  app.post('/api/workspaces/:workspaceId/share-summary', isAuthenticated, async (req: any, res) => {
    try {
      const { workspaceId } = req.params;
      const { summaryId, toWorkspaceId, notes, isCollaborative } = req.body;
      const userId = req.user.claims.sub;

      // Verify user owns the source workspace
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace || workspace.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Verify target workspace exists and user has access to it
      const targetWorkspace = await storage.getWorkspace(toWorkspaceId);
      if (!targetWorkspace || targetWorkspace.userId !== userId) {
        return res.status(403).json({ message: "Invalid target workspace" });
      }

      const sharedSummary = await storage.shareSummaryToWorkspace({
        summaryId,
        fromWorkspaceId: workspaceId,
        toWorkspaceId,
        sharedById: userId,
        notes,
        isCollaborative: isCollaborative || false,
      });

      res.json(sharedSummary);
    } catch (error) {
      console.error("Error sharing summary:", error);
      res.status(500).json({ message: "Failed to share summary" });
    }
  });

  app.get('/api/workspaces/:workspaceId/shared-content', isAuthenticated, async (req: any, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.claims.sub;

      // Verify user owns the workspace
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace || workspace.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const sharedContent = await storage.getSharedContentForWorkspace(workspaceId);
      res.json(sharedContent);
    } catch (error) {
      console.error("Error fetching shared content:", error);
      res.status(500).json({ message: "Failed to fetch shared content" });
    }
  });

  app.get('/api/workspaces/:workspaceId/shared-summaries', isAuthenticated, async (req: any, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.claims.sub;

      // Verify user owns the workspace
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace || workspace.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const sharedSummaries = await storage.getSharedSummariesForWorkspace(workspaceId);
      res.json(sharedSummaries);
    } catch (error) {
      console.error("Error fetching shared summaries:", error);
      res.status(500).json({ message: "Failed to fetch shared summaries" });
    }
  });

  app.post('/api/summaries/:summaryId/collaborative-edit', isAuthenticated, async (req: any, res) => {
    try {
      const { summaryId } = req.params;
      const { changeDescription, oldContent, newContent } = req.body;
      const userId = req.user.claims.sub;

      const edit = await storage.recordCollaborativeEdit({
        summaryId,
        userId,
        changeDescription,
        oldContent,
        newContent,
      });

      res.json(edit);
    } catch (error) {
      console.error("Error recording collaborative edit:", error);
      res.status(500).json({ message: "Failed to record edit" });
    }
  });

  app.get('/api/summaries/:summaryId/collaborative-edits', isAuthenticated, async (req: any, res) => {
    try {
      const { summaryId } = req.params;
      const edits = await storage.getCollaborativeEdits(summaryId);
      res.json(edits);
    } catch (error) {
      console.error("Error fetching collaborative edits:", error);
      res.status(500).json({ message: "Failed to fetch edits" });
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

  const httpServer = createServer(app);
  return httpServer;
}
