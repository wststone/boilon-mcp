import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { files, knowledgeBaseFiles, knowledgeBases } from "@/db/file";
import { apiAuthMiddleware } from "@/middleware";
import {
	deleteFile,
	extractKeyFromUrl,
} from "@/services/knowledge-base/storage";
import { deleteFileData } from "@/services/knowledge-base/task-processor";

export const Route = createFileRoute("/api/knowledge-base/$id/files/$fileId")({
	server: {
		middleware: [apiAuthMiddleware],
		handlers: {
			// 删除知识库中的文件
			DELETE: async ({ request, params, context }) => {
				try {
					const userId = context.userId;
					const { id: knowledgeBaseId, fileId } = params;

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

					// 验证文件存在且属于该知识库
					const [kbFile] = await db
						.select()
						.from(knowledgeBaseFiles)
						.where(
							and(
								eq(knowledgeBaseFiles.knowledgeBaseId, knowledgeBaseId),
								eq(knowledgeBaseFiles.fileId, fileId),
							),
						)
						.limit(1);

					if (!kbFile) {
						return new Response(JSON.stringify({ error: "文件不存在" }), {
							status: 404,
							headers: { "Content-Type": "application/json" },
						});
					}

					// 获取文件信息
					const [file] = await db
						.select()
						.from(files)
						.where(eq(files.id, fileId))
						.limit(1);

					if (file) {
						// 删除存储中的文件
						try {
							const key = extractKeyFromUrl(file.url);
							await deleteFile(key);
						} catch (err) {
							console.error("删除存储文件失败:", err);
						}

						// 删除文件相关数据（文档、chunks、embeddings）
						await deleteFileData(fileId);
					}

					// 删除知识库-文件关联
					await db
						.delete(knowledgeBaseFiles)
						.where(
							and(
								eq(knowledgeBaseFiles.knowledgeBaseId, knowledgeBaseId),
								eq(knowledgeBaseFiles.fileId, fileId),
							),
						);

					// 删除文件记录
					await db.delete(files).where(eq(files.id, fileId));

					return new Response(JSON.stringify({ message: "文件已删除" }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				} catch (error) {
					console.error("删除文件失败:", error);
					return new Response(JSON.stringify({ error: "删除文件失败" }), {
						status: 500,
						headers: { "Content-Type": "application/json" },
					});
				}
			},
		},
	},
});
