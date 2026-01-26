import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import {
	type UploadFileItem,
	type UploadSuccessResult,
	uploadService,
} from "@/lib/upload";

export const useUploadFile = ({
	onSuccess,
}: {
	onSuccess?: (file: UploadSuccessResult) => void;
} = {}) => {
	const [file, setFile] = useState<UploadFileItem>();

	const uploadFileMutation = useMutation({
		mutationKey: ["files", "upload"],
		mutationFn: async (file: File) => {
			const uploadResult = await uploadService.uploadWithProgress(file, {
				onStatusUpdate: (file) => {
					setFile((prevFile) => {
						if (prevFile) {
							return file;
						}
						return file;
					});
				},
			});

			// The uploadResult is not an UploadFileItem, so we need to construct one.
			setFile((prev) => {
				if (!prev) return prev;

				return {
					...prev,
					fileUrl: uploadResult.url,
					status: "success",
				};
			});

			return uploadResult;
		},
		onSuccess,
	});

	const resetFile = useCallback(() => setFile(undefined), []);

	return {
		...uploadFileMutation,
		file,
		resetFile,
	};
};

export const useUploadMutipleFiles = () => {
	const [files, setFiles] = useState<UploadFileItem[]>([]);

	const uploadFileMutation = useMutation({
		mutationKey: ["files", "upload"],
		mutationFn: async (files: File[]) => {
			const uploadResults = await Promise.all(
				files.map(async (file) => {
					const uploadResult = await uploadService.uploadWithProgress(file, {
						onStatusUpdate: (file) => {
							setFiles((prevFiles) => {
								const index = prevFiles.findIndex((f) => f.id === file.id);

								if (index === -1) {
									return [...prevFiles, file];
								}

								return prevFiles.map((f) => {
									if (f.id === file.id) {
										return { ...f, ...file };
									}
									return f;
								});
							});
						},
					});

					// The uploadResult is not an UploadFileItem, so we need to construct one.
					setFiles((prevFiles) => {
						return prevFiles.map((f) => {
							if (f.id === uploadResult.id) {
								return { ...f, fileUrl: uploadResult.url, status: "success" };
							}
							return f;
						});
					});

					return uploadResult;
				}),
			);

			return uploadResults;
		},
	});

	const resetFiles = useCallback(() => setFiles([]), []);
	const removeFile = useCallback(
		(id: string) =>
			setFiles((prevFiles) => prevFiles.filter((f) => f.id !== id)),
		[],
	);

	return {
		...uploadFileMutation,
		files,
		resetFiles,
		removeFile,
	};
};
