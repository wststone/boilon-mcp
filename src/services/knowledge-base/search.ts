import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { documentChunks, documents } from "@/db/document";
import { chunks, embeddings } from "@/db/embedding";
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
	vectorSimilarity: number;
	keywordSimilarity: number;
	documentId: string;
	documentTitle: string | null;
	fileName: string;
	fileId: string;
	chunkIndex: number;
}

const DEFAULT_VECTOR_THRESHOLD = 0.3;
const DEFAULT_KEYWORD_THRESHOLD = 0.3;

const DEFAULT_OPTIONS: Required<SearchOptions> = {
	limit: 10,
	threshold: DEFAULT_VECTOR_THRESHOLD,
	includeContent: true,
};

// ============================================
// Reciprocal Rank Fusion
// ============================================

/**
 * Reciprocal Rank Fusion — 按排名融合多路召回结果
 * score = Σ 1 / (k + rank_i)
 */
/**
 * 融合两路结果，保留各自的原始相似度分数。
 * vectorResults 在前，keywordResults 在后。
 */
function mergeHybridResults(
	vectorResults: SearchResult[],
	keywordResults: SearchResult[],
	k = 60,
): SearchResult[] {
	const scoreMap = new Map<
		string,
		{ rrfScore: number; vectorSimilarity: number; keywordSimilarity: number; result: SearchResult }
	>();

	// 向量结果
	for (let rank = 0; rank < vectorResults.length; rank++) {
		const r = vectorResults[rank];
		scoreMap.set(r.chunkId, {
			rrfScore: 1 / (k + rank + 1),
			vectorSimilarity: r.similarity,
			keywordSimilarity: 0,
			result: r,
		});
	}

	// 关键词结果
	for (let rank = 0; rank < keywordResults.length; rank++) {
		const r = keywordResults[rank];
		const existing = scoreMap.get(r.chunkId);

		if (existing) {
			existing.rrfScore += 1 / (k + rank + 1);
			existing.keywordSimilarity = r.similarity;
		} else {
			scoreMap.set(r.chunkId, {
				rrfScore: 1 / (k + rank + 1),
				vectorSimilarity: 0,
				keywordSimilarity: r.similarity,
				result: r,
			});
		}
	}

	return Array.from(scoreMap.values())
		.sort((a, b) => b.rrfScore - a.rrfScore)
		.map(({ rrfScore, vectorSimilarity, keywordSimilarity, result }) => ({
			...result,
			similarity: rrfScore,
			vectorSimilarity,
			keywordSimilarity,
		}));
}

// ============================================
// 结果映射
// ============================================

type RawRow = {
	chunkId: string;
	content: string | null;
	chunkIndex: number | null;
	documentId: string;
	documentTitle: string | null;
	fileName: string;
	fileId: string;
	similarity: number;
};

function mapResults(
	results: RawRow[],
	includeContent: boolean,
	source: "vector" | "keyword",
): SearchResult[] {
	return results.map((r) => ({
		chunkId: r.chunkId,
		content: includeContent ? (r.content || "") : "",
		similarity: r.similarity,
		vectorSimilarity: source === "vector" ? r.similarity : 0,
		keywordSimilarity: source === "keyword" ? r.similarity : 0,
		documentId: r.documentId,
		documentTitle: r.documentTitle,
		fileName: r.fileName,
		fileId: r.fileId,
		chunkIndex: r.chunkIndex || 0,
	}));
}

// ============================================
// 语义搜索（向量）
// ============================================

/**
 * 在知识库中进行语义搜索
 */
export async function semanticSearch(
	knowledgeBaseId: string,
	query: string,
	userId: string,
	options: SearchOptions = {},
): Promise<SearchResult[]> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	// 生成查询向量
	const { embedding: queryVector } = await generateEmbedding(query);

	const similarity = sql<number>`1 - (${cosineDistance(embeddings.embeddings, queryVector)})`;

	const results = await db
		.select({
			chunkId: chunks.id,
			content: chunks.text,
			chunkIndex: chunks.index,
			documentId: documents.id,
			documentTitle: documents.title,
			fileName: files.name,
			fileId: files.id,
			similarity,
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
				gt(similarity, opts.threshold),
			),
		)
		.orderBy((t) => desc(t.similarity))
		.limit(opts.limit);

	return mapResults(results, opts.includeContent, "vector");
}

