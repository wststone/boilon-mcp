import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
	errorResponse,
	handleCORS,
	type McpContext,
	trackUsage,
	validateApiKey,
} from "./server";
import type { McpService } from "./types";

// Store active transports keyed by session ID
const activeTransports = new Map<
	string,
	{ transport: SSEServerTransport; server: McpServer; context: McpContext }
>();

/**
 * Creates an MCP endpoint handler for a specific service
 */
export function createMcpHandler(
	service: McpService,
	createServer: (organizationId: string) => McpServer,
) {
	return {
		/**
		 * Handle GET request - establish SSE connection
		 */
		async handleGet(request: Request): Promise<Response> {
			// Handle CORS preflight
			if (request.method === "OPTIONS") {
				return handleCORS();
			}

			// Validate API key
			const authResult = await validateApiKey(request);
			if (!authResult.valid) {
				return errorResponse(authResult.error || "Unauthorized", 401);
			}

			// Create session ID
			const sessionId = crypto.randomUUID();
			const organizationId = authResult.organizationId || "default";

			// Create context
			const context: McpContext = {
				apiKeyId: authResult.apiKeyId!,
				userId: authResult.userId!,
				organizationId: authResult.organizationId,
				service,
			};

			// Create MCP server for this session
			const server = createServer(organizationId);

			// Track connection
			await trackUsage(context, "connection", 0);

			// Create SSE transport
			const url = new URL(request.url);
			const transport = new SSEServerTransport(
				`${url.pathname}/message`,
				new Response(),
			);

			// Store for message handling
			activeTransports.set(sessionId, { transport, server, context });

			// Connect server to transport
			await server.connect(transport);

			// Create SSE response
			const stream = new ReadableStream({
				start(controller) {
					const encoder = new TextEncoder();

					// Send session ID first
					controller.enqueue(
						encoder.encode(`event: session\ndata: ${sessionId}\n\n`),
					);

					// Set up transport to write to this stream
					const originalSend = transport.send.bind(transport);
					transport.send = async (message) => {
						try {
							controller.enqueue(
								encoder.encode(
									`event: message\ndata: ${JSON.stringify(message)}\n\n`,
								),
							);
						} catch (e) {
							// Stream closed
						}
						return originalSend(message);
					};

					// Keep alive ping every 30 seconds
					const pingInterval = setInterval(() => {
						try {
							controller.enqueue(encoder.encode(": ping\n\n"));
						} catch {
							clearInterval(pingInterval);
							activeTransports.delete(sessionId);
						}
					}, 30000);

					// Clean up on close
					const cleanup = () => {
						clearInterval(pingInterval);
						activeTransports.delete(sessionId);
					};

					// Store cleanup function
					(transport as { _cleanup?: () => void })._cleanup = cleanup;
				},
				cancel() {
					const entry = activeTransports.get(sessionId);
					if (entry) {
						const cleanup = (entry.transport as { _cleanup?: () => void })
							._cleanup;
						if (cleanup) cleanup();
					}
					activeTransports.delete(sessionId);
				},
			});

			return new Response(stream, {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Connection: "keep-alive",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers":
						"Content-Type, Authorization, X-API-Key",
					"X-Session-Id": sessionId,
				},
			});
		},

		/**
		 * Handle POST request - process MCP message
		 */
		async handlePost(request: Request): Promise<Response> {
			// Handle CORS preflight
			if (request.method === "OPTIONS") {
				return handleCORS();
			}

			// Get session ID from header or query param
			const url = new URL(request.url);
			const sessionId =
				request.headers.get("x-session-id") ||
				url.searchParams.get("sessionId");

			if (!sessionId) {
				return errorResponse("Missing session ID", 400);
			}

			const entry = activeTransports.get(sessionId);
			if (!entry) {
				return errorResponse("Session not found or expired", 404);
			}

			try {
				const message = await request.json();

				// Track tool usage if this is a tool call
				if (message.method === "tools/call" && message.params?.name) {
					await trackUsage(entry.context, message.params.name, 0);
				}

				// Process message through transport
				await entry.transport.handleMessage(message);

				return new Response(JSON.stringify({ success: true }), {
					headers: {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*",
					},
				});
			} catch (error) {
				console.error("Error processing MCP message:", error);
				return errorResponse("Failed to process message", 500);
			}
		},
	};
}
