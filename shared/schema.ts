import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default('user'), // 'user' or 'admin'
  mfaEnabled: boolean("mfa_enabled").default(false),
  mfaSecret: varchar("mfa_secret"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workspaceStatusEnum = pgEnum('workspace_status', ['active', 'paused', 'archived']);
export const monitoringFrequencyEnum = pgEnum('monitoring_frequency', ['hourly', '6hours', 'daily', 'weekly']);

export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name").notNull(),
  keywords: text("keywords").array().notNull(),
  status: workspaceStatusEnum("status").default('active'),
  monitoringFrequency: monitoringFrequencyEnum("monitoring_frequency").default('daily'),
  lastMonitored: timestamp("last_monitored"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sources = pgTable("sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  url: varchar("url").notNull(),
  type: varchar("type").notNull(), // 'rss', 'api', 'web'
  isWhitelisted: boolean("is_whitelisted").default(true),
  isActive: boolean("is_active").default(true),
  reputation: integer("reputation").default(100),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentItems = pgTable("content_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  sourceId: varchar("source_id").references(() => sources.id),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  url: varchar("url"),
  publishedAt: timestamp("published_at"),
  relevanceScore: integer("relevance_score").default(0),
  isProcessed: boolean("is_processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const summaryTypeEnum = pgEnum('summary_type', ['full', 'differential']);

export const summaries = pgTable("summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  type: summaryTypeEnum("type").notNull(),
  focus: text("focus"), // Optional focus areas
  contentItems: text("content_items").array(), // IDs of content items included
  version: integer("version").default(1),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  workspaceId: varchar("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // 'content_added', 'summary_generated', 'workspace_created', etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cross-workspace sharing tables
export const sharedContent = pgTable("shared_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentItemId: varchar("content_item_id").references(() => contentItems.id, { onDelete: 'cascade' }).notNull(),
  fromWorkspaceId: varchar("from_workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  toWorkspaceId: varchar("to_workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  sharedById: varchar("shared_by_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sharedSummaries = pgTable("shared_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  summaryId: varchar("summary_id").references(() => summaries.id, { onDelete: 'cascade' }).notNull(),
  fromWorkspaceId: varchar("from_workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  toWorkspaceId: varchar("to_workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  sharedById: varchar("shared_by_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  notes: text("notes"),
  isCollaborative: boolean("is_collaborative").default(false), // Can other workspace edit this summary
  createdAt: timestamp("created_at").defaultNow(),
});

export const collaborativeEdits = pgTable("collaborative_edits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  summaryId: varchar("summary_id").references(() => summaries.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  changeDescription: text("change_description").notNull(),
  oldContent: text("old_content"),
  newContent: text("new_content"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Telegram bot integration tables
export const telegramConnections = pgTable("telegram_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  telegramChatId: varchar("telegram_chat_id").notNull().unique(),
  telegramUsername: varchar("telegram_username"),
  isActive: boolean("is_active").default(true),
  defaultWorkspaceId: varchar("default_workspace_id").references(() => workspaces.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const telegramSubmissions = pgTable("telegram_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramConnectionId: varchar("telegram_connection_id").references(() => telegramConnections.id, { onDelete: 'cascade' }).notNull(),
  workspaceId: varchar("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  messageId: varchar("message_id").notNull(),
  submissionType: varchar("submission_type").notNull(), // 'url', 'text', 'file'
  originalContent: text("original_content").notNull(),
  extractedTitle: varchar("extracted_title"),
  extractedContent: text("extracted_content"),
  contentItemId: varchar("content_item_id").references(() => contentItems.id),
  status: varchar("status").default('pending'), // 'pending', 'processed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  activities: many(activities),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  user: one(users, {
    fields: [workspaces.userId],
    references: [users.id],
  }),
  contentItems: many(contentItems),
  summaries: many(summaries),
  activities: many(activities),
}));

export const contentItemsRelations = relations(contentItems, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [contentItems.workspaceId],
    references: [workspaces.id],
  }),
  source: one(sources, {
    fields: [contentItems.sourceId],
    references: [sources.id],
  }),
}));

export const summariesRelations = relations(summaries, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [summaries.workspaceId],
    references: [workspaces.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [activities.workspaceId],
    references: [workspaces.id],
  }),
}));

export const sharedContentRelations = relations(sharedContent, ({ one }) => ({
  contentItem: one(contentItems, {
    fields: [sharedContent.contentItemId],
    references: [contentItems.id],
  }),
  fromWorkspace: one(workspaces, {
    fields: [sharedContent.fromWorkspaceId],
    references: [workspaces.id],
  }),
  toWorkspace: one(workspaces, {
    fields: [sharedContent.toWorkspaceId],
    references: [workspaces.id],
  }),
  sharedBy: one(users, {
    fields: [sharedContent.sharedById],
    references: [users.id],
  }),
}));

export const sharedSummariesRelations = relations(sharedSummaries, ({ one }) => ({
  summary: one(summaries, {
    fields: [sharedSummaries.summaryId],
    references: [summaries.id],
  }),
  fromWorkspace: one(workspaces, {
    fields: [sharedSummaries.fromWorkspaceId],
    references: [workspaces.id],
  }),
  toWorkspace: one(workspaces, {
    fields: [sharedSummaries.toWorkspaceId],
    references: [workspaces.id],
  }),
  sharedBy: one(users, {
    fields: [sharedSummaries.sharedById],
    references: [users.id],
  }),
}));

export const collaborativeEditsRelations = relations(collaborativeEdits, ({ one }) => ({
  summary: one(summaries, {
    fields: [collaborativeEdits.summaryId],
    references: [summaries.id],
  }),
  user: one(users, {
    fields: [collaborativeEdits.userId],
    references: [users.id],
  }),
}));

export const telegramConnectionsRelations = relations(telegramConnections, ({ one, many }) => ({
  user: one(users, {
    fields: [telegramConnections.userId],
    references: [users.id],
  }),
  defaultWorkspace: one(workspaces, {
    fields: [telegramConnections.defaultWorkspaceId],
    references: [workspaces.id],
  }),
  submissions: many(telegramSubmissions),
}));

export const telegramSubmissionsRelations = relations(telegramSubmissions, ({ one }) => ({
  telegramConnection: one(telegramConnections, {
    fields: [telegramSubmissions.telegramConnectionId],
    references: [telegramConnections.id],
  }),
  workspace: one(workspaces, {
    fields: [telegramSubmissions.workspaceId],
    references: [workspaces.id],
  }),
  contentItem: one(contentItems, {
    fields: [telegramSubmissions.contentItemId],
    references: [contentItems.id],
  }),
}));

// Schemas
export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  lastMonitored: true,
});

export const insertSummarySchema = createInsertSchema(summaries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  isDeleted: true,
});

export const insertContentItemSchema = createInsertSchema(contentItems).omit({
  id: true,
  createdAt: true,
  relevanceScore: true,
  isProcessed: true,
});

export const insertSourceSchema = createInsertSchema(sources).omit({
  id: true,
  createdAt: true,
});

export const insertSharedContentSchema = createInsertSchema(sharedContent).omit({
  id: true,
  createdAt: true,
});

export const insertSharedSummarySchema = createInsertSchema(sharedSummaries).omit({
  id: true,
  createdAt: true,
});

export const insertCollaborativeEditSchema = createInsertSchema(collaborativeEdits).omit({
  id: true,
  createdAt: true,
});

export const insertTelegramConnectionSchema = createInsertSchema(telegramConnections).omit({
  id: true,
  createdAt: true,
});

export const insertTelegramSubmissionSchema = createInsertSchema(telegramSubmissions).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;
export type InsertSummary = z.infer<typeof insertSummarySchema>;
export type Summary = typeof summaries.$inferSelect;
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;
export type ContentItem = typeof contentItems.$inferSelect;
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Source = typeof sources.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type InsertSharedContent = z.infer<typeof insertSharedContentSchema>;
export type SharedContent = typeof sharedContent.$inferSelect;
export type InsertSharedSummary = z.infer<typeof insertSharedSummarySchema>;
export type SharedSummary = typeof sharedSummaries.$inferSelect;
export type InsertCollaborativeEdit = z.infer<typeof insertCollaborativeEditSchema>;
export type CollaborativeEdit = typeof collaborativeEdits.$inferSelect;
export type InsertTelegramConnection = z.infer<typeof insertTelegramConnectionSchema>;
export type TelegramConnection = typeof telegramConnections.$inferSelect;
export type InsertTelegramSubmission = z.infer<typeof insertTelegramSubmissionSchema>;
export type TelegramSubmission = typeof telegramSubmissions.$inferSelect;

// AI Model Configurations
export const aiModelConfigs = pgTable("ai_model_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // User-friendly name like "My OpenAI", "Company Azure"
  provider: varchar("provider").notNull(), // 'openai', 'azure_openai', 'anthropic', 'vertexai', 'gemini'
  model: varchar("model").notNull(), // e.g., 'gpt-4o', 'claude-3-5-sonnet', 'gemini-pro'
  apiKey: text("api_key").notNull(),
  baseUrl: varchar("base_url"), // For custom endpoints
  organizationId: varchar("organization_id"), // For OpenAI orgs
  projectId: varchar("project_id"), // For VertexAI
  region: varchar("region"), // For Azure/VertexAI
  additionalConfig: jsonb("additional_config"), // For provider-specific settings
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Usage Tracking
export const aiUsageLog = pgTable("ai_usage_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  configId: varchar("config_id").notNull().references(() => aiModelConfigs.id, { onDelete: "cascade" }),
  operation: varchar("operation").notNull(), // 'summarize', 'extract', 'analyze'
  tokensUsed: integer("tokens_used"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 6 }),
  responseTime: integer("response_time"), // in milliseconds
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for AI configs
export const aiModelConfigsRelations = relations(aiModelConfigs, ({ one, many }) => ({
  user: one(users, {
    fields: [aiModelConfigs.userId],
    references: [users.id],
  }),
  usageLogs: many(aiUsageLog),
}));

export const aiUsageLogRelations = relations(aiUsageLog, ({ one }) => ({
  user: one(users, {
    fields: [aiUsageLog.userId],
    references: [users.id],
  }),
  config: one(aiModelConfigs, {
    fields: [aiUsageLog.configId],
    references: [aiModelConfigs.id],
  }),
}));

// Schemas for AI configs
export const insertAiModelConfigSchema = createInsertSchema(aiModelConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  lastUsed: true,
});

export const insertAiUsageLogSchema = createInsertSchema(aiUsageLog).omit({
  id: true,
  createdAt: true,
});

// Types for AI configs
export type AiModelConfig = typeof aiModelConfigs.$inferSelect;
export type InsertAiModelConfig = z.infer<typeof insertAiModelConfigSchema>;
export type AiUsageLog = typeof aiUsageLog.$inferSelect;
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;

// Annotations table for article reading
export const annotations = pgTable("annotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentItemId: varchar("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { enum: ["highlight", "note", "question", "comment"] }).notNull(),
  text: text("text").notNull(), // Selected text for highlights, or the annotation text for notes
  content: text("content"), // User's annotation content (notes, comments, questions)
  position: jsonb("position").notNull(), // Stores position data for text selection
  color: varchar("color").default("#fbbf24"), // Highlight color
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const annotationsRelations = relations(annotations, ({ one }) => ({
  contentItem: one(contentItems, {
    fields: [annotations.contentItemId],
    references: [contentItems.id],
  }),
  user: one(users, {
    fields: [annotations.userId],
    references: [users.id],
  }),
}));

export const insertAnnotationSchema = createInsertSchema(annotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;
