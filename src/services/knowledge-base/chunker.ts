export interface ChunkOptions {
	chunkSize?: number;
	chunkOverlap?: number;
	separators?: string[];
}

export interface TextChunk {
	content: string;
	index: number;
	metadata: {
		startIndex: number;
		endIndex: number;
		charCount: number;
	};
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
	chunkSize: 1000,
	chunkOverlap: 200,
	separators: ["\n\n", "\n", "。", ".", "！", "!", "？", "?", "；", ";", " "],
};

/**
 * 将文本分割成块
 */
export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const { chunkSize, chunkOverlap, separators } = opts;

	// 清理文本
	const cleanedText = cleanText(text);

	if (cleanedText.length <= chunkSize) {
		return [
			{
				content: cleanedText,
				index: 0,
				metadata: {
					startIndex: 0,
					endIndex: cleanedText.length,
					charCount: cleanedText.length,
				},
			},
		];
	}

	const chunks: TextChunk[] = [];
	let currentIndex = 0;
	let chunkIndex = 0;

	while (currentIndex < cleanedText.length) {
		// 计算结束位置
		let endIndex = Math.min(currentIndex + chunkSize, cleanedText.length);

		// 如果不是最后一块，尝试在分隔符处断开
		if (endIndex < cleanedText.length) {
			const searchStart = Math.max(currentIndex + chunkSize - 200, currentIndex);
			const searchText = cleanedText.slice(searchStart, endIndex);

			// 找到最佳分割点
			let bestSplitPos = -1;
			for (const sep of separators) {
				const lastIndex = searchText.lastIndexOf(sep);
				if (lastIndex !== -1 && lastIndex > bestSplitPos) {
					bestSplitPos = lastIndex;
					break; // 使用第一个找到的分隔符（优先级高的）
				}
			}

			if (bestSplitPos !== -1) {
				endIndex = searchStart + bestSplitPos + 1;
			}
		}

		const chunkContent = cleanedText.slice(currentIndex, endIndex).trim();

		if (chunkContent.length > 0) {
			chunks.push({
				content: chunkContent,
				index: chunkIndex,
				metadata: {
					startIndex: currentIndex,
					endIndex,
					charCount: chunkContent.length,
				},
			});
			chunkIndex++;
		}

		// 移动到下一个位置，考虑重叠
		currentIndex = endIndex - chunkOverlap;

		// 确保不会无限循环
		if (currentIndex <= chunks[chunks.length - 1]?.metadata.startIndex) {
			currentIndex = endIndex;
		}
	}

	return chunks;
}

/**
 * 清理文本
 */
function cleanText(text: string): string {
	return text
		// 移除多余的空白
		.replace(/\s+/g, " ")
		// 移除连续的换行
		.replace(/\n{3,}/g, "\n\n")
		// 移除首尾空白
		.trim();
}

/**
 * 估算 token 数量（粗略估计）
 * 中文约 1 字 = 1-2 token，英文约 4 字符 = 1 token
 */
export function estimateTokens(text: string): number {
	const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
	const otherChars = text.length - chineseChars;

	return Math.ceil(chineseChars * 1.5 + otherChars / 4);
}

/**
 * 按 token 数量分块
 */
export function chunkByTokens(
	text: string,
	maxTokens: number = 500,
	overlapTokens: number = 50
): TextChunk[] {
	// 估算每个 token 对应的字符数
	const avgCharsPerToken = text.length / estimateTokens(text);
	const chunkSize = Math.floor(maxTokens * avgCharsPerToken);
	const overlap = Math.floor(overlapTokens * avgCharsPerToken);

	return chunkText(text, { chunkSize, chunkOverlap: overlap });
}

/**
 * 生成块的摘要提示（用于后续 AI 总结）
 */
export function generateChunkContext(
	chunk: TextChunk,
	documentTitle?: string,
	totalChunks?: number
): string {
	const parts: string[] = [];

	if (documentTitle) {
		parts.push(`文档: ${documentTitle}`);
	}

	if (totalChunks && totalChunks > 1) {
		parts.push(`片段 ${chunk.index + 1}/${totalChunks}`);
	}

	return parts.length > 0 ? `[${parts.join(" | ")}]\n${chunk.content}` : chunk.content;
}
