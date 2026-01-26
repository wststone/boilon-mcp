import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apikeys, apiUsage } from "@/db/schema";

export interface McpContext {
	apiKeyId: string;
	userId: string;
	organizationId?: string;
	service: string;
}

export interface AuthResult {
	valid: boolean;
	apiKeyId?: string;
	userId?: string;
	organizationId?: string;
	error?: string;
}

/**
 * Validates an API key from the request headers
 */
export async function validateApiKey(request: Request): Promise<AuthResult> {
	// Check Authorization header (Bearer token)
	const authHeader = request.headers.get("authorization");
	const xApiKey = request.headers.get("x-api-key");

	let keyValue: string | null = null;

	if (authHeader?.startsWith("Bearer ")) {
		keyValue = authHeader.slice(7);
	} else if (xApiKey) {
		keyValue = xApiKey;
	}

	if (!keyValue) {
		return { valid: false, error: "Missing API key" };
	}

	// Look up the API key in the database
	const [keyRecord] = await db
		.select()
		.from(apikeys)
		.where(eq(apikeys.key, keyValue))
		.limit(1);

	if (!keyRecord) {
		return { valid: false, error: "Invalid API key" };
	}

	if (!keyRecord.enabled) {
		return { valid: false, error: "API key is disabled" };
	}

	if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
		return { valid: false, error: "API key has expired" };
	}

	// Check rate limit if enabled
	if (keyRecord.rateLimitEnabled && keyRecord.rateLimitMax) {
		const now = Date.now();
		const windowMs = (keyRecord.rateLimitTimeWindow || 60) * 1000;
		const lastRequest = keyRecord.lastRequest?.getTime() || 0;

		if (now - lastRequest < windowMs) {
			if ((keyRecord.remaining || 0) <= 0) {
				return { valid: false, error: "Rate limit exceeded" };
			}
		}
	}

	// Parse metadata for organization info
	let organizationId: string | undefined;
	if (keyRecord.metadata) {
		try {
			const metadata = JSON.parse(keyRecord.metadata);
			organizationId = metadata.organizationId;
		} catch {
			// Ignore parse errors
		}
	}

	return {
		valid: true,
		apiKeyId: keyRecord.id,
		userId: keyRecord.userId,
		organizationId,
	};
}

/**
 * Tracks API usage for analytics
 */
export async function trackUsage(
	context: McpContext,
	tool: string,
	tokensUsed = 0,
): Promise<void> {
	try {
		await db.insert(apiUsage).values({
			apiKeyId: context.apiKeyId,
			organizationId: context.organizationId || null,
			service: context.service,
			tool,
			requestCount: 1,
			tokensUsed,
			timestamp: new Date(),
		});

		// Update last request time on API key
		await db
			.update(apikeys)
			.set({
				lastRequest: new Date(),
				requestCount:
					(
						await db
							.select()
							.from(apikeys)
							.where(eq(apikeys.id, context.apiKeyId))
					)[0].requestCount! + 1,
			})
			.where(eq(apikeys.id, context.apiKeyId));
	} catch (error) {
		console.error("Failed to track usage:", error);
	}
}

/**
 * Creates a base MCP server with common configuration
 */
export function createMcpServer(
	name: string,
	version: string,
): { server: McpServer } {
	const server = new McpServer({
		name,
		version,
	});

	return { server };
}

// Session storage for MCP connections
export type McpSession = {
	id: string;
	server: McpServer;
	context: McpContext;
	messageQueue: Array<unknown>;
	sendMessage: ((message: unknown) => void) | null;
};

const sessions: Map<string, McpSession> = new Map();

/**
 * Creates a new MCP session
 */
export function createSession(
	server: McpServer,
	context: McpContext,
): McpSession {
	const sessionId = randomUUID();
	const session: McpSession = {
		id: sessionId,
		server,
		context,
		messageQueue: [],
		sendMessage: null,
	};
	sessions.set(sessionId, session);
	return session;
}

/**
 * Gets an existing session by ID
 */
export function getSession(sessionId: string): McpSession | undefined {
	return sessions.get(sessionId);
}

/**
 * Removes a session
 */
export function removeSession(sessionId: string): void {
	sessions.delete(sessionId);
}

/**
 * Creates Streamable HTTP transport handler for MCP
 * Compatible with Web Request/Response APIs
 */
export function createMcpHttpHandler(): {
	handleGet: (
		request: Request,
		session: McpSession,
	) => Response;
	handlePost: (
		request: Request,
		session: McpSession,
	) => Promise<Response>;
} {
	const handleGet = (request: Request, session: McpSession): Response => {
		// Create SSE stream for server-to-client messages
		const stream = new ReadableStream({
			start(controller) {
				const encoder = new TextEncoder();

				// Send session ID
				controller.enqueue(
					encoder.encode(`event: session\ndata: ${session.id}\n\n`),
				);

				// Send any queued messages
				for (const msg of session.messageQueue) {
					controller.enqueue(
						encoder.encode(`event: message\ndata: ${JSON.stringify(msg)}\n\n`),
					);
				}
				session.messageQueue = [];

				// Store send function for later use
				session.sendMessage = (message: unknown) => {
					try {
						controller.enqueue(
							encoder.encode(`event: message\ndata: ${JSON.stringify(message)}\n\n`),
						);
					} catch {
						// Stream closed
						session.sendMessage = null;
					}
				};

				// Keep alive ping every 30 seconds
				const pingInterval = setInterval(() => {
					try {
						controller.enqueue(encoder.encode(": ping\n\n"));
					} catch {
						clearInterval(pingInterval);
						session.sendMessage = null;
					}
				}, 30000);

				// Clean up on abort
				request.signal?.addEventListener("abort", () => {
					clearInterval(pingInterval);
					session.sendMessage = null;
					removeSession(session.id);
				});
			},
			cancel() {
				session.sendMessage = null;
				removeSession(session.id);
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache, no-store, must-revalidate",
				Connection: "keep-alive",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers":
					"Content-Type, Authorization, X-API-Key, Mcp-Session-Id, X-Session-Id",
				"Mcp-Session-Id": session.id,
				"X-Session-Id": session.id,
			},
		});
	};

	const handlePost = async (
		request: Request,
		session: McpSession,
	): Promise<Response> => {
		try {
			const message = await request.json();

			// Track tool usage if this is a tool call
			if (message.method === "tools/call" && message.params?.name) {
				await trackUsage(session.context, message.params.name, 0);
			}

			// Process message through the server
			// The server will send responses back through the session's sendMessage
			// For now, we acknowledge receipt
			// In a full implementation, you'd process through the transport

			return new Response(JSON.stringify({ success: true }), {
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"Mcp-Session-Id": session.id,
				},
			});
		} catch {
			return errorResponse("Failed to process message", 500);
		}
	};

	return { handleGet, handlePost };
}

/**
 * Handles CORS preflight requests
 */
export function handleCORS(): Response {
	return new Response(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
			"Access-Control-Max-Age": "86400",
		},
	});
}

/**
 * Creates an error response
 */
export function errorResponse(message: string, status = 400): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
		},
	});
}
