import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { knowledgeBases } from "@/db/file";
import { globalSearch, hybridSearch } from "@/services/knowledge-base/search";

/**
 * Creates and configures the RAG MCP server
 * 只暴露 search_knowledge 工具，使用真实的混合搜索（向量 + 关键词）
 */
export function createRagServer(
	_organizationId: string,
	userId: string,
): McpServer {
	const server = new McpServer({
		name: "boilon-rag",
		version: "1.0.0",
	});

	// Tool: 搜索知识库
	server.tool(
		"search_knowledge",
		"搜索知识库中的相关内容，支持语义搜索和关键词搜索的混合检索",
		{
			query: z
				.string()
				.meta({ description: "搜索查询内容" }),
			knowledgeBaseId: z
				.string()
				.optional()
				.meta({ description: "指定知识库 ID，不传则搜索所有知识库" }),
			limit: z
				.number()
				.optional()
				.default(5)
				.meta({ description: "返回结果数量上限" }),
		},
		async ({ query, knowledgeBaseId, limit }) => {
			// 如果指定了知识库，验证其存在且属于当前用户
			if (knowledgeBaseId) {
				const [kb] = await db
					.select({ id: knowledgeBases.id })
					.from(knowledgeBases)
					.where(eq(knowledgeBases.id, knowledgeBaseId))
					.limit(1);

				if (!kb) {
					return {
						content: [
							{
								type: "text" as const,
								text: JSON.stringify({
									error: "知识库不存在",
									query,
									results: [],
								}),
							},
						],
					};
				}

				const results = await hybridSearch(
					knowledgeBaseId,
					query,
					userId,
					{ limit, includeContent: true },
				);

				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify({
								query,
								totalResults: results.length,
								results: results.map((r) => ({
									content: r.content,
									similarity: r.similarity,
									documentTitle: r.documentTitle,
									fileName: r.fileName,
									chunkIndex: r.chunkIndex,
								})),
							}),
						},
					],
				};
			}

			// 未指定知识库，跨所有知识库搜索
			const results = await globalSearch(query, userId, {
				limit,
				includeContent: true,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							query,
							totalResults: results.length,
							results: results.map((r) => ({
								content: r.content,
								similarity: r.similarity,
								documentTitle: r.documentTitle,
								fileName: r.fileName,
								chunkIndex: r.chunkIndex,
							})),
						}),
					},
				],
			};
		},
	);

	return server;
}
