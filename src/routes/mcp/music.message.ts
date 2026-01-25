import { createFileRoute } from "@tanstack/react-router";
import { createMcpHandler } from "@/mcp/handler";
import { createMusicServer } from "@/mcp/services/music";

const handler = createMcpHandler("music", createMusicServer);

export const Route = createFileRoute("/mcp/music/message")({
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
