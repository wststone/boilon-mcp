import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { asyncTasks } from "@/db/asyncTask";
import { files, knowledgeBaseFiles, knowledgeBases } from "@/db/file";
import { apiAuthMiddleware } from "@/middleware";
import {
	createProcessTask,
	getFileTypeFromName,
	isSupportedFileType,
	uploadFile,
} from "@/services/knowledge-base";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const Route = createFileRoute("/api/knowledge-base/$id/files")({
	server: {
		middleware: [apiAuthMiddleware],
		handlers: {
			// 获取知识库中的文件列表
			GET: async ({ params, context }) => {
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

					// 获取文件列表及任务状态
					const fileList = await db
						.select({
							id: files.id,
							name: files.name,
							fileType: files.fileType,
							size: files.size,
							url: files.url,
							metadata: files.metadata,
							createdAt: files.createdAt,
							updatedAt: files.updatedAt,
							chunkTaskId: files.chunkTaskId,
						})
						.from(files)
						.innerJoin(knowledgeBaseFiles, eq(knowledgeBaseFiles.fileId, files.id))
						.where(eq(knowledgeBaseFiles.knowledgeBaseId, knowledgeBaseId))
						.orderBy(desc(files.createdAt));

					// 获取任务状态
					const result = await Promise.all(
						fileList.map(async (file) => {
							let taskStatus = null;
							if (file.chunkTaskId) {
								const [task] = await db
									.select({
										status: asyncTasks.status,
										error: asyncTasks.error,
									})
									.from(asyncTasks)
									.where(eq(asyncTasks.id, file.chunkTaskId))
									.limit(1);

								taskStatus = task
									? {
											status: task.status,
											error: (task.error as { message?: string })?.message,
										}
									: null;
							}

							return {
								...file,
								taskStatus,
							};
						}),
					);

					return new Response(JSON.stringify({ data: result }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				} catch (error) {
					console.error("获取文件列表失败:", error);
					return new Response(JSON.stringify({ error: "获取文件列表失败" }), {
						status: 500,
						headers: { "Content-Type": "application/json" },
					});
				}
			},

			// 上传文件到知识库
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

					// 解析 multipart form data
					const formData = await request.formData();
					const file = formData.get("file") as File | null;

					if (!file) {
						return new Response(JSON.stringify({ error: "请选择文件" }), {
							status: 400,
							headers: { "Content-Type": "application/json" },
						});
					}

					// 验证文件类型
					if (!isSupportedFileType(file.name)) {
						return new Response(
							JSON.stringify({
								error: "不支持的文件类型，支持: PDF, TXT, MD, DOCX",
							}),
							{
								status: 400,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					// 验证文件大小
					if (file.size > MAX_FILE_SIZE) {
						return new Response(
							JSON.stringify({ error: "文件大小不能超过 50MB" }),
							{
								status: 400,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					// 上传到存储
					const { url, key } = await uploadFile(file, userId, file.name);

					// 创建文件记录
					const [fileRecord] = await db
						.insert(files)
						.values({
							name: file.name,
							fileType: getFileTypeFromName(file.name),
							size: file.size,
							url,
							userId,
							metadata: {
								mimeType: file.type,
								originalName: file.name,
								storageKey: key,
							},
						})
						.returning();

					// 创建知识库-文件关联
					await db.insert(knowledgeBaseFiles).values({
						knowledgeBaseId,
						fileId: fileRecord.id,
						userId,
					});

					// 创建处理任务
					const taskId = await createProcessTask(fileRecord.id, userId);

					return new Response(
						JSON.stringify({
							data: {
								file: fileRecord,
								taskId,
							},
						}),
						{
							status: 201,
							headers: { "Content-Type": "application/json" },
						},
					);
				} catch (error) {
					console.error("上传文件失败:", error);
					return new Response(JSON.stringify({ error: "上传文件失败" }), {
						status: 500,
						headers: { "Content-Type": "application/json" },
					});
				}
			},
		},
	},
});
