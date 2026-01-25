import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apikey, apiUsage } from "@/db/schema";

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
		.from(apikey)
		.where(eq(apikey.key, keyValue))
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
			.update(apikey)
			.set({
				lastRequest: new Date(),
				requestCount:
					(
						await db
							.select()
							.from(apikey)
							.where(eq(apikey.id, context.apiKeyId))
					)[0].requestCount! + 1,
			})
			.where(eq(apikey.id, context.apiKeyId));
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

/**
 * Creates SSE transport for an MCP server connection
 */
export function createSSETransport(endpoint: string): {
	transport: SSEServerTransport;
	handleRequest: (req: Request) => Promise<Response>;
	handlePostMessage: (req: Request) => Promise<Response>;
} {
	const transport = new SSEServerTransport(endpoint, new Response());

	const handleRequest = async (req: Request): Promise<Response> => {
		// This creates the SSE stream response
		const stream = new ReadableStream({
			start(controller) {
				const encoder = new TextEncoder();

				// Send initial connection event
				controller.enqueue(encoder.encode("event: open\ndata: connected\n\n"));

				// Keep the connection alive with periodic pings
				const pingInterval = setInterval(() => {
					try {
						controller.enqueue(encoder.encode(": ping\n\n"));
					} catch {
						clearInterval(pingInterval);
					}
				}, 30000);

				// Store controller for sending messages later
				(
					transport as unknown as {
						_controller: ReadableStreamDefaultController;
					}
				)._controller = controller;
				(
					transport as unknown as {
						_pingInterval: ReturnType<typeof setInterval>;
					}
				)._pingInterval = pingInterval;
			},
			cancel() {
				const pingInterval = (
					transport as unknown as {
						_pingInterval: ReturnType<typeof setInterval>;
					}
				)._pingInterval;
				if (pingInterval) {
					clearInterval(pingInterval);
				}
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers":
					"Content-Type, Authorization, X-API-Key",
			},
		});
	};

	const handlePostMessage = async (req: Request): Promise<Response> => {
		try {
			const message = await req.json();

			// Process the message through the transport
			await transport.handleMessage(message);

			return new Response(JSON.stringify({ success: true }), {
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			});
		} catch (error) {
			return new Response(
				JSON.stringify({ error: "Failed to process message" }),
				{
					status: 500,
					headers: {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*",
					},
				},
			);
		}
	};

	return { transport, handleRequest, handlePostMessage };
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
