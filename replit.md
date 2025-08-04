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