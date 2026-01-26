import {
	doublePrecision,
	jsonb,
	pgTable,
	text,
	uuid,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { timestamps } from "./utils";

export const asyncTasks = pgTable("async_tasks", {
	id: uuid("id").defaultRandom().primaryKey(),
	type: text("type"),

	status: text("status"),
	error: jsonb("error"),

	userId: uuid("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	duration: doublePrecision("duration"),

	...timestamps,
});
