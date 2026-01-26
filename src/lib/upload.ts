import { format } from "date-fns";
import { v4 } from "uuid";

import {
	$createFile,
	$createSignedUrl,
} from "@/services/knowledge-base/storage";

import { parseDataUri } from "@/lib/utils";

export const UPLOAD_NETWORK_ERROR = "NetWorkError";

export type UploadSuccessResult = Awaited<
	ReturnType<typeof uploadService.uploadWithProgress>
>;

export interface UploadFileItem {
	file: File;
	/**
	 * the file url after upload,it will be s3 url
	 * if enable the S3 storage, or the data is same as base64Url
	 */
	fileUrl?: string;
	id: string;
	/**
	 * blob url for local preview
	 * it will use in the file preview before send the message
	 */
	previewUrl?: string;
	status: FileUploadStatus;
	uploadState?: FileUploadState;
}

export type FileUploadStatus =
	| "pending"
	| "uploading"
	| "processing"
	| "success"
	| "error";

interface UploadFileToS3Options {
	directory?: string;
	filename?: string;
	onNotSupported?: () => void;
	onProgress?: (status: FileUploadStatus, state: FileUploadState) => void;
	pathname?: string;
	skipCheckFileType?: boolean;
}

export interface FileUploadState {
	progress: number;
	/**
	 * rest time in s
	 */
	restTime: number;
	/**
	 * upload speed in Byte/s
	 */
	speed: number;
}

type FileMetadata = {
	date: string;
	dirname: string;
	filename: string;
	pathname: string;
};

type UploadBase64ToS3Result = {
	fileType: string;
	metadata: FileMetadata;
	size: number;
};

class UploadService {
	/**
	 * uniform upload method for both server and client
	 */
	uploadFileToS3 = async (
		file: File,
		{
			onProgress,
			directory,
			skipCheckFileType,
			onNotSupported,
			pathname,
		}: UploadFileToS3Options,
	): Promise<{ data: FileMetadata; success: boolean }> => {
		const data = await this.uploadToServerS3(file, {
			directory,
			onProgress,
			pathname,
		});

		return { data, success: true };
	};

	uploadBase64ToS3 = async (
		base64Data: string,
		options: UploadFileToS3Options = {},
	): Promise<UploadBase64ToS3Result> => {
		// 解析 base64 数据
		const { base64, mimeType, type } = parseDataUri(base64Data);

		if (!base64 || !mimeType || type !== "base64") {
			throw new Error("Invalid base64 data for image");
		}

		// 将 base64 转换为 Blob
		const byteCharacters = atob(base64);
		const byteArrays = [];

		// 分块处理以避免内存问题
		for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
			const slice = byteCharacters.slice(offset, offset + 1024);

			const byteNumbers: number[] = Array.from({ length: slice.length });
			for (let i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			const byteArray = new Uint8Array(byteNumbers);
			byteArrays.push(byteArray);
		}

		const blob = new Blob(byteArrays, { type: mimeType });

		// 确定文件扩展名
		const fileExtension = mimeType.split("/")[1] || "png";
		const fileName = `${
			options.filename || `image_${format(new Date(), "yyyy-MM-dd-HH-mm-ss")}`
		}.${fileExtension}`;

		// 创建文件对象
		const file = new File([blob], fileName, { type: mimeType });

		// 使用统一的上传方法
		const { data: metadata } = await this.uploadFileToS3(file, options);

		return {
			fileType: mimeType,
			metadata,
			size: file.size,
		};
	};

	uploadDataToS3 = async (
		data: object,
		options: UploadFileToS3Options = {},
	) => {
		const blob = new Blob([JSON.stringify(data)], {
			type: "application/json",
		});
		const file = new File([blob], options.filename || "data.json", {
			type: "application/json",
		});

		return await this.uploadFileToS3(file, options);
	};

