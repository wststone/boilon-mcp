import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1024;
const BATCH_SIZE = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export interface EmbeddingResult {
	embedding: number[];
	model: string;
	dimensions: number;
}

/**
 * 生成单个文本的嵌入向量
 */
export async function generateEmbedding(
	text: string,
): Promise<EmbeddingResult> {
	const { embedding } = await embed({
		model: openai.embedding(EMBEDDING_MODEL),
		value: text,
		providerOptions: {
			openai: {
				dimensions: EMBEDDING_DIMENSIONS,
			},
		},
	});

	return {
		embedding,
		model: EMBEDDING_MODEL,
		dimensions: EMBEDDING_DIMENSIONS,
	};
}

/**
 * 批量生成嵌入向量
 */
export async function generateEmbeddings(
	texts: string[],
): Promise<EmbeddingResult[]> {
	if (texts.length === 0) {
		return [];
	}

	const results: EmbeddingResult[] = [];

	// 分批处理
	for (let i = 0; i < texts.length; i += BATCH_SIZE) {
		const batch = texts.slice(i, i + BATCH_SIZE);

		const batchResults = await withRetry(async () => {
			const { embeddings } = await embedMany({
				model: openai.embedding(EMBEDDING_MODEL),
				values: batch,
				providerOptions: {
					openai: {
						dimensions: EMBEDDING_DIMENSIONS,
					},
				},
			});

			return embeddings.map((embedding) => ({
				embedding,
				model: EMBEDDING_MODEL,
				dimensions: EMBEDDING_DIMENSIONS,
			}));
		});

		results.push(...batchResults);
	}

	return results;
}

/**
 * 带重试机制的函数执行
 */
async function withRetry<T>(
	fn: () => Promise<T>,
	maxRetries: number = MAX_RETRIES,
	delay: number = RETRY_DELAY,
): Promise<T> {
	let lastError: Error | undefined;

	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;
			console.error(`嵌入生成失败 (尝试 ${i + 1}/${maxRetries}):`, error);

			if (i < maxRetries - 1) {
				// 指数退避
				await sleep(delay * Math.pow(2, i));
			}
		}
	}

	throw lastError;
}

/**
 * 延迟函数
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 计算两个向量的余弦相似度
 */
export function cosineSimilarity(a: number[], b: number[]): number {
	if (a.length !== b.length) {
		throw new Error("向量维度不匹配");
	}

	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < a.length; i++) {
		dotProduct += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}

	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 获取嵌入模型信息
 */
export function getEmbeddingModelInfo() {
	return {
		model: EMBEDDING_MODEL,
		dimensions: EMBEDDING_DIMENSIONS,
		batchSize: BATCH_SIZE,
	};
}
