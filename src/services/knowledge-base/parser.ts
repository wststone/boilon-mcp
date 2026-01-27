import { createServerOnlyFn } from "@tanstack/react-start";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { getFileContent } from "./storage";

export interface ParsedDocument {
	content: string;
	metadata: {
		pageCount?: number;
		wordCount: number;
		title?: string;
	};
}

/**
 * 解析文件内容
 */
export const parseFile = createServerOnlyFn(
	async (fileKey: string, fileType: string) => {
		const content = await getFileContent(fileKey);

		switch (fileType.toLowerCase()) {
			case "pdf":
				return parsePDF(content);
			case "txt":
			case "text":
				return parseTXT(content);
			case "md":
			case "markdown":
				return parseMD(content);
			case "docx":
				return parseDOCX(content);
			default:
				throw new Error(`不支持的文件类型: ${fileType}`);
		}
	},
);

/**
 * 解析 PDF 文件
 */
async function parsePDF(content: ArrayBuffer): Promise<ParsedDocument> {
	const buffer = Buffer.from(content);
	const data = await new PDFParse({ data: buffer }).getText();

	return {
		content: data.text,
		metadata: {
			pageCount: data.total,
			wordCount: countWords(data.text),
		},
	};
}

/**
 * 解析纯文本文件
 */
async function parseTXT(content: ArrayBuffer): Promise<ParsedDocument> {
	const text = new TextDecoder().decode(content);

	return {
		content: text,
		metadata: {
			wordCount: countWords(text),
		},
	};
}

/**
 * 解析 Markdown 文件
 */
async function parseMD(content: ArrayBuffer): Promise<ParsedDocument> {
	const text = new TextDecoder().decode(content);

	// 提取标题（第一个 # 开头的行）
	const titleMatch = text.match(/^#\s+(.+)$/m);
	const title = titleMatch ? titleMatch[1] : undefined;

	return {
		content: text,
		metadata: {
			wordCount: countWords(text),
			title,
		},
	};
}

/**
 * 解析 DOCX 文件
 */
async function parseDOCX(content: ArrayBuffer): Promise<ParsedDocument> {
	const buffer = Buffer.from(content);
	const result = await mammoth.extractRawText({ buffer });

	return {
		content: result.value,
		metadata: {
			wordCount: countWords(result.value),
		},
	};
}

/**
 * 统计字数（支持中英文）
 */
function countWords(text: string): number {
	// 中文字符数
	const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
	// 英文单词数
	const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

	return chineseChars + englishWords;
}

