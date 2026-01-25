import { createFileRoute } from "@tanstack/react-router";
import { createMcpHandler } from "@/mcp/handler";
import { createRagServer } from "@/mcp/services/rag";

const handler = createMcpHandler("rag", createRagServer);

export const Route = createFileRoute("/mcp/rag/message")({
	server: {
		handlers: {
			POST: ({ request }) => handler.handlePost(request),
			OPTIONS: () =>
				new Response(null, {
					status: 204,
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods": "POST, OPTIONS",
						"Access-Control-Allow-Headers":
							"Content-Type, Authorization, X-API-Key, X-Session-Id",
						"Access-Control-Max-Age": "86400",
					},
				}),
		},
	},
});
