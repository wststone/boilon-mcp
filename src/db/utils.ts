import { randomBytes } from "node:crypto";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgTable, TableConfig } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";

export const createdAt = () => timestamp("created_at").notNull().defaultNow();
export const updatedAt = () =>
	timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date());

export const timestamps = {
	createdAt: createdAt(),
	updatedAt: updatedAt(),
};

const prefixes = {
	documents: "docs",
	files: "file",
	knowledgeBases: "kb",
} as const;

export const idGenerator = (namespace: keyof typeof prefixes, size = 12) => {
	const hash = randomBytes(size).toString("hex");

	const prefix = prefixes[namespace];

	if (!prefix)
		throw new Error(`Invalid namespace: ${namespace}, please check your code.`);

	return `${prefix}_${hash}`;
};

// node-postgres 的参数上限为 65535，需要分批插入大量数据
const MAX_PARAMS = 65535;

/**
 * 分批插入数据，避免超出 node-postgres 参数上限
 */
export async function batchInsert<T extends PgTable<TableConfig>>(
	database: NodePgDatabase<any>,
	table: T,
	values: T["$inferInsert"][],
	options?: { returning?: boolean },
) {
	if (values.length === 0) return [];

	// 计算每行的参数数量（非 default 的列数）
	const columnsPerRow = Object.keys(values[0] as Record<string, unknown>).length;
	const batchSize = Math.floor(MAX_PARAMS / columnsPerRow);

	const results: T["$inferInsert"][] = [];
	for (let i = 0; i < values.length; i += batchSize) {
		const batch = values.slice(i, i + batchSize);
		if (options?.returning) {
			const rows = await database.insert(table).values(batch).returning();
			results.push(...rows);
		} else {
			await database.insert(table).values(batch);
		}
	}

	return results;
}
