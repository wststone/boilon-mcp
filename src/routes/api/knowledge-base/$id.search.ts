import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { knowledgeBases } from "@/db/file";
import { apiAuthMiddleware } from "@/middleware";
import { semanticSearch } from "@/services/knowledge-base";

export const Route = createFileRoute("/api/knowledge-base/$id/search")({
	server: {
		middleware: [apiAuthMiddleware],
		handlers: {
			// 在知识库中进行语义搜索
			POST: async ({ request, params, context }) => {
				try {
					const userId = context.userId;
					const { id: knowledgeBaseId } = params;

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
						return new Response(JSON.stringify({ error: "知识库不存在" }), {
							status: 404,
							headers: { "Content-Type": "application/json" },
						});
					}

					const body = await request.json();
					const { query, limit = 10, threshold = 0.5 } = body;

					if (!query || typeof query !== "string") {
						return new Response(JSON.stringify({ error: "请提供搜索查询" }), {
							status: 400,
							headers: { "Content-Type": "application/json" },
						});
					}

					const results = await semanticSearch(knowledgeBaseId, query, userId, {
						limit: Math.min(limit, 50),
						threshold: Math.max(0, Math.min(threshold, 1)),
						includeContent: true,
					});

					return new Response(
						JSON.stringify({
							data: {
								query,
								results,
								total: results.length,
							},
						}),
						{
							status: 200,
							headers: { "Content-Type": "application/json" },
						},
					);
				} catch (error) {
					console.error("搜索失败:", error);
					return new Response(JSON.stringify({ error: "搜索失败" }), {
						status: 500,
						headers: { "Content-Type": "application/json" },
					});
				}
			},
		},
	},
});
