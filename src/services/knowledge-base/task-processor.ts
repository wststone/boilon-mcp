import { eq } from "drizzle-orm";
import { db } from "@/db";
import { asyncTasks,chunks, documentChunks, documents,embeddings,files } from "@/db/schema";
import { batchInsert } from "@/db/utils";
import { chunkText } from "./chunker";
import { generateEmbeddings } from "./embedder";
import { getFileTypeFromName } from "./file-types";
import { extractKeyFromUrl } from "./storage";

export type TaskStatus = "pending" | "processing" | "completed" | "failed";

export interface TaskProgress {
	status: TaskStatus;
	progress: number;
	message?: string;
	error?: string;
}

/**
 * 处理文件任务
 */
export async function processFileTask(
	taskId: string,
	fileId: string,
): Promise<void> {
	try {
		// 更新任务状态为处理中
		await updateTaskStatus(taskId, "processing", 0, "开始处理文件...");

		// 获取文件信息
		const [file] = await db
			.select()
			.from(files)
			.where(eq(files.id, fileId))
			.limit(1);

		if (!file) {
			throw new Error("文件不存在");
		}

		const userId = file.userId!;
		const fileKey = extractKeyFromUrl(file.url);
		const fileType = getFileTypeFromName(file.name);

		// Step 1: 解析文件 (0-30%)
		await updateTaskStatus(taskId, "processing", 10, "正在解析文件...");
		const { parseFile } = await import("./parser");
		const parsed = await parseFile(fileKey, fileType);

		// 创建文档记录
		const [document] = await db
			.insert(documents)
			.values({
				fileId: file.id,
				title: parsed.metadata.title || file.name,
				content: parsed.content,
				fileType: fileType,
				filename: file.name,
				sourceType: "file",
				source: file.url,
				userId,
				metadata: parsed.metadata,
			})
			.returning();

		await updateTaskStatus(taskId, "processing", 30, "文件解析完成");

		// Step 2: 分块 (30-50%)
		await updateTaskStatus(taskId, "processing", 35, "正在分割文本...");
		const textChunks = chunkText(parsed.content, {
			chunkSize: 1000,
			chunkOverlap: 200,
		});

		// 批量插入 chunks
		const insertedChunks = await batchInsert(
			db,
			chunks,
			textChunks.map((chunk) => ({
				text: chunk.content,
				index: chunk.index,
				metadata: chunk.metadata,
				userId,
			})),
			{ returning: true },
		);

		// 创建 document-chunk 关联
		await batchInsert(
			db,
			documentChunks,
			insertedChunks.map((chunk) => ({
				documentId: document.id,
				chunkId: chunk.id!,
				userId,
			})),
		);

		await updateTaskStatus(
			taskId,
			"processing",
			50,
			`文本分割完成，共 ${textChunks.length} 个片段`,
		);

		// Step 3: 生成嵌入 (50-95%)
		await updateTaskStatus(taskId, "processing", 55, "正在生成向量嵌入...");

		const texts = textChunks.map((c) => c.content);
		const embeddingResults = await generateEmbeddings(texts);

		// 批量插入 embeddings
		await batchInsert(
			db,
			embeddings,
			insertedChunks.map((chunk, i) => ({
				chunkId: chunk.id,
				embeddings: embeddingResults[i].embedding,
				model: embeddingResults[i].model,
				userId,
			})),
		);

		await updateTaskStatus(taskId, "processing", 95, "向量嵌入生成完成");

		// Step 4: 完成 (100%)
		await db
			.update(files)
			.set({ chunkTaskId: taskId })
			.where(eq(files.id, fileId));

		await updateTaskStatus(taskId, "completed", 100, "处理完成");
	} catch (error) {
		console.error("文件处理失败:", error);
		await updateTaskStatus(
			taskId,
			"failed",
			0,
			undefined,
			error instanceof Error ? error.message : "未知错误",
		);
		throw error;
	}
}

/**
 * 更新任务状态
 */
export async function updateTaskStatus(
	taskId: string,
	status: TaskStatus,
	progress: number,
	message?: string,
	error?: string,
): Promise<void> {
	const updateData: Record<string, unknown> = {
		status,
	};

	if (error) {
		updateData.error = { message: error };
	}

	if (status === "completed" || status === "failed") {
		updateData.duration = Date.now(); // 可以在创建时记录开始时间来计算
	}

	await db.update(asyncTasks).set(updateData).where(eq(asyncTasks.id, taskId));
}

/**
 * 获取任务状态
 */
export async function getTaskStatus(
	taskId: string,
): Promise<TaskProgress | null> {
	const [task] = await db
		.select()
		.from(asyncTasks)
		.where(eq(asyncTasks.id, taskId))
		.limit(1);

	if (!task) {
		return null;
	}

	return {
		status: task.status as TaskStatus,
		progress: 0, // asyncTasks 表需要添加 progress 字段
		error: (task.error as { message?: string })?.message,
	};
}

/**
 * 创建处理任务
 */
export async function createProcessTask(
	fileId: string,
	userId: string,
): Promise<string> {
	const [task] = await db
		.insert(asyncTasks)
		.values({
			type: "process_file",
			status: "pending",
			userId,
		})
		.returning();

	// 更新文件的任务引用
	await db
		.update(files)
		.set({ chunkTaskId: task.id })
		.where(eq(files.id, fileId));

	// 异步启动处理（不等待完成）
	processFileTask(task.id, fileId).catch((err) => {
		console.error("后台任务处理失败:", err);
	});

	return task.id;
}

/**
 * 删除文件相关数据
 */
export async function deleteFileData(fileId: string): Promise<void> {
	// 由于设置了 cascade delete，删除 document 会自动删除关联的 chunks 和 embeddings
	await db.delete(documents).where(eq(documents.fileId, fileId));
}
