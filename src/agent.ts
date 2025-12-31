/**
 * ChatAgent - Durable Object Agent Implementation
 * 
 * WHAT IS AN AGENT?
 * An Agent in the Cloudflare Agents SDK is a stateful, intelligent entity that:
 * - Maintains conversation history and context
 * - Processes messages and generates responses using AI
 * - Persists state across multiple requests
 * - Can be extended with tools and custom capabilities
 * 
 * WHY DURABLE OBJECTS?
 * Durable Objects provide:
 * - Strong consistency: Each user's conversation is handled by a single instance
 * - State persistence: Conversation history survives across requests
 * - Isolation: Each user gets their own Agent instance with separate state
 * - Global uniqueness: Each Durable Object has a unique ID (based on userId)
 * 
 * HOW STATE/MEMORY WORKS:
 * - Agent.state provides built-in persistent storage
 * - this.setState() saves conversation messages to durable storage
 * - Messages persist even if the Worker is redeployed or restarted
 * - Each Agent instance maintains its own isolated conversation history
 */

import { DurableObject } from 'cloudflare:workers';

// Interface for messages in our conversation
interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

// Interface for the Agent's persisted state
interface AgentState {
	messages: ChatMessage[];
	userId: string;
	createdAt: string;
}

/**
 * ChatAgent - A Durable Object that handles AI conversations
 * 
 * This Agent:
 * 1. Stores conversation history in Durable Object storage
 * 2. Processes incoming user messages
 * 3. Sends conversation context to Workers AI (Llama 3.3)
 * 4. Returns AI responses to the frontend
 * 5. Saves AI responses back to storage
 */
export class ChatAgent extends DurableObject {
	private messages: ChatMessage[] = [];
	private userId: string = '';

	/**
	 * Constructor - called when the Durable Object is first created
	 * Initializes the Agent and loads any existing state from storage
	 */
	constructor(ctx: DurableObjectState, env: any) {
		super(ctx, env);
		this.initializeState();
	}

	/**
	 * Load conversation history from Durable Object storage
	 * This runs when the Agent is first instantiated
	 */
	private async initializeState() {
		const state = await this.ctx.storage.get<AgentState>('agentState');
		
		if (state) {
			// Restore previous conversation
			this.messages = state.messages || [];
			this.userId = state.userId || '';
			console.log(`Agent restored for user ${this.userId} with ${this.messages.length} messages`);
		} else {
			// New conversation - initialize with a system prompt
			this.messages = [
				{
					role: 'system',
					content: 'You are a helpful AI assistant. Be concise, friendly, and informative in your responses.',
				},
			];
			console.log('New Agent initialized');
		}
	}

	/**
	 * Save current state to Durable Object storage
	 * This persists the conversation across requests and deployments
	 */
	private async saveState() {
		const state: AgentState = {
			messages: this.messages,
			userId: this.userId,
			createdAt: new Date().toISOString(),
		};
		await this.ctx.storage.put('agentState', state);
	}

	/**
	 * Main fetch handler for the Agent
	 * Processes incoming chat messages and returns AI responses
	 */
	async fetch(request: Request): Promise<Response> {
		// Parse the incoming request
		const body = await request.json() as { 
			message: string; 
			history?: any[]; 
			userId?: string;
		};

		const userMessage = body.message;
		const userId = body.userId || 'default-user';
		
		if (!this.userId) {
			this.userId = userId;
		}

		try {
			// Step 1: Add user's message to conversation history
			this.messages.push({
				role: 'user',
				content: userMessage,
			});

			// Step 2: Call Workers AI with the full conversation context
			// We send all previous messages so the AI understands the context
			const aiResponse = await this.callWorkersAI(this.messages);

			// Step 3: Add AI's response to conversation history
			this.messages.push({
				role: 'assistant',
				content: aiResponse,
			});

			// Step 4: Save the updated conversation to Durable Object storage
			await this.saveState();

			// Step 5: Return response to frontend
			return new Response(
				JSON.stringify({ 
					message: aiResponse,
					messageCount: this.messages.length - 1, // Exclude system message
				}),
				{
					headers: { 'Content-Type': 'application/json' },
				}
			);
		} catch (error) {
			console.error('Error processing message:', error);
			return new Response(
				JSON.stringify({ 
					error: 'Failed to process message',
					details: error instanceof Error ? error.message : 'Unknown error'
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}
	}

	/**
	 * Call Workers AI to generate a response
	 * Uses Llama 3.3 (70B) model via Cloudflare Workers AI
	 */
	private async callWorkersAI(messages: ChatMessage[]): Promise<string> {
		// Access the Workers AI binding from the environment
		const ai = (this.env as any).AI as Ai;

		if (!ai) {
			throw new Error('AI binding not found. Make sure Workers AI is configured in wrangler.toml');
		}

		try {
			// Call the Llama 3.3 model with the conversation history
			// Workers AI supports various models - we're using Meta's Llama 3.3 70B
			const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
				messages: messages.map(msg => ({
					role: msg.role,
					content: msg.content,
				})),
				// Optional parameters for controlling the AI's behavior
				stream: false, // We're not streaming in this implementation
				max_tokens: 1024, // Maximum length of response
				temperature: 0.7, // Controls randomness (0 = deterministic, 1 = creative)
			}) as any;

			// Extract the assistant's response from the AI output
			if (response && response.response) {
				return response.response;
			} else {
				throw new Error('Invalid response from Workers AI');
			}
		} catch (error) {
			console.error('Workers AI error:', error);
			throw new Error(`AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Optional: Clear conversation history
	 * This could be called via a separate endpoint if you want to add a "Clear Chat" feature
	 */
	async clearHistory(): Promise<void> {
		this.messages = [
			{
				role: 'system',
				content: 'You are a helpful AI assistant. Be concise, friendly, and informative in your responses.',
			},
		];
		await this.saveState();
	}

	/**
	 * Optional: Get conversation history
	 * Useful for debugging or displaying chat history to users
	 */
	async getHistory(): Promise<ChatMessage[]> {
		return this.messages.filter(msg => msg.role !== 'system');
	}
}
