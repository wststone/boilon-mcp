import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { files, knowledgeBaseFiles, knowledgeBases } from "@/db/file";
import { sessionAuthMiddleware } from "@/middleware/api-auth";
import {
	deleteFile,
	extractKeyFromUrl,
	hybridSearch,
} from "@/services/knowledge-base";
import { deleteFileData } from "@/services/knowledge-base/task-processor";

// ============================================
// Types
// ============================================

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type KnowledgeBaseSettings = { [key: string]: {} } | null;

export type KnowledgeBase = {
	id: string;
	name: string;
	description: string | null;
	icon: string | null;
	type: string | null;
	isPublic: boolean | null;
	settings: KnowledgeBaseSettings;
	createdAt: Date;
	updatedAt: Date;
};

export type KnowledgeBaseWithFileCount = KnowledgeBase & {
	fileCount: number;
};

// ============================================
// Input Types
// ============================================

export type CreateKnowledgeBaseInput = {
	name: string;
	description?: string | null;
	icon?: string | null;
	type?: string | null;
	isPublic?: boolean | null;
	settings?: KnowledgeBaseSettings;
};

export type GetKnowledgeBaseInput = {
	id: string;
};

export type UpdateKnowledgeBaseInput = {
	id: string;
	name?: string | null;
	description?: string | null;
	icon?: string | null;
	type?: string | null;
	isPublic?: boolean | null;
	settings?: KnowledgeBaseSettings;
};

export type DeleteKnowledgeBaseInput = {
	id: string;
};

// ============================================
// Schemas
// ============================================

const createKnowledgeBaseSchema = z.object({
	name: z.string().min(1, "知识库名称不能为空"),
	description: z.string().nullish(),
	icon: z.string().nullish(),
	type: z.string().nullish(),
	isPublic: z.boolean().nullish(),
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	settings: z.record(z.string(), z.any()).nullish(),
});

const getKnowledgeBaseSchema = z.object({
	id: z.string(),
});

const updateKnowledgeBaseSchema = z.object({
	id: z.string(),
	name: z.string().nullish(),
	description: z.string().nullish(),
	icon: z.string().nullish(),
	type: z.string().nullish(),
	isPublic: z.boolean().nullish(),
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	settings: z.record(z.string(), z.any()).nullish(),
});

const deleteKnowledgeBaseSchema = z.object({
	id: z.string(),
});

const searchKnowledgeBaseSchema = z.object({
	knowledgeBaseId: z.string(),
	query: z.string().min(1, "请提供搜索查询"),
	limit: z.number().min(1).max(50).optional(),
	threshold: z.number().min(0).max(1).optional(),
});

// ============================================
// Server Functions
// ============================================

/**
 * 获取知识库列表
 */
export const $listKnowledgeBases = createServerFn({
	method: "GET",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const { userId } = ctx.context;

		// 获取知识库列表
		const kbs = await db
			.select({
				id: knowledgeBases.id,
				name: knowledgeBases.name,
				description: knowledgeBases.description,
				icon: knowledgeBases.icon,
				type: knowledgeBases.type,
				isPublic: knowledgeBases.isPublic,
				settings: knowledgeBases.settings,
				createdAt: knowledgeBases.createdAt,
				updatedAt: knowledgeBases.updatedAt,
			})
			.from(knowledgeBases)
			.where(eq(knowledgeBases.userId, userId))
			.orderBy(desc(knowledgeBases.updatedAt));

		// 获取每个知识库的文件数量
		const result: KnowledgeBaseWithFileCount[] = await Promise.all(
			kbs.map(async (kb) => {
				const [fileCount] = await db
					.select({ count: count() })
					.from(knowledgeBaseFiles)
					.where(eq(knowledgeBaseFiles.knowledgeBaseId, kb.id));

				return {
					id: kb.id,
					name: kb.name,
					description: kb.description,
					icon: kb.icon,
					type: kb.type,
					isPublic: kb.isPublic,
					settings: kb.settings as KnowledgeBaseSettings,
					createdAt: kb.createdAt,
					updatedAt: kb.updatedAt,
					fileCount: fileCount?.count || 0,
				};
			}),
		);

		return result;
	});

/**
 * 创建知识库
 */
