# ResearchHub - AI-Powered Research Management Platform

ResearchHub is a comprehensive research management platform that helps users automatically collect, monitor, and summarize research content from various sources. Built with modern web technologies and AI-powered features.

## Features

### 🔍 Research Management
- **Workspace-based Organization**: Create separate workspaces for different research topics
- **Keyword Monitoring**: Automatically collect content based on defined keywords
- **Content Aggregation**: Monitor trusted sources for relevant research content
- **Relevance Scoring**: AI-powered relevance scoring for collected content

### 🤖 AI-Powered Summarization
- **Multi-Provider Support**: Configure OpenAI, Azure OpenAI, Anthropic, VertexAI, and Gemini providers
- **Cost Management**: Track usage and costs across different AI providers
- **Full & Differential Summaries**: Generate comprehensive or incremental summaries
- **Focus Areas**: Target summaries on specific aspects of your research
- **Version Control**: Track summary versions and changes over time
- **Export Capabilities**: Export summaries in multiple formats

### 🤝 Collaboration Features
- **Cross-Workspace Sharing**: Share content and summaries between workspaces
- **Collaborative Editing**: Enable collaborative editing on shared summaries
- **Change Tracking**: Track collaborative edits and contributions
- **Activity Monitoring**: Monitor all workspace activities and changes

### 📱 Telegram Integration
- **Bot Integration**: Add content directly from Telegram using commands
- **Workspace Routing**: Route Telegram content to specific workspaces
- **URL Processing**: Automatically extract and process URLs from messages
- **Mobile Accessibility**: Easy content addition from mobile devices

### 🔐 Security & Authentication
- **Replit Auth Integration**: Secure authentication using Replit's OpenID Connect
- **Role-Based Access**: User and admin roles with appropriate permissions
- **Session Management**: Secure session handling with PostgreSQL storage

### 🎨 Modern UI/UX
- **Dark Mode Support**: Beautiful light and dark theme support
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Real-time Updates**: Live updates for content and summaries
- **Intuitive Interface**: Clean, professional interface built with Shadcn/UI

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Wouter** for lightweight routing
- **TanStack Query** for server state management
- **Shadcn/UI** components with Radix UI primitives
- **Tailwind CSS** for styling
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **PostgreSQL** with Neon serverless database
- **Multi-AI Provider Support** (OpenAI, Azure OpenAI, Anthropic, VertexAI, Gemini)
- **Telegram Bot API** for mobile integration
- **Replit Auth** for authentication

### Development Tools
- **ESBuild** for fast compilation
- **Drizzle Kit** for database migrations
- **TSX** for TypeScript execution

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Neon account)
- AI Provider API keys (OpenAI, Anthropic, etc. - configurable in app)
- Telegram Bot Token (optional, for mobile integration)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd research-hub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your environment variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `SESSION_SECRET`: A secure session secret
- `REPL_ID`: Your Replit app ID (for auth)
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token (optional)

Note: AI provider API keys are now configured through the Settings → AI Models interface in the application for better security and flexibility.

4. Push database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── Layout/     # Layout components (Sidebar, etc.)
│   │   ├── pages/          # Page components
│   │   │   ├── Dashboard.tsx       # Main dashboard
│   │   │   ├── Search.tsx          # Search & monitoring
│   │   │   ├── Summaries.tsx       # Summary management
│   │   │   ├── Settings.tsx        # Settings hub
│   │   │   ├── AiModelConfig.tsx   # AI provider configuration
│   │   │   └── TelegramIntegration.tsx # Telegram bot setup
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── contexts/       # React contexts
├── server/                 # Backend Express application
│   ├── services/           # Business logic services
│   │   ├── aiService.ts            # Multi-provider AI service
│   │   ├── summaryService.ts       # Summary generation
│   │   ├── telegramBotService.ts   # Telegram bot logic
│   │   └── contentExtractor.ts     # Content processing
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   ├── replitAuth.ts       # Authentication setup
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema definitions
└── README.md
```

## Database Schema

The application uses the following main entities:

- **Users**: User accounts and authentication data
- **Workspaces**: Research workspace containers
- **Content Items**: Collected research content
- **Summaries**: AI-generated summaries
- **Sources**: Trusted content sources
- **Activities**: User activity tracking
- **Shared Content**: Cross-workspace content sharing
- **Collaborative Edits**: Change tracking for collaborative summaries
- **AI Model Configs**: Multi-provider AI configuration and settings
- **AI Usage Logs**: AI provider usage tracking and cost monitoring
- **Telegram Connections**: User Telegram account connections
- **Telegram Submissions**: Content submitted via Telegram bot

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Initiate login flow
- `GET /api/logout` - Logout user

### Workspaces
- `GET /api/workspaces` - List user workspaces
- `POST /api/workspaces` - Create new workspace
- `GET /api/workspaces/:id` - Get workspace details
- `PATCH /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Content & Summaries
- `GET /api/workspaces/:id/content` - Get workspace content
- `GET /api/workspaces/:id/summaries` - Get workspace summaries
- `POST /api/workspaces/:id/summaries` - Generate new summary

### Sharing & Collaboration
- `POST /api/workspaces/:id/share-content` - Share content to another workspace
- `POST /api/workspaces/:id/share-summary` - Share summary to another workspace
- `GET /api/workspaces/:id/shared-content` - Get shared content
- `GET /api/workspaces/:id/shared-summaries` - Get shared summaries

### AI Model Management
- `GET /api/ai-model-configs` - List AI provider configurations
- `POST /api/ai-model-configs` - Add new AI provider configuration
- `PATCH /api/ai-model-configs/:id` - Update AI provider configuration
- `DELETE /api/ai-model-configs/:id` - Remove AI provider configuration
- `POST /api/ai-model-configs/:id/set-default` - Set default AI provider

### Telegram Integration
- `GET /api/telegram/connections` - Get user's Telegram connections
- `POST /api/telegram/connections` - Create Telegram connection
- `GET /api/telegram/submissions` - Get Telegram submissions
- `PATCH /api/telegram/submissions/:id` - Update submission status

## Navigation Structure

The application features a clean, organized navigation:

- **Dashboard**: Main overview with workspace stats and activity feed
- **Search & Monitor**: Content discovery and source monitoring
- **Summaries**: AI-powered summary management and generation  
- **Settings**: Configuration hub including:
  - **AI Models**: Configure multiple AI providers (OpenAI, Anthropic, etc.)
  - **Telegram Bot**: Set up mobile content integration
  - **General Settings**: User preferences and workspace settings

## Deployment

The application is designed to work seamlessly with Replit's deployment system:

1. Ensure all environment variables are set
2. Configure AI providers through Settings → AI Models
3. Set up Telegram bot (optional) through Settings → Telegram Bot
4. Push your code to the repository
5. Deploy using Replit's deployment features

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using modern web technologies and AI-powered features.