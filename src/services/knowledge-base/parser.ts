import { createServerOnlyFn } from "@tanstack/react-start";
import JSZip from "jszip";
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
 * DOCX 是 ZIP 格式，文本内容在 word/document.xml 的 <w:t> 元素中
 */
async function parseDOCX(content: ArrayBuffer): Promise<ParsedDocument> {
	const zip = await JSZip.loadAsync(content);
	const docXml = zip.file("word/document.xml");
	if (!docXml) {
		throw new Error("无效的 DOCX 文件：缺少 word/document.xml");
	}

	const xml = await docXml.async("string");

	// 提取 <w:t> 元素中的文本，<w:br/> 和 </w:p> 作为换行
	const text = xml
		.replace(/<w:br\b[^>]*\/>/gi, "\n")
		.replace(/<\/w:p>/gi, "\n")
		.replace(/<w:tab\/>/gi, "\t")
		.replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi, "$1")
		.replace(/<[^>]+>/g, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim();

	return {
		content: text,
		metadata: {
			wordCount: countWords(text),
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

