import { createFileRoute } from "@tanstack/react-router";
import { createMcpHandler } from "@/mcp/handler";
import { createMusicServer } from "@/mcp/services/music";

const handler = createMcpHandler("music", createMusicServer);

export const Route = createFileRoute("/mcp/music")({
	server: {
		handlers: {
			GET: ({ request }) => handler.handleGet(request),
			POST: ({ request }) => handler.handlePost(request),
			OPTIONS: () =>
				new Response(null, {
					status: 204,
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
						"Access-Control-Allow-Headers":
							"Content-Type, Authorization, X-API-Key, X-Session-Id",
						"Access-Control-Max-Age": "86400",
					},
				}),
		},
	},
});
