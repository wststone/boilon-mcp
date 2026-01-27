/**
 * 支持的文件类型列表
 */
export const SUPPORTED_FILE_TYPES = ["pdf", "txt", "md", "markdown", "docx"];

/**
 * 根据文件扩展名获取文件类型
 */
export function getFileTypeFromName(filename: string): string {
	const ext = filename.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "pdf":
			return "pdf";
		case "txt":
			return "txt";
		case "md":
		case "markdown":
			return "md";
		case "docx":
			return "docx";
		default:
			return ext || "unknown";
	}
}

/**
 * 检查文件类型是否支持
 */
export function isSupportedFileType(filename: string): boolean {
	const ext = filename.split(".").pop()?.toLowerCase();
	return SUPPORTED_FILE_TYPES.includes(ext || "");
}
