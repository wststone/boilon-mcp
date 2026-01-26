import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

import { asyncTasks } from "./asyncTask";
import { users } from "./auth";
import { createdAt, idGenerator, timestamps } from "./utils";

export const files = pgTable("files", {
	id: text("id")
		.$defaultFn(() => idGenerator("files"))
		.primaryKey(),
	userId: uuid("user_id").references(() => users.id, {
		onDelete: "set null",
	}),
	fileType: varchar("file_type", { length: 255 }).notNull(),
	name: text("name").notNull(),
	size: integer("size").notNull(),
	url: text("url").notNull(),
	metadata: jsonb("metadata").$type<Record<string, any>>(),
	chunkTaskId: uuid("chunk_task_id").references(() => asyncTasks.id, {
		onDelete: "set null",
	}),
	embeddingTaskId: uuid("embedding_task_id").references(() => asyncTasks.id, {
		onDelete: "set null",
	}),
	...timestamps,
});

export const knowledgeBases = pgTable("knowledge_bases", {
	id: text("id")
		.$defaultFn(() => idGenerator("knowledgeBases"))
		.primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	icon: text("icon"),
	type: text("type"),
	userId: uuid("user_id").references(() => users.id, {
		onDelete: "set null",
	}),
	externalUserId: text("external_user_id"),
	isPublic: boolean("is_public").default(false),
	// biome-ignore lint/complexity/noBannedTypes: Required for TanStack Start middleware type compatibility
	settings: jsonb("settings").$type<{ [key: string]: {} }>(),
	...timestamps,
});

export const knowledgeBaseFiles = pgTable(
	"knowledge_base_files",
	{
		knowledgeBaseId: text("knowledge_base_id")
			.references(() => knowledgeBases.id, { onDelete: "cascade" })
			.notNull(),
		fileId: text("file_id")
			.references(() => files.id, { onDelete: "cascade" })
			.notNull(),
		userId: uuid("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		createdAt: createdAt(),
	},
	(t) => [
		primaryKey({
			columns: [t.knowledgeBaseId, t.fileId],
		}),
	]
);
