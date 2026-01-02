import { ILLMProvider } from './providers/ILLMProvider.js';
import { IVectorStore } from './vector/IVectorStore.js';
import { DocumentProcessor } from './knowledge/DocumentProcessor.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { PgVectorStore } from './vector/PgVectorStore.js';
import { AIChatMessage } from './types.js';
import { prisma } from '../../utils/database.js';
import { settingsCache, CACHE_KEYS, CACHE_TTL } from '../settings-cache.js';
import { logger } from '../../utils/logger.js';
import type { OpenAISettings } from '../../types/admin-settings.js';
import { assignmentService } from '../assignment-service.js';
import type { ConversationType } from '@prisma/client';

/**
 * AIOrchestrator
 * 
 * Orchestrates AI operations including document processing and message handling.
 * 
 * Settings Priority:
 * 1. Database settings (cached with TTL)
 * 2. Environment variables (.env fallback)
 * 
 * Requirements: 6.3, 6.4 - Check database first, fallback to .env, cache with TTL
 */
export class AIOrchestrator {
  private llmProvider: ILLMProvider | null = null;
  private vectorStore: IVectorStore;
  private docProcessor: DocumentProcessor;
  private lastApiKeyHash: string = '';

  constructor() {
    // Initialize with env API key as fallback, will be updated from DB on first use
    // Note: We don't set lastApiKeyHash here so DB settings will always be applied
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.llmProvider = new OpenAIProvider(apiKey);
      // Don't set lastApiKeyHash - let DB settings override on first refresh
    }
    this.vectorStore = new PgVectorStore();
    this.docProcessor = new DocumentProcessor();
  }

  /**
   * Generate a hash for API key comparison using full key
   */
  private hashKey(key: string): string {
    // Use simple hash of full key for accurate comparison
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Refresh OpenAI settings from database with caching
   * Requirements: 6.3, 6.4
   */
  private async refreshSettingsFromDb(): Promise<void> {
    try {
      // Check cache first
      const cachedSettings = settingsCache.get<OpenAISettings>(CACHE_KEYS.openai());
      
      if (cachedSettings) {
        console.log('🤖 AI Orchestrator: Using cached OpenAI settings');
        this.updateProvider(cachedSettings);
        return;
      }

      // Fetch from database using dynamic import to avoid circular dependency
      const { adminSettingsService } = await import('../admin/settings-service.js');
      const response = await adminSettingsService.getSettings<OpenAISettings>('openai', false);
      
      console.log('🤖 AI Orchestrator: Fetched OpenAI settings', { 
        source: response.source,
        hasApiKey: !!response.data.apiKey,
        apiKeyPreview: response.data.apiKey ? response.data.apiKey.slice(0, 10) + '...' + response.data.apiKey.slice(-4) : 'none'
      });
      
      // Cache the settings
      settingsCache.set(CACHE_KEYS.openai(), response.data, CACHE_TTL.settings);
      
      // Update provider with database settings (always prioritize DB over env)
      this.updateProvider(response.data, true);
      logger.info('OpenAI settings refreshed from database', { source: response.source });
    } catch (error) {
      console.error('🤖 AI Orchestrator: Failed to refresh OpenAI settings', error);
      logger.warn('Failed to refresh OpenAI settings from database, using current config', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Continue with existing provider (env fallback)
    }
  }

  /**
   * Update LLM provider with new API key if changed
   * @param settings - OpenAI settings
   * @param forceUpdate - Force update even if hash matches (for DB priority)
   */
  private updateProvider(settings: OpenAISettings, forceUpdate: boolean = false): void {
    const apiKey = settings.apiKey;
    
    if (!apiKey || apiKey.includes('****')) {
      // No valid API key in settings, keep current provider
      return;
    }

    const newHash = this.hashKey(apiKey);
    
    // Always update if forceUpdate is true (DB settings should override env)
    // Or update if hash is different
    if (forceUpdate || newHash !== this.lastApiKeyHash) {
      console.log('🤖 AI Orchestrator: Updating provider with new API key', {
        forceUpdate,
        hashChanged: newHash !== this.lastApiKeyHash,
        apiKeyPreview: apiKey.slice(0, 10) + '...' + apiKey.slice(-4)
      });
      this.llmProvider = new OpenAIProvider(apiKey);
      this.lastApiKeyHash = newHash;
      logger.info('OpenAI provider updated with new API key');
    }
  }

  /**
   * Ensure LLM provider is initialized with latest settings
   */
  private async ensureProvider(): Promise<ILLMProvider> {
    await this.refreshSettingsFromDb();
    
    if (!this.llmProvider) {
      // Last resort: try env
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set');
      }
      this.llmProvider = new OpenAIProvider(apiKey);
      this.lastApiKeyHash = this.hashKey(apiKey);
    }
    
    return this.llmProvider;
  }

  /**
   * Invalidate settings cache (call when settings are updated)
   */
  invalidateCache(): void {
    settingsCache.invalidate(CACHE_KEYS.openai());
    logger.info('OpenAI settings cache invalidated');
  }

  async processAndStoreDocument(
    documentId: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<void> {
    // Ensure provider is initialized with latest settings
    const provider = await this.ensureProvider();

    // 1. Extract Text
    let chunks: string[] = [];
    if (mimeType === 'application/pdf') {
      chunks = await this.docProcessor.processPdf(fileBuffer);
    } else {
      throw new Error(`Unsupported mime type: ${mimeType}`);
    }

    // 2. Generate Embeddings & Store (Batched)
    try {
      // Process in batches of 20 to avoid hitting rate limits too hard but still faster than sequential
      const BATCH_SIZE = 20;

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);

        // Generate embeddings for the batch
        const vectors = await provider.generateEmbeddings(batch);

        // Store each document in the batch (sequentially for DB stability, or parallel if safe)
        // Parallelizing DB inserts
        await Promise.all(batch.map((content, index) => {
          return this.vectorStore.addDocument(documentId, content, vectors[index], {
            chunkIndex: i + index,
          });
        }));
      }
    } catch (error) {
      console.error('Error generating/storing embeddings:', error);
      throw error;
    }

    // 3. Update Document Status
    await (prisma as any).knowledgeDocument.update({
      where: { id: documentId },
      data: { status: 'COMPLETED' },
    });
  }

  /**
   * Handle incoming message and generate AI response
   * 
   * @param userId - The business owner's user ID
   * @param userMessage - The incoming message content
   * @param customerId - Optional customer ID for conversation history
   * @param aiAgentIdOverride - Optional AI Agent ID to use instead of default active agent
   *                           When provided, uses this specific AI Agent's configuration
   *                           (system prompt, knowledge documents) for response generation
   * Requirements: 3.3, 3.4
   */
  async handleMessage(
    userId: string,
    userMessage: string,
    customerId?: string,
    aiAgentIdOverride?: string
  ): Promise<string | null> {
    console.log(`🤖 AI Orchestrator: Handling message for user ${userId}`, {
      hasAiAgentOverride: !!aiAgentIdOverride,
      aiAgentIdOverride,
    });

    // 1. Check Config
    const config = await prisma.aIConfig.findUnique({
      where: { userId },
    })

    if (!config) {
      console.log('🤖 AI Orchestrator: No config found for user');
      return null
    }

    if (!config.enabled) {
      console.log('🤖 AI Orchestrator: AI disabled');
      return null
    }

    // 1.2 Determine which AI Agent to use (Requirement 3.3, 3.4)
    // If aiAgentIdOverride is provided, use that specific AI Agent
    // Otherwise, use the default active agent from AIConfig
    const agentIdToUse = aiAgentIdOverride || config.activeAgentId;

    if (!agentIdToUse) {
      console.log('🤖 AI Orchestrator: No AI agent specified (no override and no active agent)');
      return null
    }

    // 1.3 Get the AI Agent (either override or default)
    const activeAgent = await prisma.aIAgent.findUnique({
      where: { id: agentIdToUse, userId },
      include: { knowledgeDocuments: { select: { id: true } } },
    })

    if (!activeAgent) {
      console.log(`🤖 AI Orchestrator: AI Agent with ID ${agentIdToUse} not found`, {
        isOverride: !!aiAgentIdOverride,
      });
      return null
    }

    console.log(`🤖 AI Orchestrator: Using AI Agent "${activeAgent.name}" (ID: ${activeAgent.id})`, {
      isOverride: !!aiAgentIdOverride,
    });

    // 1.5 Check Filter Words
    if (config.filterWords && Array.isArray(config.filterWords) && config.filterWords.length > 0) {
      const lowerMessage = userMessage.toLowerCase();
      const hasForbiddenWord = (config.filterWords as string[]).some(word =>
        lowerMessage.includes(word.toLowerCase())
      );

      if (hasForbiddenWord) {
        console.log('🤖 AI Orchestrator: Message blocked by filter');
        // Optionally return a canned response or null to ignore.
        // Returning null ignores it (no reply).
        return null;
      }
    }

    // Ensure provider is initialized with latest settings
    const provider = await this.ensureProvider();

    console.log('🤖 AI Orchestrator: Generating embedding...');

    // 2. Retrieve Context (RAG)
    const documentIds = activeAgent.knowledgeDocuments.map(doc => doc.id)
    let contextText = ''

    if (documentIds.length > 0) {
      const queryEmbedding = await provider.generateEmbedding(userMessage);
      const relevantDocs = await this.vectorStore.similaritySearch(
        queryEmbedding,
        3,
        0.5,
        documentIds
      );
      contextText = relevantDocs.map(d => d.content).join('\n\n');
    }

    // 3. Construct Prompt
    const systemPrompt = `${activeAgent.systemPrompt}\n\nRelevant Context:\n${contextText}`;

    const messages: AIChatMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    // 3.5 Fetch Conversation History (Contextual AI)
    if (customerId) {
      console.log(`🤖 AI Orchestrator: Fetching conversation history for customer ${customerId}...`);

      const history = await prisma.message.findMany({
        where: {
          customerId,
          messageType: 'TEXT', // Only include text messages for context
          content: { not: null }, // Exclude messages without content
        },
        orderBy: { timestamp: 'desc' },
        take: 10, // Last 10 messages
      });

      console.log(`🤖 AI Orchestrator: Found ${history.length} historical messages`);

      // Format and add history messages (reverse to chronological order)
      history.reverse().forEach(msg => {
        if (msg.content) {
          messages.push({
            role: msg.direction === 'INBOUND' ? 'user' : 'assistant',
            content: msg.content,
          });
        }
      });
    } else {
      console.log('🤖 AI Orchestrator: No customerId provided, skipping conversation history');
    }

    // 4. Always add the current user message at the end
    messages.push({ role: 'user', content: userMessage });

    console.log(`🤖 AI Orchestrator: Generating response using model ${config.model}...`);

    // 5. Generate Response
    const response = await provider.generateResponse(messages, {
      temperature: config.temperature,
      model: config.model,
    });

    console.log('🤖 AI Orchestrator: Response generated');
    return response;
  }

  /**
   * Handle incoming message with assignment check
   * 
   * Checks the conversation's assignment status before generating AI response.
   * - If assigned to human → return null (skip AI response)
   * - If assigned to AI Agent → use that AI Agent's configuration
   * - If unassigned with AI enabled → use default AI Agent
   * 
   * @param userId - The business owner's user ID
   * @param userMessage - The incoming message content
   * @param conversationId - The conversation ID (Customer ID for WhatsApp, IGConversation ID for Instagram)
   * @param conversationType - The conversation type (WHATSAPP or INSTAGRAM)
   * @param customerId - Optional customer ID for conversation history
   * @returns AI response or null if AI should not respond
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  async handleMessageWithAssignmentCheck(
    userId: string,
    userMessage: string,
    conversationId: string,
    conversationType: ConversationType,
    customerId?: string
  ): Promise<string | null> {
    console.log(`🤖 AI Orchestrator: Handling message with assignment check`, {
      userId,
      conversationId,
      conversationType,
    });

    // 1. Check if AI should respond based on assignment status (Requirement 6.1)
    const decision = await assignmentService.shouldAIRespond(
      conversationId,
      conversationType,
      userId
    );

    // 2. Log the decision for debugging (Requirement 6.5)
    logger.info('AI response decision', {
      conversationId,
      conversationType,
      shouldRespond: decision.shouldRespond,
      reason: decision.reason,
      aiAgentId: decision.aiAgentId,
      aiAgentName: decision.aiAgentName,
    });

    console.log(`🤖 AI Orchestrator: AI response decision`, {
      shouldRespond: decision.shouldRespond,
      reason: decision.reason,
      aiAgentId: decision.aiAgentId,
      aiAgentName: decision.aiAgentName,
    });

    // 3. If should not respond, return null (Requirement 6.2)
    if (!decision.shouldRespond) {
      console.log(`🤖 AI Orchestrator: Skipping AI response - ${decision.reason}`);
      return null;
    }

    // 4. If should respond, call handleMessage with aiAgentId (Requirement 6.3, 6.4)
    // Pass the aiAgentId from the decision to use the correct AI Agent configuration
    return this.handleMessage(
      userId,
      userMessage,
      customerId,
      decision.aiAgentId ?? undefined
    );
  }
}