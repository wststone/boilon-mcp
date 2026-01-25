import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, apiKey, organization } from "better-auth/plugins";
import { db } from "@/db";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		organization({
			allowUserToCreateOrganization: true,
			organizationLimit: 5,
			membershipLimit: 50,
			invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
			creatorRole: "owner",
			defaultRole: "member",
		}),
		apiKey({
			enableMetadata: true,
			// API keys can have custom permissions per MCP service
			defaultPrefix: "mcp_",
			apiKeyHeaders: ["x-api-key", "authorization"],
		}),
		admin({
			defaultRole: "user",
			adminRole: "admin",
		}),
	],
	trustedOrigins: ["http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
