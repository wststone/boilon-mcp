import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
	createMcpHttpHandler,
	createSession,
	errorResponse,
	getSession,
	handleCORS,
	type McpContext,
	trackUsage,
	validateApiKey,
} from "./server";
import type { McpService } from "./types";

/**
 * Creates an MCP endpoint handler for a specific service
 * Uses Streamable HTTP transport pattern (Web API compatible)
 */
export function createMcpHandler(
	service: McpService,
	createServer: (organizationId: string, userId: string) => McpServer | Promise<McpServer>,
) {
	const { handleGet, handlePost } = createMcpHttpHandler();

	return {
		/**
		 * Handle GET request - establish SSE connection
		 */
		async handleGetRequest(request: Request): Promise<Response> {
			// Handle CORS preflight
			if (request.method === "OPTIONS") {
				return handleCORS();
			}

			// Validate API key
			const authResult = await validateApiKey(request);
			if (!authResult.valid) {
				return errorResponse(authResult.error || "Unauthorized", 401);
			}

			const organizationId = authResult.organizationId || "default";

			// Create context
			const context: McpContext = {
				apiKeyId: authResult.apiKeyId!,
				userId: authResult.userId!,
				organizationId: authResult.organizationId,
				service,
			};

			// Create MCP server for this session
			const server = await createServer(organizationId, authResult.userId!);

			// Track connection
			await trackUsage(context, "connection", 0);

			// Create session
			const session = createSession(server, context);

			// Return SSE stream
			return handleGet(request, session);
		},

		/**
		 * Handle POST request - process MCP message
		 */
		async handlePostRequest(request: Request): Promise<Response> {
			// Handle CORS preflight
			if (request.method === "OPTIONS") {
				return handleCORS();
			}

			// Get session ID from header or query param
			const url = new URL(request.url);
			const sessionId =
				request.headers.get("x-session-id") ||
				request.headers.get("mcp-session-id") ||
				url.searchParams.get("sessionId");

			if (!sessionId) {
				return errorResponse("Missing session ID", 400);
			}

			const session = getSession(sessionId);
			if (!session) {
				return errorResponse("Session not found or expired", 404);
			}

			return handlePost(request, session);
		},

		// Backward-compatible aliases
		handleGet(request: Request): Promise<Response> {
			return this.handleGetRequest(request);
		},
		handlePost(request: Request): Promise<Response> {
			return this.handlePostRequest(request);
		},
	};
}
