# ResearchHub - AI-Powered Research Management Platform

ResearchHub is a comprehensive research management platform that helps users automatically collect, monitor, and summarize research content from various sources. Built with modern web technologies and AI-powered features.

## Features

### 🔍 Research Management
- **Workspace-based Organization**: Create separate workspaces for different research topics
- **Keyword Monitoring**: Automatically collect content based on defined keywords
- **Content Aggregation**: Monitor trusted sources for relevant research content
- **Relevance Scoring**: AI-powered relevance scoring for collected content

### 🤖 AI-Powered Summarization
- **Full & Differential Summaries**: Generate comprehensive or incremental summaries
- **Focus Areas**: Target summaries on specific aspects of your research
- **Version Control**: Track summary versions and changes over time
- **Export Capabilities**: Export summaries in multiple formats

### 🤝 Collaboration Features
- **Cross-Workspace Sharing**: Share content and summaries between workspaces
- **Collaborative Editing**: Enable collaborative editing on shared summaries
- **Change Tracking**: Track collaborative edits and contributions
- **Activity Monitoring**: Monitor all workspace activities and changes

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
- **OpenAI API** for AI-powered features
- **Replit Auth** for authentication

### Development Tools
- **ESBuild** for fast compilation
- **Drizzle Kit** for database migrations
- **TSX** for TypeScript execution

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Neon account)
- OpenAI API key (for AI features)

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
- `OPENAI_API_KEY`: Your OpenAI API key
- `SESSION_SECRET`: A secure session secret
- `REPL_ID`: Your Replit app ID (for auth)

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
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── contexts/       # React contexts
├── server/                 # Backend Express application
│   ├── services/           # Business logic services
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
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

## Deployment

The application is designed to work seamlessly with Replit's deployment system:

1. Ensure all environment variables are set
2. Push your code to the repository
3. Deploy using Replit's deployment features

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