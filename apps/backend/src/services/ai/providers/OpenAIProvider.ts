import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { ILLMProvider } from './ILLMProvider.js';
import { AIChatMessage } from '../types.js';

export class OpenAIProvider implements ILLMProvider {
  private embeddingModel: OpenAIEmbeddings;
  private chatModel: ChatOpenAI;

  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.embeddingModel = new OpenAIEmbeddings({
      apiKey: apiKey,
      model: 'text-embedding-3-small',
    });

    this.chatModel = new ChatOpenAI({
      apiKey: apiKey,
      model: 'gpt-4.1-nano-2025-04-14', // Default
    });
  }

  async generateResponse(
    messages: AIChatMessage[],
    config: { temperature: number; model: string }
  ): Promise<string> {
    // Create a model instance with specific config for this request
    // This is safer than trying to override call options which might change across versions
    const chat = new ChatOpenAI({
      apiKey: this.apiKey,
      model: config.model,
      temperature: config.temperature,
    });

    const formattedMessages = messages.map((msg) => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content);
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        default:
          throw new Error(`Unknown role: ${(msg as any).role}`);
      }
    });

    const response = await chat.invoke(formattedMessages);

    // Handle response content which can be string or MessageContentComplex[]
    if (typeof response.content === 'string') {
      return response.content;
    }
    
    // If content is array (e.g. multimodal), join text parts
    if (Array.isArray(response.content)) {
      return response.content
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('');
    }

    return String(response.content);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Replace newlines to improve embedding quality
    const cleanText = text.replace(/\n/g, ' ');
    return await this.embeddingModel.embedQuery(cleanText);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Replace newlines in all texts
    const cleanTexts = texts.map(text => text.replace(/\n/g, ' '));
    return await this.embeddingModel.embedDocuments(cleanTexts);
  }
}