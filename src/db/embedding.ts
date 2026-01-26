import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	uuid,
	varchar,
	vector,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { timestamps } from "./utils";

export const chunks = pgTable("chunks", {
	id: uuid("id").defaultRandom().primaryKey(),
	text: text("text"),
	abstract: text("abstract"),
	metadata: jsonb("metadata"),
	index: integer("index"),
	type: varchar("type"),
	userId: uuid("user_id").references(() => users.id, {
		onDelete: "cascade",
	}),
	...timestamps,
});

export const embeddings = pgTable(
	"embeddings",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		chunkId: uuid("chunk_id")
			.references(() => chunks.id, { onDelete: "cascade" })
			.unique(),
		embeddings: vector("embeddings", { dimensions: 1024 }),
		model: text("model"),
		userId: uuid("user_id").references(() => users.id, {
			onDelete: "cascade",
		}),
	},
	(table) => [
		index("embedding_index").using(
			"hnsw",
			table.embeddings.op("vector_cosine_ops")
		),
	]
);

export type NewChunk = typeof chunks.$inferInsert;
export type Chunk = typeof chunks.$inferSelect;
