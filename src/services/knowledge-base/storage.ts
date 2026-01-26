import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createServerFn } from "@tanstack/react-start";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { sessionAuthMiddleware } from "@/middleware";
import { db } from "@/db";
import { files } from "@/db/file";

const s3Client = new S3Client({
	endpoint: process.env.S3_ENDPOINT!,
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY_ID!,
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
	},
	region: process.env.S3_REGION || "us-east-1",
	forcePathStyle: true,
});

const bucket = process.env.S3_BUCKET!;

/**
 * 上传文件到 S3 Storage
 */
export async function uploadFile(
	file: File,
	userId: string,
	fileName?: string,
): Promise<{ url: string; key: string }> {
	// 使用 UUID 作为文件名，避免中文等特殊字符导致 S3 报错
	const originalName = fileName || file.name;
	const extension = originalName.split(".").at(-1);
	const key = `${userId}/${Date.now()}-${uuidv4()}${extension ? `.${extension}` : ""}`;

	const buffer = await file.arrayBuffer();
	await s3Client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: Buffer.from(buffer),
			ContentType: file.type,
		}),
	);

	const url = `${process.env.S3_ENDPOINT}/${bucket}/${key}`;
	return { url, key };
}

/**
 * 获取文件内容
 */
export async function getFileContent(key: string): Promise<ArrayBuffer> {
	const response = await s3Client.send(
		new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		}),
	);
	const bytes = await response.Body!.transformToByteArray();
	return bytes.buffer as ArrayBuffer;
}

/**
 * 获取文件作为文本
 */
export async function getFileAsText(key: string): Promise<string> {
	const response = await s3Client.send(
		new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		}),
	);
	return await response.Body!.transformToString();
}

/**
 * 删除文件
 */
export async function deleteFile(key: string): Promise<void> {
	await s3Client.send(
		new DeleteObjectCommand({
			Bucket: bucket,
			Key: key,
		}),
	);
}

/**
 * 检查文件是否存在
 */
export async function fileExists(key: string): Promise<boolean> {
	try {
		await s3Client.send(
			new HeadObjectCommand({
				Bucket: bucket,
				Key: key,
			}),
		);
		return true;
	} catch {
		return false;
	}
}

/**
 * 从 URL 提取存储 key
 */
export function extractKeyFromUrl(url: string): string {
	const bucketName = process.env.S3_BUCKET || "knowledge-base";
	const pattern = new RegExp(`/${bucketName}/(.+)$`);
	const match = url.match(pattern);
	return match ? match[1] : url;
}

export const $createSignedUrl = createServerFn({ method: "POST" })
	.middleware([sessionAuthMiddleware])
	.inputValidator(
		z.object({
			pathname: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		const command = new PutObjectCommand({
			Bucket: bucket,
			Key: data.pathname,
		});
		const signedUrl = await getSignedUrl(s3Client, command, {
			expiresIn: 3600,
		});

		return signedUrl;
	});

export const $createFile = createServerFn({ method: "POST" })
	.middleware([sessionAuthMiddleware])
	.inputValidator(
		z.object({
			fileUrl: z.string(),
			fileType: z.string(),
			name: z.string(),
			size: z.number(),
			metadata: z.record(z.string(), z.unknown()).nullish(),
		}),
	)
	.handler(async ({ context, data }) => {
		const [result] = await db
			.insert(files)
			.values({
				userId: context.userId,
				fileType: data.fileType,
				name: data.name,
				size: data.size,
				url: data.fileUrl,
				metadata: data.metadata ?? undefined,
			})
			.returning();

		return result;
	});
