import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { storage } from '../storage';
import type { AiModelConfig, InsertAiUsageLog } from '@shared/schema';

interface AiResponse {
  content: string;
  tokensUsed?: number;
  estimatedCost?: number;
  responseTime: number;
}

interface AiRequest {
  prompt: string;
  systemPrompt?: string;
  userId: string;
  operation: 'summarize' | 'extract' | 'analyze';
  configId?: string; // Optional: use specific config, otherwise use default
}

export class AiService {
  private openaiClients = new Map<string, OpenAI>();
  private anthropicClients = new Map<string, Anthropic>();
  private geminiClients = new Map<string, GoogleGenAI>();

  private getOpenAIClient(config: AiModelConfig): OpenAI {
    const cacheKey = config.id;
    if (!this.openaiClients.has(cacheKey)) {
      const clientConfig: any = {
        apiKey: config.apiKey,
      };

      if (config.baseUrl) {
        clientConfig.baseURL = config.baseUrl;
      }
      if (config.organizationId) {
        clientConfig.organization = config.organizationId;
      }

      this.openaiClients.set(cacheKey, new OpenAI(clientConfig));
    }
    return this.openaiClients.get(cacheKey)!;
  }

  private getAnthropicClient(config: AiModelConfig): Anthropic {
    const cacheKey = config.id;
    if (!this.anthropicClients.has(cacheKey)) {
      const clientConfig: any = {
        apiKey: config.apiKey,
      };

      if (config.baseUrl) {
        clientConfig.baseURL = config.baseUrl;
      }

      this.anthropicClients.set(cacheKey, new Anthropic(clientConfig));
    }
    return this.anthropicClients.get(cacheKey)!;
  }

  private getGeminiClient(config: AiModelConfig): GoogleGenAI {
    const cacheKey = config.id;
    if (!this.geminiClients.has(cacheKey)) {
      this.geminiClients.set(cacheKey, new GoogleGenAI({
        apiKey: config.apiKey,
      }));
    }
    return this.geminiClients.get(cacheKey)!;
  }

  private async getConfigForRequest(userId: string, configId?: string): Promise<AiModelConfig> {
    let config: AiModelConfig | undefined;

    if (configId) {
      config = await storage.getAiModelConfig(configId);
      if (!config || config.userId !== userId || !config.isActive) {
        throw new Error('Invalid or inactive AI configuration');
      }
    } else {
      config = await storage.getDefaultAiModelConfig(userId);
      if (!config) {
        throw new Error('No default AI configuration found. Please set up an AI model first.');
      }
    }

    return config;
  }

  private estimateCost(provider: string, model: string, tokensUsed: number): number {
    // Rough cost estimates per 1K tokens (input + output combined average)
    const costPer1KTokens: Record<string, Record<string, number>> = {
      openai: {
        'gpt-4o': 0.0075,
        'gpt-4o-mini': 0.00025,
        'gpt-4-turbo': 0.015,
        'gpt-3.5-turbo': 0.002,
      },
      anthropic: {
        'claude-sonnet-4-20250514': 0.015,
        'claude-3-7-sonnet-20250219': 0.015,
        'claude-3-5-haiku-20241022': 0.0025,
      },
      gemini: {
        'gemini-2.5-flash': 0.00075,
        'gemini-2.5-pro': 0.0035,
        'gemini-1.5-pro': 0.007,
      },
      vertexai: {
        'gemini-1.5-pro': 0.007,
        'gemini-1.5-flash': 0.00075,
        'gemini-1.0-pro': 0.005,
      },
    };

    const providerCosts = costPer1KTokens[provider];
    if (!providerCosts || !providerCosts[model]) {
      return 0; // Unknown model, can't estimate
    }

    return (tokensUsed / 1000) * providerCosts[model];
  }

