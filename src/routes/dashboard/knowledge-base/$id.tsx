import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Database, Loader2, Settings } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
	type FileItem,
	FileList,
	FileUploadZone,
	SearchInterface,
	type SearchResult,
} from "@/components/knowledge-base";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import {
	$getKnowledgeBase,
	type GetKnowledgeBaseInput,
	type KnowledgeBase,
} from "@/server/knowledge-base";

export const Route = createFileRoute("/dashboard/knowledge-base/$id")({
	component: KnowledgeBaseDetailPage,
});

function KnowledgeBaseDetailPage() {
	const { id } = Route.useParams();
	const { data: session, isPending: isSessionPending } = useSession();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<"files" | "search">("files");

	// 获取知识库详情
	const {
		data: kb,
		isLoading: isKbLoading,
		error: kbError,
	} = useQuery<KnowledgeBase>({
		queryKey: ["knowledge-base", id],
		queryFn: () =>
			(
				$getKnowledgeBase as unknown as (opts: {
					data: GetKnowledgeBaseInput;
				}) => Promise<KnowledgeBase>
			)({
				data: { id },
			}),
		enabled: !!id,
	});

	// 获取文件列表
	const {
		data: files,
		isLoading: isFilesLoading,
		error: filesError,
	} = useQuery<FileItem[]>({
		queryKey: ["knowledge-base-files", id],
		queryFn: async () => {
			const res = await fetch(`/api/knowledge-base/${id}/files`);
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "获取文件列表失败");
			}
			const data = await res.json();
			return data.data;
		},
		enabled: !!session?.user && !!id,
		refetchInterval: (query) => {
			// 如果有处理中的文件，每2秒刷新一次
			const data = query.state.data as FileItem[] | undefined;
			if (
				data?.some(
					(f) => f.taskStatus?.status === "processing" || !f.taskStatus,
				)
			) {
				return 2000;
			}
			return false;
		},
	});

	// 上传文件
	const uploadMutation = useMutation({
		mutationKey: ["knowledge-base-files", "upload"],
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);

			const res = await fetch(`/api/knowledge-base/${id}/files`, {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "上传失败");
			}

			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["knowledge-base-files", id] });
		},
	});

	// 删除文件
	const deleteMutation = useMutation({
		mutationKey: ["knowledge-base-files", "delete"],
		mutationFn: async (fileId: string) => {
			const res = await fetch(`/api/knowledge-base/${id}/files/${fileId}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "删除失败");
			}

			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["knowledge-base-files", id] });
		},
	});

	// 搜索
	const handleSearch = async (query: string): Promise<SearchResult[]> => {
		const res = await fetch(`/api/knowledge-base/${id}/search`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query, limit: 10 }),
		});

		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.error || "搜索失败");
		}

		const data = await res.json();
		return data.data.results;
	};

	const handleUpload = async (file: File) => {
		await uploadMutation.mutateAsync(file);
	};

	const handleDelete = async (fileId: string) => {
		if (confirm("确定要删除这个文件吗？")) {
			await deleteMutation.mutateAsync(fileId);
		}
	};

	// 如果未登录
	if (!isSessionPending && !session?.user) {
		return (
			<DashboardLayout>
				<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
					<p className="text-muted-foreground">请先登录</p>
					<Link to="/auth/login">
						<Button className="mt-4 bg-cyan-500 hover:bg-cyan-600">
							登录账号
						</Button>
					</Link>
				</div>
			</DashboardLayout>
		);
	}

	// 加载中
	if (isKbLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center py-20">
					<Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
				</div>
			</DashboardLayout>
		);
	}

	// 错误或未找到
	if (kbError || !kb) {
		return (
			<DashboardLayout>
				<div className="text-center py-20">
					<p className="text-red-400 mb-4">
						{kbError instanceof Error ? kbError.message : "知识库不存在"}
					</p>
					<Link to="/dashboard/knowledge-base">
						<Button variant="outline" className="border-border text-foreground">
							<ArrowLeft className="w-4 h-4 mr-2" />
							返回列表
						</Button>
					</Link>
				</div>
			</DashboardLayout>
		);
	}

	// 检查是否有就绪的文件（可以搜索）
	const hasReadyFiles = files?.some(
		(f) => f.taskStatus?.status === "completed",
	);

	return (
		<DashboardLayout>
			<div className="space-y-8">
				{/* Header */}
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-4">
						<Link to="/dashboard/knowledge-base">
							<Button
								variant="ghost"
								size="sm"
								className="text-muted-foreground hover:text-foreground hover:bg-muted"
							>
								<ArrowLeft className="w-4 h-4" />
							</Button>
						</Link>
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
								<Database className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-foreground">
									{kb.name}
								</h1>
								{kb.description && (
									<p className="text-muted-foreground mt-1">{kb.description}</p>
								)}
							</div>
						</div>
					</div>
					<Button
						variant="outline"
						className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
					>
						<Settings className="w-4 h-4 mr-2" />
						设置
					</Button>
				</div>

				{/* Tabs */}
				<div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
					<button
						onClick={() => setActiveTab("files")}
						className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
							activeTab === "files"
								? "bg-cyan-500 text-white"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						文件管理
					</button>
					<button
						onClick={() => setActiveTab("search")}
						className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
							activeTab === "search"
								? "bg-cyan-500 text-white"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						搜索测试
					</button>
				</div>

				{/* Content */}
				{activeTab === "files" && (
					<div className="space-y-6">
						{/* Upload Zone */}
						<FileUploadZone
							onUpload={handleUpload}
							disabled={uploadMutation.isPending}
						/>

						{/* File List */}
						<div>
							<h2 className="text-lg font-semibold text-foreground mb-4">
								文件列表
							</h2>
							{filesError && (
								<div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
									{filesError instanceof Error
										? filesError.message
										: "加载文件列表失败"}
								</div>
							)}
							<FileList
								files={files || []}
								onDelete={handleDelete}
								isLoading={isFilesLoading}
							/>
						</div>
					</div>
				)}

				{activeTab === "search" && (
					<div>
						{!hasReadyFiles ? (
							<div className="text-center py-12 bg-card border border-border rounded-xl">
								<Database className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
								<p className="text-muted-foreground">暂无可搜索的文件</p>
								<p className="text-sm text-muted-foreground/60 mt-1">
									请先上传文件并等待处理完成
								</p>
								<Button
									onClick={() => setActiveTab("files")}
									className="mt-4 bg-cyan-500 hover:bg-cyan-600"
								>
									上传文件
								</Button>
							</div>
						) : (
							<SearchInterface onSearch={handleSearch} />
						)}
					</div>
				)}
			</div>
		</DashboardLayout>
	);
}
