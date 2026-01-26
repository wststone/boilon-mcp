import { createFileRoute } from "@tanstack/react-router";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { knowledgeBaseFiles, knowledgeBases } from "@/db/file";
import { apiAuthMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/knowledge-base/")({
	server: {
		middleware: [apiAuthMiddleware],
		handlers: {
			// 获取知识库列表
			GET: async ({ context }) => {
				try {
					const userId = context.userId;

					// 获取知识库列表及文件数量
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
					const result = await Promise.all(
						kbs.map(async (kb) => {
							const [fileCount] = await db
								.select({ count: count() })
								.from(knowledgeBaseFiles)
								.where(eq(knowledgeBaseFiles.knowledgeBaseId, kb.id));

							return {
								...kb,
								fileCount: fileCount?.count || 0,
							};
						}),
					);

					return new Response(JSON.stringify({ data: result }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				} catch (error) {
					console.error("获取知识库列表失败:", error);
					return new Response(
						JSON.stringify({ error: "获取知识库列表失败" }),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			},

			// 创建知识库
			POST: async ({ request, context }) => {
				try {
					const userId = context.userId;
					const body = await request.json();
					const { name, description, icon, type, isPublic, settings } = body;

					if (!name) {
						return new Response(
							JSON.stringify({ error: "知识库名称不能为空" }),
							{
								status: 400,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					const [kb] = await db
						.insert(knowledgeBases)
						.values({
							name,
							description,
							icon: icon || "database",
							type: type || "general",
							isPublic: isPublic || false,
							settings: settings || {},
							userId,
						})
						.returning();

					return new Response(JSON.stringify({ data: kb }), {
						status: 201,
						headers: { "Content-Type": "application/json" },
					});
				} catch (error) {
					console.error("创建知识库失败:", error);
					return new Response(JSON.stringify({ error: "创建知识库失败" }), {
						status: 500,
						headers: { "Content-Type": "application/json" },
					});
				}
			},
		},
	},
});
