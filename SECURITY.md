# Security Guidelines for ResearchHub

## Environment Variables and Secrets Management

### Important Security Notice
**Never commit sensitive credentials to version control!** This includes:
- Telegram Bot Tokens
- AI API Keys (OpenAI, Anthropic, etc.)
- Database credentials
- Session secrets
- Authentication tokens

### Proper Secret Management

#### 1. Local Development
Use the `.env` file for local development (already gitignored):
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

#### 2. Replit Environment
For Replit deployment, use Replit's Secrets management:
1. Go to your Replit project
2. Click on "Secrets" in the left sidebar (lock icon)
3. Add your environment variables there instead of committing them to code

Required secrets for Replit:
- `DATABASE_URL` - Your PostgreSQL connection string
- `SESSION_SECRET` - A secure random string for session encryption
- `REPL_ID` - Your Replit app ID for authentication
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token (if using Telegram integration)

#### 3. Production Deployment
Use your hosting provider's environment variable management:
- Vercel: Environment Variables in dashboard
- Netlify: Site settings → Environment variables
- Railway: Variables tab in project settings
- Heroku: Config Vars in app settings

### Security Best Practices

#### Token Security
1. **Regenerate Compromised Tokens**: If a token was accidentally committed:
   - Immediately regenerate the token in the respective service
   - Update the new token in your environment variables
   - Remove the old token from git history if needed

2. **Telegram Bot Token**: 
   - Keep your bot token private
   - Use BotFather to regenerate if compromised
   - Store only in environment variables

3. **AI API Keys**:
   - Use the in-app configuration in Settings → AI Models
   - Keys are stored securely in the database
   - Never hardcode in source code

#### Database Security
- Use strong, unique passwords
- Enable SSL connections for production
- Regularly rotate credentials
- Use connection pooling limits

#### Session Security
- Use a strong SESSION_SECRET (32+ random characters)
- Enable secure cookies in production
- Set appropriate session timeouts

### Environment Configuration

#### Required Environment Variables
```bash
# Essential for all deployments
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secure-session-secret
REPL_ID=your-replit-app-id

# Optional for enhanced functionality
TELEGRAM_BOT_TOKEN=your-bot-token
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-domain.replit.app
NODE_ENV=production
```

#### AI Provider Configuration
Instead of environment variables, configure AI providers through the application:
1. Log into your ResearchHub instance
2. Go to Settings → AI Models
3. Add your provider configurations securely
4. API keys are encrypted and stored in the database

### Incident Response

If you accidentally commit secrets:

1. **Immediate Action**:
   - Regenerate all compromised tokens/keys
   - Update environment variables with new credentials
   - Verify application functionality

2. **Git History Cleanup** (if needed):
   ```bash
   # Remove sensitive files from git history
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch .env' \
   --prune-empty --tag-name-filter cat -- --all
   
   # Force push (use with caution)
   git push origin --force --all
   ```

3. **Verify Security**:
   - Check that new tokens work correctly
   - Monitor for any unauthorized access
   - Update documentation as needed

### Monitoring and Auditing

- Regularly review who has access to your secrets
- Monitor API usage for unusual patterns  
- Set up alerts for failed authentication attempts
- Keep audit logs of secret access and changes

### Contact

For security concerns or questions:
- Open a GitHub issue with the "security" label
- Contact the development team directly
- Follow responsible disclosure practices

---

**Remember**: Security is everyone's responsibility. When in doubt, ask for help rather than risking exposure of sensitive information.