export const $createKnowledgeBase = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const { userId } = ctx.context;
		const input = createKnowledgeBaseSchema.parse(
			(ctx as unknown as { data: CreateKnowledgeBaseInput }).data,
		);
		const { name, description, icon, type, isPublic, settings } = input;

		const [kb] = await db
			.insert(knowledgeBases)
			.values({
				name,
				description,
				icon: icon || "database",
				type: type || "general",
				isPublic: isPublic || false,
				settings: (settings || {}) as KnowledgeBaseSettings,
				userId,
			})
			.returning();

		return {
			...kb,
			settings: kb.settings as KnowledgeBaseSettings,
		};
	});

/**
 * 获取单个知识库详情
 */
export const $getKnowledgeBase = createServerFn({
	method: "GET",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const { userId } = ctx.context;
		const input = getKnowledgeBaseSchema.parse(
			(ctx as unknown as { data: GetKnowledgeBaseInput }).data,
		);
		const { id } = input;

		const [kb] = await db
			.select()
			.from(knowledgeBases)
			.where(and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, userId)))
			.limit(1);

		if (!kb) {
			throw new Error("知识库不存在");
		}

		return {
			...kb,
			settings: kb.settings as KnowledgeBaseSettings,
		};
	});

/**
 * 更新知识库
 */
export const $updateKnowledgeBase = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const { userId } = ctx.context;
		const input = updateKnowledgeBaseSchema.parse(
			(ctx as unknown as { data: UpdateKnowledgeBaseInput }).data,
		);
		const { id, name, description, icon, type, isPublic, settings } = input;

		// 验证知识库存在且属于当前用户
		const [existing] = await db
			.select()
			.from(knowledgeBases)
			.where(and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new Error("知识库不存在");
		}

		const [updated] = await db
			.update(knowledgeBases)
			.set({
				name: name ?? existing.name,
				description: description ?? existing.description,
				icon: icon ?? existing.icon,
				type: type ?? existing.type,
				isPublic: isPublic ?? existing.isPublic,
				settings: (settings ?? existing.settings) as KnowledgeBaseSettings,
			})
			.where(eq(knowledgeBases.id, id))
			.returning();

		return {
			...updated,
			settings: updated.settings as KnowledgeBaseSettings,
		};
	});

/**
 * 删除知识库
 */
export const $deleteKnowledgeBase = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const { userId } = ctx.context;
		const input = deleteKnowledgeBaseSchema.parse(
			(ctx as unknown as { data: DeleteKnowledgeBaseInput }).data,
		);
		const { id } = input;

		// 验证知识库存在且属于当前用户
		const [existing] = await db
			.select()
			.from(knowledgeBases)
			.where(and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new Error("知识库不存在");
		}

		// 获取关联的文件
		const kbFiles = await db
			.select({ fileId: knowledgeBaseFiles.fileId })
			.from(knowledgeBaseFiles)
			.where(eq(knowledgeBaseFiles.knowledgeBaseId, id));

		// 删除存储中的文件
		for (const { fileId } of kbFiles) {
			try {
				const [file] = await db
					.select()
					.from(files)
					.where(eq(files.id, fileId))
					.limit(1);

				if (file) {
					// 删除存储文件
					const key = extractKeyFromUrl(file.url);
					await deleteFile(key);
					// 删除文件相关数据
					await deleteFileData(fileId);
				}
			} catch (err) {
				console.error(`删除文件 ${fileId} 失败:`, err);
			}
		}

		// 删除知识库（会级联删除关联记录）
		await db.delete(knowledgeBases).where(eq(knowledgeBases.id, id));

		return { success: true };
	});

/**
 * 搜索知识库
 */
export const $searchKnowledgeBase = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.inputValidator(searchKnowledgeBaseSchema)
	.handler(async ({ context, data }) => {
		const { userId } = context;
		const { knowledgeBaseId, query, limit = 10, threshold = 0.2 } = data;

		// 验证知识库存在且属于当前用户
		const [kb] = await db
			.select()
			.from(knowledgeBases)
			.where(
				and(
					eq(knowledgeBases.id, knowledgeBaseId),
					eq(knowledgeBases.userId, userId),
				),
			)
			.limit(1);

		if (!kb) {
			throw new Error("知识库不存在");
		}

		const results = await hybridSearch(knowledgeBaseId, query, userId, {
			limit,
			threshold,
			includeContent: true,
		});

		return results;
	});
