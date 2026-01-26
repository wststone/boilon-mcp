import { FileUp, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

interface FileUploadZoneProps {
	onUpload: (file: File) => Promise<void>;
	accept?: string;
	maxSize?: number;
	disabled?: boolean;
}

const SUPPORTED_TYPES = ".pdf,.txt,.md,.docx";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function FileUploadZone({
	onUpload,
	accept = SUPPORTED_TYPES,
	maxSize = MAX_FILE_SIZE,
	disabled = false,
}: FileUploadZoneProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState("");

	const validateFile = useCallback(
		(file: File): string | null => {
			const ext = file.name.split(".").pop()?.toLowerCase();
			const allowedExts = accept.split(",").map((s) => s.replace(".", ""));

			if (!allowedExts.includes(ext || "")) {
				return `不支持的文件类型，支持: ${allowedExts.join(", ").toUpperCase()}`;
			}

			if (file.size > maxSize) {
				return `文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`;
			}

			return null;
		},
		[accept, maxSize]
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);
			setError("");

			const file = e.dataTransfer.files[0];
			if (file) {
				const validationError = validateFile(file);
				if (validationError) {
					setError(validationError);
					return;
				}
				setSelectedFile(file);
			}
		},
		[validateFile]
	);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setError("");
			const file = e.target.files?.[0];
			if (file) {
				const validationError = validateFile(file);
				if (validationError) {
					setError(validationError);
					return;
				}
				setSelectedFile(file);
			}
		},
		[validateFile]
	);

	const handleUpload = async () => {
		if (!selectedFile) return;

		setIsUploading(true);
		setError("");

		try {
			await onUpload(selectedFile);
			setSelectedFile(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "上传失败");
		} finally {
			setIsUploading(false);
		}
	};

	const handleClearFile = () => {
		setSelectedFile(null);
		setError("");
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	};

	return (
		<div className="space-y-4">
			{/* Drop Zone */}
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
					isDragging
						? "border-cyan-500 bg-cyan-500/5"
						: "border-border hover:border-border"
				} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
			>
				<input
					type="file"
					accept={accept}
					onChange={handleFileSelect}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
					disabled={disabled || isUploading}
				/>

				<div className="flex flex-col items-center gap-4">
					<div
						className={`w-14 h-14 rounded-xl flex items-center justify-center ${
							isDragging ? "bg-cyan-500/20" : "bg-muted"
						}`}
					>
						<Upload
							className={`w-7 h-7 ${isDragging ? "text-cyan-600" : "text-muted-foreground"}`}
						/>
					</div>

					<div>
						<p className="text-foreground font-medium">
							{isDragging ? "松开鼠标上传文件" : "拖放文件到此处"}
						</p>
						<p className="text-sm text-muted-foreground mt-1">
							或点击选择文件 · 支持 PDF、TXT、MD、DOCX · 最大 50MB
						</p>
					</div>
				</div>
			</div>

			{/* Error Message */}
			{error && (
				<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
					{error}
				</div>
			)}

			{/* Selected File */}
			{selectedFile && (
				<div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
							<FileUp className="w-5 h-5 text-cyan-600" />
						</div>
						<div>
							<p className="text-sm font-medium text-foreground">
								{selectedFile.name}
							</p>
							<p className="text-xs text-muted-foreground">
								{formatFileSize(selectedFile.size)}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleClearFile}
							disabled={isUploading}
							className="text-muted-foreground hover:text-foreground hover:bg-muted"
						>
							<X className="w-4 h-4" />
						</Button>
						<Button
							onClick={handleUpload}
							disabled={isUploading}
							className="bg-cyan-500 hover:bg-cyan-600"
						>
							{isUploading ? "上传中..." : "开始上传"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
