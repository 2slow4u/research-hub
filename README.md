# ResearchHub - AI-Powered Research Management Platform

ResearchHub is a comprehensive AI-powered research management platform that helps users automatically collect, monitor, and summarize research content from various sources. The application provides workspace-based organization, intelligent content aggregation, AI-powered summarization capabilities, comprehensive content management features, and Telegram bot integration for seamless content addition from mobile devices.

## 🌟 Key Features

### Core Research Management
- **Smart Workspace Organization**: Create purpose-driven workspaces with advanced relevance scoring (0-100 points)
- **Intelligent Content Monitoring**: Automated collection from trusted sources with configurable frequency (hourly to weekly)
- **Advanced Archive System**: Complete workspace lifecycle management with archive/restore functionality
- **Expandable Navigation**: Smart sidebar with workspace hierarchy and alphabetical sorting
- **Rich Content Display**: Full HTML rendering with image preservation and responsive design

### AI-Powered Intelligence
- **Multi-Provider AI Support**: Configure OpenAI, Anthropic, Google AI, Azure OpenAI, and Vertex AI
- **Cost Tracking & Analytics**: Detailed usage logs and cost estimation across providers
- **Advanced Summarization**: Generate comprehensive summaries with configurable focus areas
- **Relevance Scoring Algorithm**: Sophisticated scoring considering keywords, purpose alignment, and content quality

### Enhanced User Experience
- **Visual Annotation System**: Direct text highlighting and commenting with color-coded indicators
- **Mobile Integration**: Telegram bot (@researchHubBot) for seamless content submission
- **Export Capabilities**: Export workspace content in structured Markdown format
- **Dark Mode Support**: Beautiful light and dark themes with system preference detection
- **Real-time Updates**: Live content and summary updates with TanStack Query caching

### Security & Authentication
- **Replit Auth Integration**: Secure OpenID Connect authentication with session management
- **Role-Based Access Control**: User and admin roles with protected routes
- **Secure API Key Management**: Masked display and secure storage of AI provider credentials
- **PostgreSQL Session Storage**: Robust session handling with configurable TTL

## 🚀 Technology Stack

### Frontend Architecture
- **React 18** with TypeScript and Vite build system
- **Shadcn/UI** components built on Radix UI primitives
- **TailwindCSS** with custom design system and theme support
- **Wouter** for lightweight client-side routing
- **React Hook Form** with Zod validation for type-safe forms
- **TanStack Query** for server state management and caching

### Backend Architecture
- **Node.js** with Express.js framework and TypeScript
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** with Neon serverless database integration
- **Service-based Architecture** for business logic organization
- **Express Sessions** with PostgreSQL storage using connect-pg-simple

### External Integrations
- **Multi-AI Provider Support**: OpenAI, Anthropic, Google AI, Azure OpenAI, Vertex AI
- **Telegram Bot API**: node-telegram-bot-api for mobile content ingestion
- **Content Processing**: Advanced HTML extraction with image preservation
- **Authentication**: Replit Auth service with OpenID Connect

## 📋 Getting Started

### Prerequisites
- Node.js 18+ environment
- PostgreSQL database (Neon recommended)
- AI provider API keys (configured in-app)
- Telegram Bot Token (optional for mobile integration)

### Quick Start on Replit
1. Click the "Run" button to start the development server
2. The application will be available at the provided Replit domain
3. Use Replit Auth to sign in and create your first workspace
4. Configure AI providers in Settings → AI Models
5. Optionally set up Telegram bot in Settings → Telegram Bot

