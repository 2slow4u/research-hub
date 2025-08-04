import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface SummaryRequest {
  content: string[];
  keywords: string[];
  focus?: string;
  type: 'full' | 'differential';
  previousSummary?: string;
}

export interface SummaryResponse {
  title: string;
  content: string;
  keyPoints: string[];
  sources: number;
}

export class OpenAIService {
  async generateSummary(request: SummaryRequest): Promise<SummaryResponse> {
    try {
      const { content, keywords, focus, type, previousSummary } = request;
      
      let prompt = '';
      
      if (type === 'full') {
        prompt = `Create a comprehensive research summary based on the following content items. 
        
Keywords to focus on: ${keywords.join(', ')}
${focus ? `Special focus areas: ${focus}` : ''}

Content items to summarize:
${content.join('\n\n---\n\n')}

Please provide a JSON response with the following structure:
{
  "title": "A descriptive title for the summary",
  "content": "A detailed summary in markdown format suitable for blog post preparation",
  "keyPoints": ["Array of key findings or insights"],
  "sources": ${content.length}
}

The summary should be comprehensive, well-structured, and suitable for academic or professional research documentation.`;
      } else {
        prompt = `Create a differential summary comparing new research content against a previous summary.

Keywords to focus on: ${keywords.join(', ')}
${focus ? `Special focus areas: ${focus}` : ''}

Previous summary:
${previousSummary || 'No previous summary available'}

New content to analyze:
${content.join('\n\n---\n\n')}

Please provide a JSON response with the following structure:
{
  "title": "A title highlighting the key changes or new developments",
  "content": "A detailed analysis of new developments and changes since the last summary, in markdown format",
  "keyPoints": ["Array of key new findings, changes, or developments"],
  "sources": ${content.length}
}

Focus on what's new, what has changed, and emerging trends since the previous summary.`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert research analyst who creates comprehensive, well-structured summaries for academic and professional use. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        title: result.title || 'Research Summary',
        content: result.content || 'Summary could not be generated.',
        keyPoints: result.keyPoints || [],
        sources: result.sources || content.length,
      };
    } catch (error) {
      console.error("Error generating summary:", error);
      throw new Error("Failed to generate summary using AI");
    }
  }

  async enhanceContent(content: string, keywords: string[]): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a research content processor. Enhance and structure the given content while maintaining accuracy."
          },
          {
            role: "user",
            content: `Enhance this research content by improving readability and structure while preserving all important information:

Keywords: ${keywords.join(', ')}

Content:
${content}

Return the enhanced content in a clean, readable format.`
          }
        ],
        temperature: 0.2,
      });

      return response.choices[0].message.content || content;
    } catch (error) {
      console.error("Error enhancing content:", error);
      return content; // Return original content if enhancement fails
    }
  }

  async extractKeywords(content: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Extract relevant research keywords from the given content. Respond with JSON containing an array of keywords."
          },
          {
            role: "user",
            content: `Extract 5-10 relevant keywords from this content:

${content}

Respond with JSON: {"keywords": ["keyword1", "keyword2", ...]}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"keywords": []}');
      return result.keywords || [];
    } catch (error) {
      console.error("Error extracting keywords:", error);
      return [];
    }
  }
}

export const openaiService = new OpenAIService();
