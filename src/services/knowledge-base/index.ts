// 存储服务
export {
	uploadFile,
	getFileContent,
	getFileAsText,
	deleteFile,
	fileExists,
	extractKeyFromUrl,
} from "./storage";

// 解析服务
export {
	parseFile,
	getFileTypeFromName,
	isSupportedFileType,
	SUPPORTED_FILE_TYPES,
	type ParsedDocument,
} from "./parser";

// 分块服务
export {
	chunkText,
	chunkByTokens,
	estimateTokens,
	generateChunkContext,
	type ChunkOptions,
	type TextChunk,
} from "./chunker";

// 嵌入服务
export {
	generateEmbedding,
	generateEmbeddings,
	cosineSimilarity,
	getEmbeddingModelInfo,
	type EmbeddingResult,
} from "./embedder";

// 搜索服务
export {
	semanticSearch,
	keywordSearch,
	hybridSearch,
	globalSearch,
	getRelevantContext,
	type SearchOptions,
	type SearchResult,
} from "./search";

// 任务处理服务
export {
	processFileTask,
	createProcessTask,
	getTaskStatus,
	updateTaskStatus,
	deleteFileData,
	type TaskStatus,
	type TaskProgress,
} from "./task-processor";