### Local Development
```bash
# Clone the repository
git clone <your-repo-url>
cd research-hub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Configure DATABASE_URL, SESSION_SECRET, REPL_ID, TELEGRAM_BOT_TOKEN

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## 🏗️ Project Architecture

```
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components and routing
│   │   │   ├── Dashboard.tsx        # Main workspace overview
│   │   │   ├── Archive.tsx          # Archived workspace management
│   │   │   ├── Search.tsx           # Content discovery and monitoring
│   │   │   ├── Summaries.tsx        # AI summary management
│   │   │   ├── Settings.tsx         # Settings hub
│   │   │   ├── AiModelConfig.tsx    # AI provider configuration
│   │   │   ├── TelegramIntegration.tsx # Mobile bot setup
│   │   │   ├── ArticleReader.tsx    # Rich content viewer with annotations
│   │   │   ├── WorkspaceEdit.tsx    # Workspace settings editor
│   │   │   └── Workspaces.tsx       # Workspace overview and management
│   │   ├── hooks/           # Custom React hooks (useAuth, useToast)
│   │   ├── lib/             # Utilities (queryClient, authUtils)
│   │   └── contexts/        # React context providers
├── server/                   # Express backend API
│   ├── services/            # Business logic services
│   │   ├── aiService.ts            # Multi-provider AI integration
│   │   ├── summaryService.ts       # Summary generation logic
│   │   ├── telegramBotService.ts   # Telegram bot handlers
│   │   └── contentExtractor.ts     # Content processing and extraction
│   ├── routes.ts           # Comprehensive API route definitions
│   ├── storage.ts          # Database operations with Drizzle ORM
│   ├── replitAuth.ts       # Authentication setup and middleware
│   ├── db.ts               # Database connection and configuration
│   └── index.ts            # Server entry point with Express setup
├── shared/                  # Shared TypeScript types and schemas
│   └── schema.ts           # Complete Drizzle database schema
├── components.json         # Shadcn/UI configuration
├── drizzle.config.ts       # Database migration configuration
└── replit.md              # Project documentation and architecture notes
```

## 🗃️ Database Schema

### Core Entities
- **Users**: Authentication and user profile data
- **Workspaces**: Research containers with purpose and keyword configuration
- **Content Items**: Collected research with HTML content and relevance scores
- **Summaries**: AI-generated summaries with version tracking
- **Sources**: Trusted content sources for monitoring
- **Activities**: Comprehensive user activity logging
- **Annotations**: Visual highlighting and commenting system

### Advanced Features
- **AI Model Configs**: Multi-provider configuration with cost tracking
- **AI Usage Logs**: Detailed usage analytics and cost monitoring
- **Telegram Connections**: User account linking for mobile integration
- **Telegram Submissions**: Content submitted via mobile bot
- **Sessions**: PostgreSQL-backed session storage for security

## 🔌 Key API Endpoints

### Authentication & Users
- `GET /api/auth/user` - Current user profile
- `GET /api/login` - Initiate Replit Auth flow
- `GET /api/logout` - Secure logout with session cleanup

### Workspace Management
- `GET /api/workspaces` - List active workspaces
- `GET /api/workspaces/archived` - List archived workspaces
- `POST /api/workspaces` - Create new workspace
- `PATCH /api/workspaces/:id` - Update workspace settings
- `POST /api/workspaces/:id/archive` - Archive workspace (stops monitoring)
- `POST /api/workspaces/:id/restore` - Restore archived workspace
- `POST /api/workspaces/:id/recalculate-scores` - Recalculate content relevance

### Content & Annotations
- `GET /api/workspaces/:id/content` - Workspace content with pagination
- `GET /api/content/:id` - Individual content item with annotations
- `POST /api/content/:id/annotations` - Add text highlights and comments
- `DELETE /api/annotations/:id` - Remove annotations

### AI & Summarization
- `GET /api/ai-model-configs` - List configured AI providers
- `POST /api/ai-model-configs` - Add new AI provider
- `POST /api/workspaces/:id/summaries` - Generate AI summary
- `GET /api/workspaces/:id/summaries` - List workspace summaries

### Telegram Integration
- `GET /api/telegram/connections` - User Telegram connections
- `POST /api/telegram/connections` - Link Telegram account
- `GET /api/telegram/submissions` - Mobile content submissions

## 🎯 Recent Major Updates

### Archive System Enhancement (Latest)
- Complete workspace lifecycle management with archive/restore functionality
- Monitoring control: archive stops content monitoring, restore resumes it
- User-friendly terminology: "restore" instead of "unarchive" throughout
- Comprehensive activity logging for archive/restore actions
- Enhanced navigation with dedicated Archive page

### Visual Annotation System
- Direct text highlighting with persistent visual indicators
- Color-coded comment system for collaborative research
- HTML content preservation with rich formatting
- Responsive annotation interface with proper click handling

### AI Provider Configuration
- Multi-provider support: OpenAI, Anthropic, Google AI, Azure OpenAI, Vertex AI
- Cost tracking and usage analytics across providers
- Secure API key management with masked display
- Default provider selection for seamless operations

### Telegram Bot Integration
- Complete mobile content submission via @researchHubBot
- Automatic URL extraction and content processing
- Workspace routing for organized content addition
- Command-based interface (/start, /connect, /workspaces, /help)

### Enhanced Navigation System
- Expandable workspace navigation with alphabetical sorting
- Smart workspace overview page with statistics
- Individual workspace quick access links
- Improved route management with comprehensive audit

## 🚢 Deployment

The application is optimized for Replit's deployment system:

1. **Environment Setup**: Configure DATABASE_URL and SESSION_SECRET
2. **AI Configuration**: Set up providers through Settings → AI Models
3. **Mobile Integration**: Configure Telegram bot (optional)
4. **Database Migration**: Automatic schema push with Drizzle
5. **Deployment**: Use Replit's one-click deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/enhancement`)
3. Follow TypeScript and React best practices
4. Test thoroughly with the development server
5. Update documentation in `replit.md` for architectural changes
6. Submit a pull request with detailed description

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🆘 Support

For support, questions, or feature requests:
- Open an issue on GitHub
- Contact the development team
- Check `replit.md` for architectural documentation

---

Built with modern web technologies, AI-powered intelligence, and comprehensive research management capabilities.