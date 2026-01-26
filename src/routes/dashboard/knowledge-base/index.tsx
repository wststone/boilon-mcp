import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CreateKBModal } from "@/components/knowledge-base";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import {
	$createKnowledgeBase,
	$deleteKnowledgeBase,
	$listKnowledgeBases,
	type KnowledgeBaseWithFileCount,
} from "@/server/knowledge-base";

export const Route = createFileRoute("/dashboard/knowledge-base/")({
	component: KnowledgeBaseListPage,
});

function KnowledgeBaseListPage() {
	const { data: session, isPending: isSessionPending } = useSession();
	const [showCreateModal, setShowCreateModal] = useState(false);

	// 获取知识库列表
	const {
		data: knowledgeBases,
		isLoading,
		error,
	} = useQuery<KnowledgeBaseWithFileCount[]>({
		queryKey: ["knowledge-bases"],
		queryFn: () =>
			$listKnowledgeBases() as Promise<KnowledgeBaseWithFileCount[]>,
		enabled: !!session?.user,
	});

	// 创建知识库
	const createMutation = useMutation({
		mutationKey: ["knowledge-bases", "create"],
		mutationFn: (data: { name: string; description: string }) =>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			($createKnowledgeBase as any)({ data }),
	});

	// 删除知识库
	const deleteMutation = useMutation({
		mutationKey: ["knowledge-bases", "delete"],
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mutationFn: (id: string) => ($deleteKnowledgeBase as any)({ data: { id } }),
	});

	const handleCreate = async (data: { name: string; description: string }) => {
		await createMutation.mutateAsync(data);
	};

	const handleDelete = async (id: string, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (confirm("确定要删除这个知识库吗？相关的所有文件和数据都将被删除。")) {
			await deleteMutation.mutateAsync(id);
		}
	};

	// 如果未登录
	if (!isSessionPending && !session?.user) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
				<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-6">
					<Database className="w-8 h-8 text-white" />
				</div>
				<h1 className="text-3xl font-bold text-foreground mb-4">知识库</h1>
				<p className="text-muted-foreground max-w-md mb-8">
					登录后即可创建和管理你的知识库，上传文档并进行语义搜索。
				</p>
				<Link to="/auth/login">
					<Button className="bg-cyan-500 hover:bg-cyan-600">登录账号</Button>
				</Link>
			</div>
		);
	}

	const formatDate = (date: Date | string) => {
		const d = date instanceof Date ? date : new Date(date);
		return d.toLocaleDateString("zh-CN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<>
			<div className="space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-foreground">知识库</h1>
						<p className="text-muted-foreground mt-1">
							创建知识库，上传文档，进行智能语义搜索
						</p>
					</div>
					<Button
						onClick={() => setShowCreateModal(true)}
						className="bg-cyan-500 hover:bg-cyan-600"
					>
						<Plus className="w-4 h-4 mr-2" />
						创建知识库
					</Button>
				</div>

				{/* Error */}
				{error && (
					<div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
						{error instanceof Error ? error.message : "加载失败"}
					</div>
				)}

				{/* Loading */}
				{isLoading && (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
					</div>
				)}

				{/* Knowledge Base Grid */}
				{!isLoading && knowledgeBases && (
					<>
						{knowledgeBases.length === 0 ? (
							<div className="text-center py-20 bg-card border border-border rounded-xl">
								<div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
									<Database className="w-8 h-8 text-muted-foreground/60" />
								</div>
								<h3 className="text-lg font-medium text-foreground mb-2">
									还没有知识库
								</h3>
								<p className="text-muted-foreground mb-6">
									创建你的第一个知识库，开始构建智能问答系统
								</p>
								<Button
									onClick={() => setShowCreateModal(true)}
									className="bg-cyan-500 hover:bg-cyan-600"
								>
									<Plus className="w-4 h-4 mr-2" />
									创建知识库
								</Button>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{knowledgeBases.map((kb) => (
									<Link
										key={kb.id}
										to="/dashboard/knowledge-base/$id"
										params={{ id: kb.id }}
										className="block"
									>
										<div className="bg-card border border-border rounded-xl p-6 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group">
											{/* Icon & Actions */}
											<div className="flex items-start justify-between mb-4">
												<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
													<Database className="w-6 h-6 text-white" />
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={(e) => handleDelete(kb.id, e)}
													className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>

											{/* Info */}
											<h3 className="text-lg font-semibold text-foreground mb-1">
												{kb.name}
											</h3>
											{kb.description && (
												<p className="text-sm text-muted-foreground line-clamp-2 mb-4">
													{kb.description}
												</p>
											)}

											{/* Stats */}
											<div className="flex items-center gap-4 pt-4 border-t border-border/50">
												<div className="flex items-center gap-1.5 text-muted-foreground">
													<FileText className="w-4 h-4" />
													<span className="text-sm">{kb.fileCount} 个文件</span>
												</div>
												<div className="text-sm text-muted-foreground/60">
													{formatDate(kb.updatedAt)}
												</div>
											</div>
										</div>
									</Link>
								))}
							</div>
						)}
					</>
				)}
			</div>

			{/* Create Modal */}
			<CreateKBModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onSubmit={handleCreate}
			/>
		</>
	);
}
