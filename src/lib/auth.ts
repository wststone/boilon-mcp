import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, apiKey, organization } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { db } from "@/db";
import * as schema from "@/db/auth-schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			users: schema.users,
			sessions: schema.sessions,
			accounts: schema.accounts,
			verifications: schema.verifications,
			organizations: schema.organizations,
			members: schema.members,
			invitations: schema.invitations,
			apikeys: schema.apikeys,
		},
		usePlural: true,
	}),
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		database: {
			generateId: () => randomUUID(),
		},
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
			defaultPrefix: "mcp_",
			apiKeyHeaders: ["x-api-key", "authorization"],
		}),
		admin({
			defaultRole: "user",
			adminRole: "admin",
		}),
		tanstackStartCookies(),
	],
	trustedOrigins: ["http://localhost:5173"],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
