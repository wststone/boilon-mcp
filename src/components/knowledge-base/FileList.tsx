import {
	AlertCircle,
	CheckCircle2,
	Clock,
	FileText,
	Loader2,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FileItem {
	id: string;
	name: string;
	fileType: string;
	size: number;
	createdAt: string;
	taskStatus?: {
		status: string;
		error?: string;
	} | null;
}

interface FileListProps {
	files: FileItem[];
	onDelete: (fileId: string) => Promise<void>;
	isLoading?: boolean;
}

export function FileList({ files, onDelete, isLoading = false }: FileListProps) {
	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusBadge = (taskStatus: FileItem["taskStatus"]) => {
		if (!taskStatus) {
			return (
				<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
					<Clock className="w-3 h-3" />
					等待处理
				</span>
			);
		}

		switch (taskStatus.status) {
			case "completed":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
						<CheckCircle2 className="w-3 h-3" />
						已就绪
					</span>
				);
			case "processing":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400">
						<Loader2 className="w-3 h-3 animate-spin" />
						处理中
					</span>
				);
			case "failed":
				return (
					<span
						className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400"
						title={taskStatus.error}
					>
						<AlertCircle className="w-3 h-3" />
						处理失败
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
						<Clock className="w-3 h-3" />
						{taskStatus.status}
					</span>
				);
		}
	};

	const getFileIcon = (fileType: string) => {
		const colorMap: Record<string, string> = {
			pdf: "text-red-400",
			txt: "text-blue-400",
			md: "text-purple-400",
			docx: "text-indigo-400",
		};
		return (
			<FileText
				className={`w-5 h-5 ${colorMap[fileType.toLowerCase()] || "text-gray-400"}`}
			/>
		);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
			</div>
		);
	}

	if (files.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
					<FileText className="w-7 h-7 text-muted-foreground/60" />
				</div>
				<p className="text-muted-foreground">暂无文件</p>
				<p className="text-sm text-muted-foreground/60 mt-1">上传文件开始构建知识库</p>
			</div>
		);
	}

	return (
		<div className="bg-card border border-border rounded-xl overflow-hidden">
			<table className="w-full">
				<thead>
					<tr className="border-b border-border">
						<th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
							文件名
						</th>
						<th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
							类型
						</th>
						<th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
							大小
						</th>
						<th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
							状态
						</th>
						<th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
							上传时间
						</th>
						<th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
							操作
						</th>
					</tr>
				</thead>
				<tbody>
					{files.map((file) => (
						<tr
							key={file.id}
							className="border-b border-border/50 last:border-0 hover:bg-accent transition-colors"
						>
							<td className="px-6 py-4">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
										{getFileIcon(file.fileType)}
									</div>
									<span className="text-sm font-medium text-foreground truncate max-w-[200px]">
										{file.name}
									</span>
								</div>
							</td>
							<td className="px-6 py-4">
								<span className="text-sm text-muted-foreground uppercase">
									{file.fileType}
								</span>
							</td>
							<td className="px-6 py-4">
								<span className="text-sm text-muted-foreground">
									{formatFileSize(file.size)}
								</span>
							</td>
							<td className="px-6 py-4">{getStatusBadge(file.taskStatus)}</td>
							<td className="px-6 py-4">
								<span className="text-sm text-muted-foreground">
									{formatDate(file.createdAt)}
								</span>
							</td>
							<td className="px-6 py-4 text-right">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onDelete(file.id)}
									className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
								>
									<Trash2 className="w-4 h-4" />
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
