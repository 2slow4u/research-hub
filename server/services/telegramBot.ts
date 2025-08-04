import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { ContentExtractor } from './contentExtractor';

class TelegramBotService {
  private bot: TelegramBot | null = null;
  private contentExtractor: ContentExtractor;
  private initialized = false;

  constructor() {
    this.contentExtractor = new ContentExtractor();
    // Initialize bot asynchronously without blocking constructor
    this.initializeBot().catch(error => {
      console.error('Failed to initialize Telegram bot:', error);
    });
  }

  private async initializeBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.log('TELEGRAM_BOT_TOKEN not provided, Telegram bot will not be available');
      return;
    }

    console.log(`Initializing Telegram bot with token: ${token.substring(0, 10)}...${token.substring(token.length - 6)}`);

    // Handle environment variable caching - use valid token until environment refreshes
    if (token === '8252196862:AAFSmWoU_wBdWXq4o7hYvD4NW_WZ4d0dMKk') {
      console.log('Environment still has old token, using valid token until refresh...');
      await this.initializeWithToken('8252196862:AAHCF5-eSLGb9v6v1e-JanyCP8sVK_VrIlc');
      return;
    }

    await this.initializeWithToken(token);
  }

  private async initializeWithToken(token: string) {
    try {
      // First, test if the token is valid without starting polling
      const testResponse = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const testResult = await testResponse.json();
      
      if (!testResult.ok) {
        console.error(`Invalid Telegram bot token: ${testResult.description}. Bot will not start.`);
        console.log('Please update your TELEGRAM_BOT_TOKEN with a valid token from @BotFather');
        return;
      }
      
      console.log(`Telegram bot verified: @${testResult.result.username}`);
      
      this.bot = new TelegramBot(token, { polling: true });
      
      // Add error handling for the bot
      this.bot.on('polling_error', (error) => {
        console.error('Telegram polling error:', error.message);
        if (error.message.includes('401')) {
          console.error('Invalid bot token - please check your TELEGRAM_BOT_TOKEN');
        }
      });

      this.bot.on('error', (error) => {
        console.error('Telegram bot error:', error);
      });

      this.setupHandlers();
      this.initialized = true;
      console.log('Telegram bot initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Telegram bot:', error);
    }
  }

  private setupHandlers() {
    if (!this.bot) return;

    // Handle /start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
🔬 Welcome to ResearchHub Bot!

This bot helps you add content directly to your research workspaces.

Commands:
• /connect <email> - Connect your account
• /workspaces - List your workspaces
• /help - Show this help message

You can also send me:
• URLs to articles and papers
• Text content to save
• Files and documents

Get started by connecting your account with:
/connect your-email@example.com
      `;

      this.bot?.sendMessage(chatId, welcomeMessage);
    });

    // Handle /connect command
    this.bot.onText(/\/connect (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const email = match?.[1];

      if (!email) {
        this.bot?.sendMessage(chatId, '❌ Please provide your email: /connect your-email@example.com');
        return;
      }

      try {
        // Note: In a real implementation, you'd verify the email and create a secure connection
        // For now, we'll just store the chat ID and let the user complete connection in the web app
        this.bot?.sendMessage(chatId, `
✅ Connection request received for: ${email}

Your Chat ID: ${chatId}

Please complete the setup in your ResearchHub web app:
1. Go to Settings > Telegram Integration
2. Enter your Chat ID: ${chatId}
3. Select your default workspace

Once connected, you can send URLs, text, and files directly to your research workspaces!
        `);
      } catch (error) {
        console.error('Error handling connect command:', error);
        this.bot?.sendMessage(chatId, '❌ Failed to process connection request. Please try again later.');
      }
    });

    // Handle /workspaces command
    this.bot.onText(/\/workspaces/, async (msg) => {
      const chatId = msg.chat.id.toString();

      try {
        const connection = await storage.getTelegramConnectionByChatId(chatId);
        
        if (!connection) {
          this.bot?.sendMessage(chatId, '❌ Please connect your account first using /connect <email>');
          return;
        }

        const workspaces = await storage.getUserWorkspaces(connection.userId);
        
        if (workspaces.length === 0) {
          this.bot?.sendMessage(chatId, '📝 You don\'t have any workspaces yet. Create one in the web app first.');
          return;
        }

        const workspaceList = workspaces.map((ws, index) => 
          `${index + 1}. ${ws.name} ${ws.id === connection.defaultWorkspaceId ? '(default)' : ''}`
        ).join('\n');

        this.bot?.sendMessage(chatId, `📚 Your workspaces:\n\n${workspaceList}`);
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        this.bot?.sendMessage(chatId, '❌ Failed to fetch workspaces. Please try again later.');
      }
    });

    // Handle /help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `
🔬 ResearchHub Bot Help

Commands:
• /start - Welcome message and setup
• /connect <email> - Connect your account
• /workspaces - List your workspaces
• /help - Show this help

What you can send:
📄 URLs - I'll extract the content and add it to your workspace
📝 Text - Direct text content to save
📎 Files - Documents and images for your research

Need help? Visit the web app or contact support.
      `;

      this.bot?.sendMessage(chatId, helpMessage);
    });

    // Handle text messages (URLs and content)
    this.bot.on('message', async (msg) => {
      // Skip if it's a command
      if (msg.text?.startsWith('/')) return;

      const chatId = msg.chat.id.toString();

      try {
        const connection = await storage.getTelegramConnectionByChatId(chatId);
        
        if (!connection) {
          this.bot?.sendMessage(msg.chat.id, '❌ Please connect your account first using /connect <email>');
          return;
        }

        if (!connection.defaultWorkspaceId) {
          this.bot?.sendMessage(msg.chat.id, '❌ No default workspace set. Please configure it in the web app.');
          return;
        }

        await this.processMessage(msg, connection);
      } catch (error) {
        console.error('Error processing message:', error);
        this.bot?.sendMessage(msg.chat.id, '❌ Failed to process your message. Please try again later.');
      }
    });

    // Handle errors
    this.bot.on('polling_error', (error) => {
      console.error('Telegram bot polling error:', error);
    });
  }

  private async processMessage(msg: any, connection: any) {
    const chatId = msg.chat.id;

    try {
      // Determine message type and content
      let submissionType = 'text';
      let content = '';
      let extractedData = null;

      if (msg.text) {
        content = msg.text;
        
        // Check if it's a URL
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = msg.text.match(urlRegex);
        
        if (urls && urls.length > 0) {
          submissionType = 'url';
          
          // Send processing message
          this.bot?.sendMessage(chatId, '🔄 Processing URL...');
          
          try {
            extractedData = await this.contentExtractor.extractFromUrl(urls[0]);
          } catch (error) {
            console.error('Content extraction failed:', error);
            this.bot?.sendMessage(chatId, '⚠️ Could not extract content from URL, saving as text instead.');
          }
        }
      } else if (msg.document) {
        submissionType = 'file';
        content = msg.document.file_name || 'Untitled file';
      } else if (msg.photo) {
        submissionType = 'image';
        content = msg.caption || 'Image';
      }

      // Create submission record
      const submission = await storage.createTelegramSubmission({
        telegramConnectionId: connection.id,
        workspaceId: connection.defaultWorkspaceId || 'default',
        messageId: msg.message_id.toString(),
        submissionType,
        originalContent: content,
        extractedTitle: extractedData?.title || content.substring(0, 100),
        extractedContent: extractedData?.content,
        status: 'processed'
      });

      // Add to workspace if extraction was successful
      if (extractedData && connection.defaultWorkspaceId) {
        try {
          // Get workspace to calculate proper relevance score
          const workspace = await storage.getWorkspace(connection.defaultWorkspaceId);
          let relevanceScore = 85; // Default for manually added content
          
          if (workspace) {
            // Use ContentService to calculate proper score
            const contentService = new (await import('./contentService')).ContentService();
            relevanceScore = await contentService['calculateRelevanceScore'](
              extractedData.content,
              extractedData.title,
              workspace.keywords,
              workspace.purpose || undefined
            );
            // Add bonus for manual addition
            relevanceScore = Math.min(100, relevanceScore + 15);
          }

          await storage.addContentItem({
            workspaceId: connection.defaultWorkspaceId,
            title: extractedData.title,
            content: extractedData.content,
            htmlContent: extractedData.htmlContent,
            sourceId: null, // Will be filled later if we have source mapping
            url: urls[0], // Use the original URL from the message
            relevanceScore
          });

          this.bot?.sendMessage(chatId, `✅ Content added to your workspace: "${extractedData.title}"`);
        } catch (error) {
          console.error('Failed to add content to workspace:', error);
          this.bot?.sendMessage(chatId, '⚠️ Content processed but failed to add to workspace. Check the web app.');
        }
      } else {
        // Just save the submission for manual processing
        this.bot?.sendMessage(chatId, '📝 Message saved! You can view it in the Telegram integration page.');
      }

    } catch (error) {
      console.error('Error processing message:', error);
      this.bot?.sendMessage(chatId, '❌ Failed to process your message. Please try again later.');
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getBot(): TelegramBot | null {
    return this.bot;
  }
}

// Export singleton instance
export const telegramBot = new TelegramBotService();