import { auth } from "@/lib/auth";

export type SessionUser = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session.session;

export type AuthContext = {
	userId: string;
	user: SessionUser;
	session: Session;
};

export type ApiKeyInfo = {
	id: string;
	name: string | null;
	userId: string;
	metadata?: Record<string, unknown> | null;
};

export type ApiAuthContext = {
	userId: string;
	user: SessionUser | null;
	session: Session | null;
	apiKey: ApiKeyInfo | null;
};

/**
 * 从请求中获取 session
 */
export async function getSessionFromRequest(request: Request) {
	return auth.api.getSession({ headers: request.headers });
}

/**
 * 从请求中验证 API key
 */
export async function verifyApiKeyFromRequest(request: Request) {
	const apiKeyHeader = request.headers.get("x-api-key");
	const authorizationHeader = request.headers.get("authorization");
	const apiKey = apiKeyHeader || authorizationHeader?.split("Bearer ")[1];

	if (!apiKey) {
		return null;
	}

	const result = await auth.api.verifyApiKey({
		body: { key: apiKey },
		headers: request.headers,
	});

	if (result.error || !result.valid || !result.key?.userId) {
		return null;
	}

	return result.key;
}
