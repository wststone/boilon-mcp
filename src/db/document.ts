import {
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { chunks } from "./embedding";
import { files } from "./file";
import { createdAt, idGenerator, timestamps } from "./utils";

export const documents = pgTable(
	"documents",
	{
		id: text("id")
			.$defaultFn(() => idGenerator("documents", 16))
			.primaryKey(),

		// 基本信息
		title: text("title"),
		content: text("content"),
		fileType: varchar("file_type", { length: 255 }).notNull(),
		filename: text("filename"),

		// 元数据
		metadata: jsonb("metadata").$type<Record<string, any>>(),

		// 页面/块数据
		pages: jsonb("pages").$type<any>(),

		// 来源类型
		sourceType: text("source_type", {
			enum: ["file", "web", "api"],
		}).notNull(),
		source: text("source").notNull(),
		fileId: text("file_id").references(() => files.id, {
			onDelete: "set null",
		}),
		userId: uuid("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),

		// 时间戳
		...timestamps,
	},
	(table) => [
		index("documents_source_idx").on(table.source),
		index("documents_file_type_idx").on(table.fileType),
		index("documents_file_id_idx").on(table.fileId),
	],
);

export const documentChunks = pgTable(
	"document_chunks",
	{
		documentId: text("document_id")
			.references(() => documents.id, { onDelete: "cascade" })
			.notNull(),
		chunkId: uuid("chunk_id")
			.references(() => chunks.id, { onDelete: "cascade" })
			.notNull(),
		pageIndex: integer("page_index"),
		userId: uuid("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: createdAt(),
	},
	(t) => [primaryKey({ columns: [t.documentId, t.chunkId] })],
);
