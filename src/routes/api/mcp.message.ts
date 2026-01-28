import { createFileRoute } from "@tanstack/react-router";
import { createMcpHandler } from "@/mcp/handler";
import { createUnifiedServer } from "@/mcp/services/unified";

const handler = createMcpHandler("unified", createUnifiedServer);

export const Route = createFileRoute("/api/mcp/message")({
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
							"Content-Type, Authorization, X-API-Key, X-Session-Id, Mcp-Session-Id",
						"Access-Control-Max-Age": "86400",
					},
				}),
		},
	},
});
