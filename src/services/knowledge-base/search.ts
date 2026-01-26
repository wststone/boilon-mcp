import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { chunks, embeddings } from "@/db/embedding";
import { documentChunks, documents } from "@/db/document";
import { files, knowledgeBaseFiles } from "@/db/file";
import { generateEmbedding } from "./embedder";

export interface SearchOptions {
	limit?: number;
	threshold?: number;
	includeContent?: boolean;
}

export interface SearchResult {
	chunkId: string;
	content: string;
	similarity: number;
	documentId: string;
	documentTitle: string | null;
	fileName: string;
	fileId: string;
	chunkIndex: number;
}

const DEFAULT_OPTIONS: Required<SearchOptions> = {
	limit: 10,
	threshold: 0.5,
	includeContent: true,
};

/**
 * 在知识库中进行语义搜索
 */
export async function semanticSearch(
	knowledgeBaseId: string,
	query: string,
	userId: string,
	options: SearchOptions = {}
): Promise<SearchResult[]> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	// 生成查询向量
	const { embedding: queryVector } = await generateEmbedding(query);

	// 将向量转换为 PostgreSQL 格式（使用 sql.raw 避免 node-postgres 参数化导致 vector 类型转换失败）
	const vectorLiteral = sql.raw(`'[${queryVector.join(",")}]'::vector`);

	// 执行向量搜索
	const results = await db
		.select({
			chunkId: chunks.id,
			content: chunks.text,
			chunkIndex: chunks.index,
			documentId: documents.id,
			documentTitle: documents.title,
			fileName: files.name,
			fileId: files.id,
			similarity: sql<number>`1 - (${embeddings.embeddings} <=> ${vectorLiteral})`,
		})
		.from(embeddings)
		.innerJoin(chunks, eq(chunks.id, embeddings.chunkId))
		.innerJoin(documentChunks, eq(documentChunks.chunkId, chunks.id))
		.innerJoin(documents, eq(documents.id, documentChunks.documentId))
		.innerJoin(files, eq(files.id, documents.fileId))
		.innerJoin(knowledgeBaseFiles, eq(knowledgeBaseFiles.fileId, files.id))
		.where(
			and(
				eq(knowledgeBaseFiles.knowledgeBaseId, knowledgeBaseId),
				eq(files.userId, userId),
				sql`1 - (${embeddings.embeddings} <=> ${vectorLiteral}) > ${opts.threshold}`,
			),
		)
		.orderBy(desc(sql`1 - (${embeddings.embeddings} <=> ${vectorLiteral})`))
		.limit(opts.limit);

	return results.map((r) => ({
		chunkId: r.chunkId,
		content: opts.includeContent ? (r.content || "") : "",
		similarity: r.similarity,
		documentId: r.documentId,
		documentTitle: r.documentTitle,
		fileName: r.fileName,
		fileId: r.fileId,
		chunkIndex: r.chunkIndex || 0,
	}));
}

/**
 * 在所有知识库中搜索（跨知识库）
 */
export async function globalSearch(
	query: string,
	userId: string,
	options: SearchOptions = {}
): Promise<SearchResult[]> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	const { embedding: queryVector } = await generateEmbedding(query);
	const vectorLiteral = sql.raw(`'[${queryVector.join(",")}]'::vector`);

	const results = await db
		.select({
			chunkId: chunks.id,
			content: chunks.text,
			chunkIndex: chunks.index,
			documentId: documents.id,
			documentTitle: documents.title,
			fileName: files.name,
			fileId: files.id,
			similarity: sql<number>`1 - (${embeddings.embeddings} <=> ${vectorLiteral})`,
		})
		.from(embeddings)
		.innerJoin(chunks, eq(chunks.id, embeddings.chunkId))
		.innerJoin(documentChunks, eq(documentChunks.chunkId, chunks.id))
		.innerJoin(documents, eq(documents.id, documentChunks.documentId))
		.innerJoin(files, eq(files.id, documents.fileId))
		.where(
			and(
				eq(files.userId, userId),
				sql`1 - (${embeddings.embeddings} <=> ${vectorLiteral}) > ${opts.threshold}`,
			),
		)
		.orderBy(desc(sql`1 - (${embeddings.embeddings} <=> ${vectorLiteral})`))
		.limit(opts.limit);

	return results.map((r) => ({
		chunkId: r.chunkId,
		content: opts.includeContent ? (r.content || "") : "",
		similarity: r.similarity,
		documentId: r.documentId,
		documentTitle: r.documentTitle,
		fileName: r.fileName,
		fileId: r.fileId,
		chunkIndex: r.chunkIndex || 0,
	}));
}

/**
 * 获取相关上下文（用于 RAG）
 */
export async function getRelevantContext(
	knowledgeBaseId: string,
	query: string,
	userId: string,
	maxChunks: number = 5
): Promise<string> {
	const results = await semanticSearch(knowledgeBaseId, query, userId, {
		limit: maxChunks,
		threshold: 0.5,
		includeContent: true,
	});

	if (results.length === 0) {
		return "";
	}

	return results
		.map((r, i) => {
			const header = `[来源 ${i + 1}: ${r.fileName}${r.documentTitle ? ` - ${r.documentTitle}` : ""}]`;
			return `${header}\n${r.content}`;
		})
		.join("\n\n---\n\n");
}
