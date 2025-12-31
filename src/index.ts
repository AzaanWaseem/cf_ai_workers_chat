/**
 * Cloudflare Workers Entry Point
 * 
 * This is the main entry point for the Cloudflare Worker that handles incoming
 * HTTP requests and routes them to the appropriate Agent (Durable Object).
 * 
 * The Worker receives chat messages from the frontend, creates or retrieves
 * a user-specific Agent instance, and forwards the message to that Agent.
 */

import { ChatAgent } from './agent';

// Environment bindings interface - defines what resources this Worker has access to
export interface Env {
	// CHAT_AGENT is a Durable Object namespace binding
	// It allows us to create and access Durable Object instances (Agents)
	CHAT_AGENT: DurableObjectNamespace;
	
	// AI is the Workers AI binding
	// This gives us access to Cloudflare's AI models (like Llama 3.3)
	AI: Ai;
}

export default {
	/**
	 * Main fetch handler - processes all incoming HTTP requests
	 */
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return handleCORS(request);
		}

		// Route: POST /api/chat - Main chat endpoint
		if (url.pathname === '/api/chat' && request.method === 'POST') {
			try {
				const body = await request.json() as { message: string; history?: any[]; userId?: string };
				
				// Use userId from request or generate a default one
				// In production, you'd want proper user authentication
				const userId = body.userId || 'default-user';

				// Create a unique Durable Object ID for this user
				// This ensures each user gets their own Agent with isolated conversation history
				const id = env.CHAT_AGENT.idFromName(userId);
				
				// Get the Durable Object stub (a reference to the Agent instance)
				const stub = env.CHAT_AGENT.get(id);
				
				// Create a new request for the Durable Object with the body data
				// We can't reuse the original request because the body has been read
				const doRequest = new Request(request.url, {
					method: 'POST',
					headers: request.headers,
					body: JSON.stringify(body),
				});
				
				// Forward the request to the Agent Durable Object
				// The Agent will handle the message processing and AI interaction
				const response = await stub.fetch(doRequest);
				
				// Add CORS headers to the response
				return addCORSHeaders(response, request);
			} catch (error) {
				console.error('Error processing chat request:', error);
				return addCORSHeaders(
					new Response(JSON.stringify({ error: 'Internal server error' }), {
						status: 500,
						headers: { 'Content-Type': 'application/json' },
					}),
					request
				);
			}
		}

		// Route: GET / - Health check endpoint
		if (url.pathname === '/' && request.method === 'GET') {
			return addCORSHeaders(
				new Response(JSON.stringify({ 
					status: 'ok', 
					service: 'Cloudflare AI Chat Worker',
					timestamp: new Date().toISOString()
				}), {
					headers: { 'Content-Type': 'application/json' },
				}),
				request
			);
		}

		// 404 for unknown routes
		return addCORSHeaders(
			new Response('Not Found', { status: 404 }),
			request
		);
	},
};

/**
 * Handle CORS preflight requests
 */
function handleCORS(request: Request): Response {
	const origin = request.headers.get('Origin') || '*';
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': origin,
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Max-Age': '86400',
		},
	});
}

/**
 * Add CORS headers to a response
 */
function addCORSHeaders(response: Response, request: Request): Response {
	const origin = request.headers.get('Origin') || '*';
	const newResponse = new Response(response.body, response);
	newResponse.headers.set('Access-Control-Allow-Origin', origin);
	newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
	return newResponse;
}

// Export the ChatAgent so Cloudflare Workers can instantiate it as a Durable Object
export { ChatAgent };
