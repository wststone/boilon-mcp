import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { files, knowledgeBaseFiles, knowledgeBases } from "@/db/file";
import { apiAuthMiddleware } from "@/middleware";
import { deleteFile, extractKeyFromUrl } from "@/services/knowledge-base";
import { deleteFileData } from "@/services/knowledge-base/task-processor";

export const Route = createFileRoute("/api/knowledge-base/$id")({
	server: {
		middleware: [apiAuthMiddleware],
		handlers: {
			// 获取单个知识库详情
			GET: async ({ params, context }) => {
				try {
					const userId = context.userId;
					const { id } = params;

					const [kb] = await db
						.select()
						.from(knowledgeBases)
						.where(
							and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, userId)),
						)
						.limit(1);

					if (!kb) {
						return new Response(JSON.stringify({ error: "知识库不存在" }), {
							status: 404,
							headers: { "Content-Type": "application/json" },
						});
					}

					return new Response(JSON.stringify({ data: kb }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				} catch (error) {
					console.error("获取知识库详情失败:", error);
					return new Response(
						JSON.stringify({ error: "获取知识库详情失败" }),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			},

			// 更新知识库
			PUT: async ({ request, params, context }) => {
				try {
					const userId = context.userId;
					const { id } = params;
					const body = await request.json();
					const { name, description, icon, type, isPublic, settings } = body;

					// 验证知识库存在且属于当前用户
					const [existing] = await db
						.select()
						.from(knowledgeBases)
						.where(
							and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, userId)),
						)
						.limit(1);

					if (!existing) {
						return new Response(JSON.stringify({ error: "知识库不存在" }), {
							status: 404,
							headers: { "Content-Type": "application/json" },
						});
					}

					const [updated] = await db
						.update(knowledgeBases)
						.set({
							name: name ?? existing.name,
							description: description ?? existing.description,
							icon: icon ?? existing.icon,
							type: type ?? existing.type,
							isPublic: isPublic ?? existing.isPublic,
							settings: settings ?? existing.settings,
						})
						.where(eq(knowledgeBases.id, id))
						.returning();

					return new Response(JSON.stringify({ data: updated }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				} catch (error) {
					console.error("更新知识库失败:", error);
					return new Response(JSON.stringify({ error: "更新知识库失败" }), {
						status: 500,
						headers: { "Content-Type": "application/json" },
					});
				}
			},

			// 删除知识库
			DELETE: async ({ params, context }) => {
				try {
					const userId = context.userId;
					const { id } = params;

					// 验证知识库存在且属于当前用户
					const [existing] = await db
						.select()
						.from(knowledgeBases)
						.where(
							and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, userId)),
						)
						.limit(1);

					if (!existing) {
						return new Response(JSON.stringify({ error: "知识库不存在" }), {
							status: 404,
							headers: { "Content-Type": "application/json" },
						});
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

					return new Response(JSON.stringify({ message: "知识库已删除" }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				} catch (error) {
					console.error("删除知识库失败:", error);
					return new Response(JSON.stringify({ error: "删除知识库失败" }), {
						status: 500,
						headers: { "Content-Type": "application/json" },
					});
				}
			},
		},
	},
});