// ============================================
// 关键词搜索（pg_trgm）
// ============================================

/**
 * 在知识库中进行关键词搜索（基于 pg_trgm word_similarity）
 */
export async function keywordSearch(
	knowledgeBaseId: string,
	query: string,
	userId: string,
	options: SearchOptions = {},
): Promise<SearchResult[]> {
	const opts = {
		...DEFAULT_OPTIONS,
		threshold: DEFAULT_KEYWORD_THRESHOLD,
		...options,
	};

	const similarity = sql<number>`word_similarity(${query}, ${chunks.text})`;

	const results = await db
		.select({
			chunkId: chunks.id,
			content: chunks.text,
			chunkIndex: chunks.index,
			documentId: documents.id,
			documentTitle: documents.title,
			fileName: files.name,
			fileId: files.id,
			similarity,
		})
		.from(chunks)
		.innerJoin(documentChunks, eq(documentChunks.chunkId, chunks.id))
		.innerJoin(documents, eq(documents.id, documentChunks.documentId))
		.innerJoin(files, eq(files.id, documents.fileId))
		.innerJoin(knowledgeBaseFiles, eq(knowledgeBaseFiles.fileId, files.id))
		.where(
			and(
				eq(knowledgeBaseFiles.knowledgeBaseId, knowledgeBaseId),
				eq(files.userId, userId),
				gt(similarity, opts.threshold),
			),
		)
		.orderBy((t) => desc(t.similarity))
		.limit(opts.limit);

	return mapResults(results, opts.includeContent, "keyword");
}

// ============================================
// 混合搜索
// ============================================

/**
 * 混合搜索 — 并行执行语义搜索和关键词搜索，用 RRF 融合结果
 */
export async function hybridSearch(
	knowledgeBaseId: string,
	query: string,
	userId: string,
	options: SearchOptions = {},
): Promise<SearchResult[]> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	const [vectorResults, keywordResults] = await Promise.all([
		semanticSearch(knowledgeBaseId, query, userId, {
			limit: opts.limit,
			threshold: DEFAULT_VECTOR_THRESHOLD,
			includeContent: opts.includeContent,
		}),
		keywordSearch(knowledgeBaseId, query, userId, {
			limit: opts.limit,
			threshold: DEFAULT_KEYWORD_THRESHOLD,
			includeContent: opts.includeContent,
		}),
	]);

	const fused = mergeHybridResults(vectorResults, keywordResults);

	return fused.slice(0, opts.limit);
}

// ============================================
// 跨知识库搜索
// ============================================

/**
 * 在所有知识库中搜索（跨知识库）
 */
export async function globalSearch(
	query: string,
	userId: string,
	options: SearchOptions = {},
): Promise<SearchResult[]> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	const { embedding: queryVector } = await generateEmbedding(query);

	const similarity = sql<number>`1 - (${cosineDistance(embeddings.embeddings, queryVector)})`;

	const results = await db
		.select({
			chunkId: chunks.id,
			content: chunks.text,
			chunkIndex: chunks.index,
			documentId: documents.id,
			documentTitle: documents.title,
			fileName: files.name,
			fileId: files.id,
			similarity,
		})
		.from(embeddings)
		.innerJoin(chunks, eq(chunks.id, embeddings.chunkId))
		.innerJoin(documentChunks, eq(documentChunks.chunkId, chunks.id))
		.innerJoin(documents, eq(documents.id, documentChunks.documentId))
		.innerJoin(files, eq(files.id, documents.fileId))
		.where(
			and(
				eq(files.userId, userId),
				gt(similarity, opts.threshold),
			),
		)
		.orderBy((t) => desc(t.similarity))
		.limit(opts.limit);

	return mapResults(results, opts.includeContent, "vector");
}

// ============================================
// RAG 上下文
// ============================================

/**
 * 获取相关上下文（用于 RAG）
 */
export async function getRelevantContext(
	knowledgeBaseId: string,
	query: string,
	userId: string,
	maxChunks: number = 5,
): Promise<string> {
	const results = await hybridSearch(knowledgeBaseId, query, userId, {
		limit: maxChunks,
		threshold: DEFAULT_VECTOR_THRESHOLD,
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