	uploadToServerS3 = async (
		file: File,
		{
			onProgress,
			directory,
			pathname,
		}: {
			directory?: string;
			onProgress?: (status: FileUploadStatus, state: FileUploadState) => void;
			pathname?: string;
		} = {},
	): Promise<FileMetadata & { preSignUrl: string }> => {
		const xhr = new XMLHttpRequest();

		const getSignedUrlResult = await this.getSignedUploadUrl(file, {
			directory,
			pathname,
		});

		const { preSignUrl, ...result } = getSignedUrlResult;

		const startTime = Date.now();

		xhr.upload.addEventListener("progress", (event) => {
			if (event.lengthComputable) {
				const progress = Number(
					((event.loaded / event.total) * 100).toFixed(1),
				);

				const speedInByte = event.loaded / ((Date.now() - startTime) / 1000);

				onProgress?.("uploading", {
					// if the progress is 100, it means the file is uploaded
					// but the server is still processing it
					// so make it as 99.9 and let users think it's still uploading
					progress: progress === 100 ? 99.9 : progress,
					restTime: (event.total - event.loaded) / speedInByte,
					speed: speedInByte,
				});
			}
		});

		xhr.open("PUT", preSignUrl);
		xhr.setRequestHeader("Content-Type", file.type);
		const data = await file.arrayBuffer();

		await new Promise((resolve, reject) => {
			xhr.addEventListener("load", () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					onProgress?.("success", {
						progress: 100,
						restTime: 0,
						speed: file.size / ((Date.now() - startTime) / 1000),
					});
					resolve(xhr.response);
				} else {
					reject(xhr.statusText);
				}
			});
			xhr.addEventListener("error", () => {
				if (xhr.status === 0) reject(UPLOAD_NETWORK_ERROR);
				else reject(xhr.statusText);
			});
			xhr.send(data);
		});

		return getSignedUrlResult;
	};

	/**
	 * get image File item with cors image URL
	 * @param url
	 * @param filename
	 * @param fileType
	 */
	getImageFileByUrlWithCORS = async (
		url: string,
		filename: string,
		fileType = "image/png",
	) => {
		const proxyEndpoint = "/api/proxy";

		const res = await fetch(proxyEndpoint, {
			body: url,
			method: "POST",
		});

		const data = await res.arrayBuffer();

		return new File([data], filename, {
			lastModified: Date.now(),
			type: fileType,
		});
	};

	private generateFilePathMetadata(
		originalFilename: string,
		options: { directory?: string; pathname?: string } = {},
	): {
		date: string;
		dirname: string;
		filename: string;
		pathname: string;
	} {
		// Generate unique filename with UUID prefix and original extension
		const extension = originalFilename.split(".").at(-1);
		const filename = `${v4()}.${extension}`;

		// Generate timestamp-based directory path
		const date = (Date.now() / 1000 / 60 / 60).toFixed(0);
		const dirname = `${options.directory}/${date}`;

		const pathname = options.pathname ?? `${dirname}/${filename}`;

		return {
			date,
			dirname,
			filename,
			pathname,
		};
	}

	private getSignedUploadUrl = async (
		file: File,
		options: { directory?: string; pathname?: string } = {},
	): Promise<
		FileMetadata & {
			preSignUrl: string;
		}
	> => {
		const fileMetadata = this.generateFilePathMetadata(file.name, options);
		const preSignUrl = await $createSignedUrl({
			data: { pathname: fileMetadata.pathname },
		});

		return {
			preSignUrl,
			...fileMetadata,
		};
	};

	public async uploadWithProgress(
		file: File,
		{
			onStatusUpdate,
		}: {
			onStatusUpdate?: (status: UploadFileItem) => void;
		} = {},
	) {
		const id = v4();

		onStatusUpdate?.({
			id,
			file,
			status: "pending",
			uploadState: {
				progress: 0,
				restTime: 0,
				speed: 0,
			},
		});

		const uploadResult = await this.uploadToServerS3(file, {
			directory: "uploads",
			onProgress: (status, state) => {
				onStatusUpdate?.({
					id,
					file,
					status,
					uploadState: state,
				});
			},
		});

		return await $createFile({
			data: {
				fileUrl: `${this.getBaseURL(uploadResult.preSignUrl)}/${
					uploadResult.pathname
				}`,
				fileType: file.type,
				name: file.name,
				size: file.size,
			},
		});
	}

	private getBaseURL(url: string) {
		return new URL(url).origin;
	}
}

export const uploadService = new UploadService();