  async generateResponse(request: AiRequest): Promise<AiResponse> {
    const startTime = Date.now();
    const config = await this.getConfigForRequest(request.userId, request.configId);

    let response: AiResponse;

    try {
      switch (config.provider) {
        case 'openai':
        case 'azure_openai':
          response = await this.generateOpenAIResponse(config, request);
          break;
        case 'anthropic':
          response = await this.generateAnthropicResponse(config, request);
          break;
        case 'gemini':
        case 'vertexai':
          response = await this.generateGeminiResponse(config, request);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${config.provider}`);
      }

      response.responseTime = Date.now() - startTime;
      response.estimatedCost = this.estimateCost(config.provider, config.model, response.tokensUsed || 0);

      // Log usage
      await this.logUsage(config.id, request.userId, request.operation, response, true);

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log failed usage
      await this.logUsage(config.id, request.userId, request.operation, {
        tokensUsed: 0,
        estimatedCost: 0,
        responseTime,
      }, false, error instanceof Error ? error.message : 'Unknown error');

      throw error;
    }
  }

  private async generateOpenAIResponse(config: AiModelConfig, request: AiRequest): Promise<AiResponse> {
    const client = this.getOpenAIClient(config);

    const messages: any[] = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const response = await client.chat.completions.create({
      model: config.model,
      messages,
      temperature: 0.1,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      tokensUsed: response.usage?.total_tokens,
      responseTime: 0, // Will be set by caller
    };
  }

  private async generateAnthropicResponse(config: AiModelConfig, request: AiRequest): Promise<AiResponse> {
    const client = this.getAnthropicClient(config);

    const response = await client.messages.create({
      model: config.model,
      max_tokens: 4000,
      temperature: 0.1,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.prompt }],
    });

    return {
      content: response.content[0]?.type === 'text' ? response.content[0].text : '',
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
      responseTime: 0, // Will be set by caller
    };
  }

  private async generateGeminiResponse(config: AiModelConfig, request: AiRequest): Promise<AiResponse> {
    const client = this.getGeminiClient(config);

    const prompt = request.systemPrompt ? `${request.systemPrompt}\n\n${request.prompt}` : request.prompt;

    const response = await client.models.generateContent({
      model: config.model,
      contents: prompt,
    });

    return {
      content: response.text || '',
      tokensUsed: undefined, // Gemini doesn't provide token usage in this format
      responseTime: 0, // Will be set by caller
    };
  }

  private async logUsage(
    configId: string,
    userId: string,
    operation: string,
    response: Pick<AiResponse, 'tokensUsed' | 'estimatedCost' | 'responseTime'>,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const logData: InsertAiUsageLog = {
      userId,
      configId,
      operation,
      tokensUsed: response.tokensUsed || null,
      estimatedCost: response.estimatedCost?.toString() || null,
      responseTime: response.responseTime,
      success,
      errorMessage: errorMessage || null,
    };

    try {
      await storage.logAiUsage(logData);
    } catch (error) {
      console.error('Failed to log AI usage:', error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }

  // Helper methods for common operations
  async summarizeContent(content: string, userId: string, focus?: string, configId?: string): Promise<string> {
    const systemPrompt = `You are an expert research assistant. Your task is to create comprehensive, well-structured summaries of research content.

Guidelines:
- Create clear, informative summaries that capture key points and insights
- Use proper headings and bullet points for organization
- Include relevant details while maintaining readability
- Focus on actionable insights and important findings
${focus ? `- Pay special attention to: ${focus}` : ''}`;

    const prompt = `Please summarize the following content:\n\n${content}`;

    const response = await this.generateResponse({
      prompt,
      systemPrompt,
      userId,
      operation: 'summarize',
      configId,
    });

    return response.content;
  }

  async extractContentFromUrl(url: string, content: string, userId: string, configId?: string): Promise<{
    title: string;
    summary: string;
    keyPoints: string[];
  }> {
    const systemPrompt = `You are a content extraction specialist. Extract and structure key information from web content.

Return your response in JSON format with the following structure:
{
  "title": "Extracted or inferred title",
  "summary": "Brief summary of the content",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
}`;

    const prompt = `Extract key information from this web content:

URL: ${url}
Content: ${content}`;

    const response = await this.generateResponse({
      prompt,
      systemPrompt,
      userId,
      operation: 'extract',
      configId,
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        title: parsed.title || 'Untitled',
        summary: parsed.summary || '',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        title: 'Extracted Content',
        summary: response.content.substring(0, 500),
        keyPoints: [],
      };
    }
  }
}

export const aiService = new AiService();