# Overview

ResearchHub is an AI-powered research management platform that helps users automatically collect, monitor, and summarize research content from various sources. The application provides workspace-based organization, intelligent content aggregation, AI-powered summarization capabilities, comprehensive content management features, and Telegram bot integration for seamless content addition from mobile devices.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with protected routes based on authentication
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Theme System**: Custom theme provider supporting light/dark modes with system preference detection

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route organization
- **Authentication**: Replit Auth integration with OpenID Connect for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Database ORM**: Drizzle ORM with type-safe database operations
- **Content Processing**: Service-based architecture with ContentService and SummaryService for business logic

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless database integration
- **Schema Management**: Drizzle migrations with structured schema definitions
- **Database Models**: Users, workspaces, content items, summaries, sources, activities, and sessions
- **Relationships**: Foreign key constraints with cascade deletes for data integrity

## Authentication and Authorization
- **Provider**: Replit Auth with OpenID Connect protocol
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Role-based Access**: User and admin roles with protected routes and API endpoints
- **Security Features**: CSRF protection, secure cookies, and environment-based configuration

## External Dependencies
- **AI Integration**: OpenAI API for content summarization and analysis using GPT-4o model
- **Database**: Neon PostgreSQL serverless database with connection pooling
- **Authentication**: Replit Auth service for user management and OAuth flows
- **Telegram Integration**: node-telegram-bot-api for Telegram bot functionality and content ingestion
- **Development Tools**: Replit-specific plugins for development environment integration
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS with custom design system variables and dark mode support

## Recent Changes (August 4, 2025)

- **Critical Bug Fixes**: Resolved content deletion and Telegram URL preservation issues
  - Fixed content deletion by adding proper cascade deletion for annotations before content removal
  - Enhanced Telegram bot to properly save original URLs from messages for refresh functionality
  - Improved refresh button to re-extract content with HTML from original source URLs
  - Added comprehensive error handling with detailed error messages for better debugging
  - Updated storage layer with proper annotation cleanup during content deletion
  - Telegram-submitted content now preserves URLs for proper refresh capability

- **HTML Content Rendering**: Complete implementation of rich HTML content display with image preservation
  - Added htmlContent field to contentItems schema for storing rich HTML content with images
  - Enhanced ContentExtractor service to extract and preserve HTML content alongside text content
  - Implemented proper image URL conversion (relative to absolute) for cross-site compatibility
  - Added HTML sanitization to remove dangerous elements while preserving safe formatting
  - Updated ArticleReader to render HTML content using dangerouslySetInnerHTML for rich display
  - Enhanced image styling with responsive design and proper margins
  - Links automatically open in new tabs with security attributes
  - Telegram bot integration updated to save both text and HTML content
  - Database schema migration completed successfully

## Previous Changes (August 4, 2025)

- **Enhanced Relevance Scoring System**: Complete overhaul of content relevance scoring algorithm
  - Added purpose field to workspace schema for better context-aware scoring
  - New scoring algorithm considers keywords (0-60 points), purpose alignment (0-30 points), and content quality (0-10 points)
  - Score range changed from 50-100 to true 0-100 scale for better differentiation
  - Lowered content inclusion threshold from 50 to 30 to allow more content through initial filtering
  - Added annotation-based scoring bonus (up to 20 points) - comments and highlights increase relevance
  - Implemented recalculateRelevanceScores function to update all content scores when workspace purpose changes
  - Title matches weighted higher than content matches for better relevance detection
  - Added content quality factors (length, research keywords) to improve scoring accuracy
  - Updated Telegram bot integration to use new scoring system with manual addition bonus
  - Enhanced CreateWorkspaceModal to include purpose field with user guidance
  - API route added for recalculating workspace content scores (/api/workspaces/:id/recalculate-scores)

## Previous Changes (August 4, 2025)
- **AI Model Configuration System**: Complete implementation of configurable AI provider system
  - Database schema updated with aiModelConfigs and aiUsageLogs tables for tracking configurations and usage
  - AiService created supporting OpenAI, Azure OpenAI, Anthropic, VertexAI, and Gemini providers
  - Frontend AiModelConfig page for managing multiple AI provider connections with security features
  - API routes for CRUD operations on AI configurations with proper authentication and validation
  - Navigation updated to include "AI Models" link in sidebar with CPU icon
  - Cost tracking and usage statistics with provider-specific cost estimation
  - Secure API key storage with masked display for security
  - Default configuration selection for seamless AI operations
  - SummaryService updated to use configurable AI providers instead of fixed OpenAI integration
  - Support for provider-specific parameters (base URL, organization ID, project ID, region)

- **Telegram Bot Integration**: Complete implementation of Telegram bot functionality
  - Database schema updated with telegramConnections and telegramSubmissions tables
  - TelegramBotService created with command handlers (/start, /connect, /workspaces, /help)
  - ContentExtractor service for URL and content processing from Telegram messages
  - Frontend TelegramIntegration page for bot configuration and submission management
  - API routes for managing Telegram connections and retrieving submissions
  - Navigation updated to include "Telegram Bot" link in sidebar
  - Bot supports URL extraction, text content saving, and workspace integration
  - User can connect Telegram account and set default workspace for content routing

- **Article Reader Improvements**: Enhanced in-app article reading experience
  - Fixed backend API routes for content item retrieval and management
  - Added missing database operations for content items and annotations
  - Improved text formatting with pre-line CSS for proper line break preservation
  - Simplified annotation system to only use highlight and comment functions
  - Fixed comment input functionality with proper event handling and click outside detection
  - Added refresh button to reload article content and annotations
  - Enhanced tooltip interaction to show after text selection without right-click conflicts
  - Improved UI stability with proper CSS classes for annotation forms
  - Fixed annotation deletion to update UI immediately without page refresh
  - Enhanced comment form stability to stay open while typing until Save/Cancel is clicked

- **Export System Enhancement**: Improved data export functionality
  - Changed export format from JSON to Markdown for better readability
  - Structured Markdown export with workspace name, export date, and article count
  - Individual articles formatted with titles, sources, publication dates, relevance scores
  - Clean separation between articles with horizontal rules
  - Proper Markdown formatting with headers, links, and emphasis