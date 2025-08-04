import {
  users,
  workspaces,
  contentItems,
  summaries,
  sources,
  activities,
  sharedContent,
  sharedSummaries,
  collaborativeEdits,
  telegramConnections,
  telegramSubmissions,
  type User,
  type UpsertUser,
  type Workspace,
  type InsertWorkspace,
  type Summary,
  type InsertSummary,
  type ContentItem,
  type InsertContentItem,
  type Source,
  type InsertSource,
  type Activity,
  type SharedContent,
  type InsertSharedContent,
  type SharedSummary,
  type InsertSharedSummary,
  type CollaborativeEdit,
  type InsertCollaborativeEdit,
  type TelegramConnection,
  type InsertTelegramConnection,
  type TelegramSubmission,
  type InsertTelegramSubmission,
  aiModelConfigs,
  type AiModelConfig,
  type InsertAiModelConfig,
  aiUsageLog,
  type AiUsageLog,
  type InsertAiUsageLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, count, sql, ne, gte } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Workspace operations
  getUserWorkspaces(userId: string): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  createWorkspace(workspace: InsertWorkspace & { userId: string }): Promise<Workspace>;
  updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace>;
  deleteWorkspace(id: string): Promise<void>;
  
  // Content operations
  getWorkspaceContent(workspaceId: string, limit?: number): Promise<ContentItem[]>;
  addContentItem(item: InsertContentItem): Promise<ContentItem>;
  createContentItem(item: InsertContentItem): Promise<ContentItem>;
  bulkAddContentItems(items: InsertContentItem[]): Promise<ContentItem[]>;
  getContentSinceDate(workspaceId: string, date: Date): Promise<ContentItem[]>;
  
  // Summary operations
  getWorkspaceSummaries(workspaceId: string): Promise<Summary[]>;
  createSummary(summary: InsertSummary): Promise<Summary>;
  updateSummary(id: string, updates: Partial<Summary>): Promise<Summary>;
  deleteSummary(id: string): Promise<void>;
  getLatestSummary(workspaceId: string): Promise<Summary | undefined>;
  
  // Source operations
  getAllSources(): Promise<Source[]>;
  getActiveWhitelistedSources(): Promise<Source[]>;
  getWorkspaceSources(workspaceId: string): Promise<Source[]>;
  createSource(source: InsertSource): Promise<Source>;
  updateSource(id: string, updates: Partial<Source>): Promise<Source>;
  
  // Activity operations
  getUserActivities(userId: string, limit?: number): Promise<Activity[]>;
  createActivity(activity: { userId: string; workspaceId?: string; type: string; description: string; metadata?: any }): Promise<Activity>;
  
  // Statistics
  getUserStats(userId: string): Promise<{
    activeWorkspaces: number;
    contentItems: number;
    summaries: number;
    sourcesMonitored: number;
  }>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
  
  // Cross-workspace sharing operations
  shareContentToWorkspace(data: InsertSharedContent): Promise<SharedContent>;
  shareSummaryToWorkspace(data: InsertSharedSummary): Promise<SharedSummary>;
  getSharedContentForWorkspace(workspaceId: string): Promise<(SharedContent & { contentItem: ContentItem; fromWorkspace: Workspace })[]>;
  getSharedSummariesForWorkspace(workspaceId: string): Promise<(SharedSummary & { summary: Summary; fromWorkspace: Workspace })[]>;
  recordCollaborativeEdit(edit: InsertCollaborativeEdit): Promise<CollaborativeEdit>;
  getCollaborativeEdits(summaryId: string): Promise<(CollaborativeEdit & { user: User })[]>;

  // Telegram operations
  getTelegramConnection(userId: string): Promise<TelegramConnection | undefined>;
  getTelegramConnectionByChatId(chatId: string): Promise<TelegramConnection | undefined>;
  createTelegramConnection(connection: InsertTelegramConnection): Promise<TelegramConnection>;
  updateTelegramConnection(id: string, updates: Partial<TelegramConnection>): Promise<TelegramConnection>;
  createTelegramSubmission(submission: InsertTelegramSubmission): Promise<TelegramSubmission>;
  getTelegramSubmissions(connectionId: string): Promise<TelegramSubmission[]>;

  // AI Model Configuration operations
  getAiModelConfigs(userId: string): Promise<AiModelConfig[]>;
  getAiModelConfig(id: string): Promise<AiModelConfig | undefined>;
  getDefaultAiModelConfig(userId: string): Promise<AiModelConfig | undefined>;
  createAiModelConfig(data: InsertAiModelConfig): Promise<AiModelConfig>;
  updateAiModelConfig(id: string, data: Partial<InsertAiModelConfig>): Promise<AiModelConfig>;
  deleteAiModelConfig(id: string): Promise<void>;
  logAiUsage(data: InsertAiUsageLog): Promise<AiUsageLog>;
  getAiUsageStats(userId: string, timeframe?: 'day' | 'week' | 'month'): Promise<{
    totalCost: number;
    totalTokens: number;
    totalCalls: number;
    byProvider: Record<string, { cost: number; tokens: number; calls: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Workspace operations
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    return await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.userId, userId))
      .orderBy(desc(workspaces.updatedAt));
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  }

  async createWorkspace(workspace: InsertWorkspace & { userId: string }): Promise<Workspace> {
    const [newWorkspace] = await db.insert(workspaces).values(workspace).returning();
    return newWorkspace;
  }

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const [workspace] = await db
      .update(workspaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();
    return workspace;
  }

  async deleteWorkspace(id: string): Promise<void> {
    await db.delete(workspaces).where(eq(workspaces.id, id));
  }

  // Content operations
  async getWorkspaceContent(workspaceId: string, limit = 100): Promise<ContentItem[]> {
    return await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.workspaceId, workspaceId))
      .orderBy(desc(contentItems.createdAt))
      .limit(limit);
  }

  async addContentItem(item: InsertContentItem): Promise<ContentItem> {
    const [contentItem] = await db.insert(contentItems).values(item).returning();
    return contentItem;
  }

  async createContentItem(item: InsertContentItem): Promise<ContentItem> {
    const [contentItem] = await db.insert(contentItems).values(item).returning();
    return contentItem;
  }

  async bulkAddContentItems(items: InsertContentItem[]): Promise<ContentItem[]> {
    if (items.length === 0) return [];
    return await db.insert(contentItems).values(items).returning();
  }

  async getContentSinceDate(workspaceId: string, date: Date): Promise<ContentItem[]> {
    return await db
      .select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.workspaceId, workspaceId),
          sql`${contentItems.createdAt} > ${date}`
        )
      )
      .orderBy(desc(contentItems.createdAt));
  }

  // Summary operations
  async getWorkspaceSummaries(workspaceId: string): Promise<Summary[]> {
    return await db
      .select()
      .from(summaries)
      .where(
        and(
          eq(summaries.workspaceId, workspaceId),
          eq(summaries.isDeleted, false)
        )
      )
      .orderBy(desc(summaries.createdAt));
  }

  async createSummary(summary: InsertSummary): Promise<Summary> {
    const [newSummary] = await db.insert(summaries).values(summary).returning();
    return newSummary;
  }

  async updateSummary(id: string, updates: Partial<Summary>): Promise<Summary> {
    const [summary] = await db
      .update(summaries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(summaries.id, id))
      .returning();
    return summary;
  }

  async deleteSummary(id: string): Promise<void> {
    await db
      .update(summaries)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(summaries.id, id));
  }

  async getLatestSummary(workspaceId: string): Promise<Summary | undefined> {
    const [summary] = await db
      .select()
      .from(summaries)
      .where(
        and(
          eq(summaries.workspaceId, workspaceId),
          eq(summaries.isDeleted, false)
        )
      )
      .orderBy(desc(summaries.createdAt))
      .limit(1);
    return summary;
  }

  // Source operations
  async getAllSources(): Promise<Source[]> {
    return await db.select().from(sources).orderBy(sources.name);
  }

  async getActiveWhitelistedSources(): Promise<Source[]> {
    return await db
      .select()
      .from(sources)
      .where(
        and(
          eq(sources.isActive, true),
          eq(sources.isWhitelisted, true)
        )
      );
  }

  async getWorkspaceSources(workspaceId: string): Promise<Source[]> {
    // For now, return all sources. In future, we could link sources to workspaces
    return await db.select().from(sources).where(eq(sources.isActive, true));
  }

  async createSource(source: InsertSource): Promise<Source> {
    const [newSource] = await db.insert(sources).values(source).returning();
    return newSource;
  }

  async updateSource(id: string, updates: Partial<Source>): Promise<Source> {
    const [source] = await db
      .update(sources)
      .set(updates)
      .where(eq(sources.id, id))
      .returning();
    return source;
  }

  // Activity operations
  async getUserActivities(userId: string, limit = 20): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activity: { userId: string; workspaceId?: string; type: string; description: string; metadata?: any }): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Statistics
  async getUserStats(userId: string): Promise<{
    activeWorkspaces: number;
    contentItems: number;
    summaries: number;
    sourcesMonitored: number;
  }> {
    const userWorkspaces = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.userId, userId));
    const workspaceIds = userWorkspaces.map(w => w.id);

    const [activeWorkspacesResult] = await db
      .select({ count: count() })
      .from(workspaces)
      .where(
        and(
          eq(workspaces.userId, userId),
          eq(workspaces.status, 'active')
        )
      );

    const [contentItemsResult] = workspaceIds.length > 0 
      ? await db
          .select({ count: count() })
          .from(contentItems)
          .where(inArray(contentItems.workspaceId, workspaceIds))
      : [{ count: 0 }];

    const [summariesResult] = workspaceIds.length > 0
      ? await db
          .select({ count: count() })
          .from(summaries)
          .where(
            and(
              inArray(summaries.workspaceId, workspaceIds),
              eq(summaries.isDeleted, false)
            )
          )
      : [{ count: 0 }];

    const [sourcesResult] = await db
      .select({ count: count() })
      .from(sources)
      .where(
        and(
          eq(sources.isActive, true),
          eq(sources.isWhitelisted, true)
        )
      );

    return {
      activeWorkspaces: activeWorkspacesResult.count,
      contentItems: contentItemsResult.count,
      summaries: summariesResult.count,
      sourcesMonitored: sourcesResult.count,
    };
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Cross-workspace sharing operations
  async shareContentToWorkspace(data: InsertSharedContent): Promise<SharedContent> {
    const [shared] = await db
      .insert(sharedContent)
      .values(data)
      .returning();
    return shared;
  }

  async shareSummaryToWorkspace(data: InsertSharedSummary): Promise<SharedSummary> {
    const [shared] = await db
      .insert(sharedSummaries)
      .values(data)
      .returning();
    return shared;
  }

  async getSharedContentForWorkspace(workspaceId: string): Promise<(SharedContent & { contentItem: ContentItem; fromWorkspace: Workspace })[]> {
    const result = await db
      .select({
        id: sharedContent.id,
        contentItemId: sharedContent.contentItemId,
        fromWorkspaceId: sharedContent.fromWorkspaceId,
        toWorkspaceId: sharedContent.toWorkspaceId,
        sharedById: sharedContent.sharedById,
        notes: sharedContent.notes,
        createdAt: sharedContent.createdAt,
        contentItem: contentItems,
        fromWorkspace: workspaces,
      })
      .from(sharedContent)
      .innerJoin(contentItems, eq(sharedContent.contentItemId, contentItems.id))
      .innerJoin(workspaces, eq(sharedContent.fromWorkspaceId, workspaces.id))
      .where(eq(sharedContent.toWorkspaceId, workspaceId));
    
    return result as any;
  }

  async getSharedSummariesForWorkspace(workspaceId: string): Promise<(SharedSummary & { summary: Summary; fromWorkspace: Workspace })[]> {
    const result = await db
      .select({
        id: sharedSummaries.id,
        summaryId: sharedSummaries.summaryId,
        fromWorkspaceId: sharedSummaries.fromWorkspaceId,
        toWorkspaceId: sharedSummaries.toWorkspaceId,
        sharedById: sharedSummaries.sharedById,
        notes: sharedSummaries.notes,
        isCollaborative: sharedSummaries.isCollaborative,
        createdAt: sharedSummaries.createdAt,
        summary: summaries,
        fromWorkspace: workspaces,
      })
      .from(sharedSummaries)
      .innerJoin(summaries, eq(sharedSummaries.summaryId, summaries.id))
      .innerJoin(workspaces, eq(sharedSummaries.fromWorkspaceId, workspaces.id))
      .where(eq(sharedSummaries.toWorkspaceId, workspaceId));
    
    return result as any;
  }

  async recordCollaborativeEdit(edit: InsertCollaborativeEdit): Promise<CollaborativeEdit> {
    const [recorded] = await db
      .insert(collaborativeEdits)
      .values(edit)
      .returning();
    return recorded;
  }

  async getCollaborativeEdits(summaryId: string): Promise<(CollaborativeEdit & { user: User })[]> {
    const result = await db
      .select({
        id: collaborativeEdits.id,
        summaryId: collaborativeEdits.summaryId,
        userId: collaborativeEdits.userId,
        changeDescription: collaborativeEdits.changeDescription,
        oldContent: collaborativeEdits.oldContent,
        newContent: collaborativeEdits.newContent,
        createdAt: collaborativeEdits.createdAt,
        user: users,
      })
      .from(collaborativeEdits)
      .innerJoin(users, eq(collaborativeEdits.userId, users.id))
      .where(eq(collaborativeEdits.summaryId, summaryId))
      .orderBy(desc(collaborativeEdits.createdAt));
    
    return result as any;
  }

  // Telegram operations
  async getTelegramConnection(userId: string): Promise<TelegramConnection | undefined> {
    const [connection] = await db
      .select()
      .from(telegramConnections)
      .where(and(eq(telegramConnections.userId, userId), eq(telegramConnections.isActive, true)))
      .limit(1);
    return connection;
  }

  async getTelegramConnectionByChatId(chatId: string): Promise<TelegramConnection | undefined> {
    const [connection] = await db
      .select()
      .from(telegramConnections)
      .where(and(eq(telegramConnections.telegramChatId, chatId), eq(telegramConnections.isActive, true)))
      .limit(1);
    return connection;
  }

  async createTelegramConnection(connection: InsertTelegramConnection): Promise<TelegramConnection> {
    const [newConnection] = await db
      .insert(telegramConnections)
      .values(connection)
      .onConflictDoUpdate({
        target: telegramConnections.telegramChatId,
        set: {
          ...connection,
          isActive: true,
        }
      })
      .returning();
    return newConnection;
  }

  async updateTelegramConnection(id: string, updates: Partial<TelegramConnection>): Promise<TelegramConnection> {
    const [connection] = await db
      .update(telegramConnections)
      .set(updates)
      .where(eq(telegramConnections.id, id))
      .returning();
    return connection;
  }

  async createTelegramSubmission(submission: InsertTelegramSubmission): Promise<TelegramSubmission> {
    const [newSubmission] = await db
      .insert(telegramSubmissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  async getTelegramSubmissions(connectionId: string): Promise<TelegramSubmission[]> {
    return await db
      .select()
      .from(telegramSubmissions)
      .where(eq(telegramSubmissions.telegramConnectionId, connectionId))
      .orderBy(desc(telegramSubmissions.createdAt));
  }

  // AI Model Configuration methods
  async getAiModelConfigs(userId: string): Promise<AiModelConfig[]> {
    const configs = await db.select()
      .from(aiModelConfigs)
      .where(eq(aiModelConfigs.userId, userId))
      .orderBy(desc(aiModelConfigs.isDefault), desc(aiModelConfigs.createdAt));
    return configs;
  }

  async getAiModelConfig(id: string): Promise<AiModelConfig | undefined> {
    const [config] = await db.select()
      .from(aiModelConfigs)
      .where(eq(aiModelConfigs.id, id));
    return config;
  }

  async getDefaultAiModelConfig(userId: string): Promise<AiModelConfig | undefined> {
    const [config] = await db.select()
      .from(aiModelConfigs)
      .where(and(
        eq(aiModelConfigs.userId, userId),
        eq(aiModelConfigs.isDefault, true),
        eq(aiModelConfigs.isActive, true)
      ));
    return config;
  }

  async createAiModelConfig(data: InsertAiModelConfig): Promise<AiModelConfig> {
    // If this is being set as default, unset all other defaults for this user
    if (data.isDefault) {
      await db.update(aiModelConfigs)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(aiModelConfigs.userId, data.userId));
    }

    const [config] = await db.insert(aiModelConfigs)
      .values(data)
      .returning();
    return config;
  }

  async updateAiModelConfig(id: string, data: Partial<InsertAiModelConfig>): Promise<AiModelConfig> {
    // If this is being set as default, unset all other defaults for this user
    if (data.isDefault && data.userId) {
      await db.update(aiModelConfigs)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(
          eq(aiModelConfigs.userId, data.userId),
          ne(aiModelConfigs.id, id)
        ));
    }

    const [config] = await db.update(aiModelConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(aiModelConfigs.id, id))
      .returning();
    return config;
  }

  async deleteAiModelConfig(id: string): Promise<void> {
    await db.delete(aiModelConfigs)
      .where(eq(aiModelConfigs.id, id));
  }

  async logAiUsage(data: InsertAiUsageLog): Promise<AiUsageLog> {
    // Update usage count and last used timestamp
    await db.update(aiModelConfigs)
      .set({ 
        usageCount: sql`${aiModelConfigs.usageCount} + 1`,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(aiModelConfigs.id, data.configId));

    const [log] = await db.insert(aiUsageLog)
      .values(data)
      .returning();
    return log;
  }

  async getAiUsageStats(userId: string, timeframe?: 'day' | 'week' | 'month'): Promise<{
    totalCost: number;
    totalTokens: number;
    totalCalls: number;
    byProvider: Record<string, { cost: number; tokens: number; calls: number }>;
  }> {
    let whereClause = eq(aiUsageLog.userId, userId);
    
    if (timeframe) {
      const now = new Date();
      let startDate: Date;
      switch (timeframe) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
      whereClause = and(whereClause, gte(aiUsageLog.createdAt, startDate));
    }

    const results = await db.select({
      provider: aiModelConfigs.provider,
      cost: aiUsageLog.estimatedCost,
      tokens: aiUsageLog.tokensUsed,
    })
    .from(aiUsageLog)
    .innerJoin(aiModelConfigs, eq(aiUsageLog.configId, aiModelConfigs.id))
    .where(whereClause);

    const stats = {
      totalCost: 0,
      totalTokens: 0,
      totalCalls: results.length,
      byProvider: {} as Record<string, { cost: number; tokens: number; calls: number }>
    };

    results.forEach(row => {
      const cost = parseFloat(row.cost || '0');
      const tokens = row.tokens || 0;
      
      stats.totalCost += cost;
      stats.totalTokens += tokens;
      
      if (!stats.byProvider[row.provider]) {
        stats.byProvider[row.provider] = { cost: 0, tokens: 0, calls: 0 };
      }
      stats.byProvider[row.provider].cost += cost;
      stats.byProvider[row.provider].tokens += tokens;
      stats.byProvider[row.provider].calls += 1;
    });

    return stats;
  }
}

export const storage = new DatabaseStorage();
