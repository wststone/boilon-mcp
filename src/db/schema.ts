import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

// Re-export Better Auth tables
export {
	user,
	session,
	account,
	verification,
	organization,
	member,
	invitation,
	apikey,
} from "./auth-schema";

// Import for foreign key references
import { apikey, organization } from "./auth-schema";

// ============================================
// Custom MCP Platform Tables
// ============================================

// MCP Services configuration per organization
export const mcpServiceConfig = pgTable(
	"mcp_service_config",
	{
		id: serial("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		service: varchar("service", { length: 50 }).notNull(), // 'rag', 'weather', 'music'
		enabled: boolean("enabled").default(true),
		config: jsonb("config").$type<Record<string, unknown>>(),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [index("mcp_service_org_idx").on(table.organizationId)],
);

// API usage tracking
export const apiUsage = pgTable(
	"api_usage",
	{
		id: serial("id").primaryKey(),
		apiKeyId: text("api_key_id")
			.notNull()
			.references(() => apikey.id, { onDelete: "cascade" }),
		organizationId: text("organization_id").references(() => organization.id, {
			onDelete: "set null",
		}),
		service: varchar("service", { length: 50 }).notNull(), // 'rag', 'weather', 'music'
		tool: varchar("tool", { length: 100 }).notNull(), // tool name called
		requestCount: integer("request_count").default(1),
		tokensUsed: integer("tokens_used").default(0),
		timestamp: timestamp("timestamp").defaultNow(),
	},
	(table) => [
		index("api_usage_key_idx").on(table.apiKeyId),
		index("api_usage_org_idx").on(table.organizationId),
		index("api_usage_timestamp_idx").on(table.timestamp),
	],
);

// Daily usage aggregation for analytics
export const dailyUsageStats = pgTable(
	"daily_usage_stats",
	{
		id: serial("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		service: varchar("service", { length: 50 }).notNull(),
		date: timestamp("date").notNull(),
		requestCount: integer("request_count").default(0),
		uniqueUsers: integer("unique_users").default(0),
		tokensUsed: integer("tokens_used").default(0),
	},
	(table) => [
		index("daily_stats_org_date_idx").on(table.organizationId, table.date),
	],
);

// RAG Documents storage (for RAG MCP service)
export const ragDocuments = pgTable(
	"rag_documents",
	{
		id: serial("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		content: text("content").notNull(),
		metadata: jsonb("metadata").$type<Record<string, unknown>>(),
		embedding: jsonb("embedding").$type<number[]>(), // Simple vector storage (can upgrade to pgvector)
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [index("rag_docs_org_idx").on(table.organizationId)],
);

// Saved locations for Weather MCP service
export const weatherLocations = pgTable(
	"weather_locations",
	{
		id: serial("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		lat: text("lat").notNull(),
		lon: text("lon").notNull(),
		isDefault: boolean("is_default").default(false),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [index("weather_loc_org_idx").on(table.organizationId)],
);

// Music preferences for Music MCP service
export const musicPreferences = pgTable(
	"music_preferences",
	{
		id: serial("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		favoriteGenres: jsonb("favorite_genres").$type<string[]>(),
		favoriteArtists: jsonb("favorite_artists").$type<string[]>(),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [index("music_pref_org_idx").on(table.organizationId)],
);
