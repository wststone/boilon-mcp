import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}


export function randomColor() {
	return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

export function fileSizeInMB(fileSize: number) {
	return (fileSize / 1024 / 1024).toFixed(2);
}

/**
 * 将 Float32Array 转换为 Uint8Array（16 位 PCM）
 * @param {Float32Array} float32Array - 输入的 Float32Array 音频数据
 * @returns {Uint8Array} - 转换后的 Uint8Array 16 位 PCM 数据
 */
export function convertFloat32ToUint8PCM(float32Array: Float32Array) {
	const buffer = new ArrayBuffer(float32Array.length * 2); // 每个样本 2 字节
	const view = new DataView(buffer);

	for (let i = 0; i < float32Array.length; i++) {
		let sample = float32Array[i];

		// 归一化到 16 位整数范围，并限制在 -1 到 1 之间
		sample = Math.max(-1, Math.min(1, sample));

		// 转换为 16 位有符号整数
		let intSample = sample < 0 ? sample * 32768 : sample * 32767;

		// 四舍五入并限制范围
		intSample = Math.round(intSample);
		intSample = Math.max(-32768, Math.min(32767, intSample));

		// 写入 DataView，使用小端字节序（little endian）
		view.setInt16(i * 2, intSample, true);
	}

	// 将 ArrayBuffer 转换为 Uint8Array
	return new Uint8Array(buffer);
}

interface UriParserResult {
	base64: string | null;
	mimeType: string | null;
	type: "url" | "base64" | null;
}

export const parseDataUri = (dataUri: string): UriParserResult => {
	// 正则表达式匹配整个 Data URI 结构
	const dataUriMatch = dataUri.match(/^data:([^;]+);base64,(.+)$/);

	if (dataUriMatch) {
		// 如果是合法的 Data URI
		return {
			base64: dataUriMatch[2],
			mimeType: dataUriMatch[1],
			type: "base64",
		};
	}

	try {
		new URL(dataUri);
		// 如果是合法的 URL
		return { base64: null, mimeType: null, type: "url" };
	} catch {
		// 既不是 Data URI 也不是合法 URL
		return { base64: null, mimeType: null, type: null };
	}
};

const CATEGORY_MIME_MAP = {
	audio: [
		"audio/mpeg",
		"audio/wav",
		"audio/x-wav",
		"audio/mp3",
		"audio/ogg",
		"audio/webm",
		"audio/flac",
		"audio/aac",
		"audio/x-aac",
		"audio/mp4",
		"audio/x-m4a",
		"audio/x-ms-wma",
		"audio/amr",
		"audio/3gpp",
		"audio/opus",
	],
	image: [
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/bmp",
		"image/svg+xml",
		"image/tiff",
		"image/x-icon",
		"image/heic",
		"image/heif",
	],
	video: [
		"video/mp4",
		"video/webm",
		"video/ogg",
		"video/quicktime",
		"video/x-msvideo",
		"video/x-ms-wmv",
		"video/mpeg",
		"video/3gpp",
		"video/3gpp2",
		"video/x-matroska",
		"video/avi",
	],
	document: [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-powerpoint",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		"text/rtf",
		"text/csv",
		"text/markdown",
		"application/epub+zip",
		"application/vnd.oasis.opendocument.text",
		"application/vnd.oasis.opendocument.spreadsheet",
		"application/vnd.oasis.opendocument.presentation",
		"application/json",
		"application/xml",
		"text/xml",
		"application/x-tex",
		"application/x-latex",
	],
} as Record<string, string[]>;

export function getFileCategory(mimeType: string) {
	if (typeof mimeType !== "string" || mimeType.trim() === "") {
		console.warn(
			`getFileCategory: Provided mimeType is not a valid string:`,
			mimeType,
		);
		return "unknown";
	}

	const slashIndex = mimeType.indexOf("/");
	if (slashIndex === -1) {
		console.warn(
			`getFileCategory: Provided mimeType does not contain a '/':`,
			mimeType,
		);
		return "unknown";
	}

	const type = mimeType.substring(0, slashIndex).toLowerCase();
	const subtype = mimeType.substring(slashIndex + 1).toLowerCase();

	if (!type || !subtype) {
		console.warn(
			`getFileCategory: mimeType is missing type or subtype:`,
			mimeType,
		);
		return "unknown";
	}

	switch (type) {
		case "image":
			return "image";
		case "audio":
			return "audio";
		case "video":
			return "video";
		case "application":
		case "text": {
			// Document type check for common document mime types
			const documentMimeTypes = [
				// PDF
				"application/pdf",
				// Word
				"application/msword",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				// Excel
				"application/vnd.ms-excel",
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				// PowerPoint
				"application/vnd.ms-powerpoint",
				"application/vnd.openxmlformats-officedocument.presentationml.presentation",
				// Text
				"text/plain",
				"text/csv",
				"text/markdown",
				// OpenDocument
				"application/vnd.oasis.opendocument.text",
				"application/vnd.oasis.opendocument.spreadsheet",
				"application/vnd.oasis.opendocument.presentation",
				// Rich Text
				"application/rtf",
				// EPUB
				"application/epub+zip",
				// XPS
				"application/vnd.ms-xpsdocument",
				// JSON
				"application/json",
				// XML
				"application/xml",
			];

			const fullMimeType = `${type}/${subtype}`;
			if (documentMimeTypes.includes(fullMimeType)) {
				return "document";
			}
			break;
		}

		default:
			console.info(
				`getFileCategory: Unrecognized mimeType category: '${type}' from '${mimeType}'`,
			);
			return "unknown";
	}

	// Fallback: try to match some common document subtypes by pattern
	const docSubtypes = [
		"pdf",
		"msword",
		"vnd.openxmlformats-officedocument.wordprocessingml.document",
		"vnd.ms-excel",
		"vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"vnd.ms-powerpoint",
		"vnd.openxmlformats-officedocument.presentationml.presentation",
		"rtf",
		"csv",
		"markdown",
		"epub+zip",
		"vnd.oasis.opendocument.text",
		"vnd.oasis.opendocument.spreadsheet",
		"vnd.oasis.opendocument.presentation",
		"json",
		"xml",
		"x-tex",
		"x-latex",
	];

	if (docSubtypes.some((docType) => subtype.includes(docType))) {
		return "document";
	}

	console.info(`getFileCategory: Could not categorize mimeType: '${mimeType}'`);

	return "unknown";
}

export function getMimeTypesForCategory(
	category: string,
): string[] | undefined {
	const normalized = category.toLowerCase();

	if (CATEGORY_MIME_MAP[normalized]) {
		return CATEGORY_MIME_MAP[normalized];
	}

	if (normalized === "all") {
		// Return all known mimetypes
		return Object.values(CATEGORY_MIME_MAP).flat();
	}

	return [];
}

/**
 * Sanitize UTF-8 string to remove all control characters and invalid code points.
 * @param str
 */
export const sanitizeUTF8 = (str: string) => {
	// 移除替换字符 (0xFFFD) 和其他非法字符
	return (
		str
			.replaceAll("�", "") // 移除 Unicode 替换字符
			// biome-ignore lint: no-control-regex
			.replaceAll(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "") // 移除控制字符
			.replaceAll(/[\uD800-\uDFFF]/g, "")
	); // 移除未配对的代理项码点
};
