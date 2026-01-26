import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import { getSessionFromRequest, verifyApiKeyFromRequest } from "./utils";

// ============================================
// API Auth Middleware (for request handlers)
// Supports both API key and session authentication
// ============================================

export const apiAuthMiddleware = createMiddleware({ type: "request" }).server(
	async ({ request, next }) => {
		// First try API key authentication
		const apiKey = await verifyApiKeyFromRequest(request);

		if (apiKey) {
			return next({
				context: {
					userId: apiKey.userId,
					apiKey: {
						id: apiKey.id,
						name: apiKey.name,
						userId: apiKey.userId,
					},
				},
			});
		}

		// Fall back to session authentication
		const sessionResponse = await getSessionFromRequest(request);

		if (sessionResponse?.session && sessionResponse?.user) {
			return next({
				context: {
					userId: sessionResponse.user.id,
					// user: sessionResponse.user,
					// session: sessionResponse.session,
				},
			});
		}

		// Neither API key nor session is valid
		return new Response(JSON.stringify({ error: "未授权" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	},
);

// ============================================
// Session Auth Middleware (for server functions)
// Only uses session authentication, redirects if not logged in
// ============================================

export const sessionAuthMiddleware = createMiddleware({
	type: "function",
}).server(async ({ next }) => {
	const headers = getRequestHeaders();
	const sessionResponse = await auth.api.getSession({
		headers: new Headers(headers),
	});

	if (!sessionResponse?.session || !sessionResponse?.user) {
		throw redirect({ to: "/auth/login" });
	}

	const { session, user } = sessionResponse;

	return next({
		context: {
			userId: user.id,
			user,
			session,
		},
	});
});
