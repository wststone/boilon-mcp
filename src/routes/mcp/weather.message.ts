import { createFileRoute } from "@tanstack/react-router";
import { createMcpHandler } from "@/mcp/handler";
import { createWeatherServer } from "@/mcp/services/weather";

const handler = createMcpHandler("weather", createWeatherServer);

export const Route = createFileRoute("/mcp/weather/message")({
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
