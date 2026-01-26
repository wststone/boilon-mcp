import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Eye, EyeOff, Key, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiKey, useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/api-keys")({
	component: ApiKeysPage,
});

type ApiKeyStatus = "active" | "expired" | "revoked";

function getKeyStatus(key: {
	enabled: boolean;
	expiresAt: Date | null;
}): ApiKeyStatus {
	if (!key.enabled) return "revoked";
	if (key.expiresAt && new Date(key.expiresAt) < new Date()) return "expired";
	return "active";
}

function formatDate(date: Date | string) {
	return new Date(date).toLocaleDateString("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

function formatLastUsed(date: Date | string | null) {
	if (!date) return "从未使用";
	const now = Date.now();
	const diff = now - new Date(date).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "刚刚";
	if (minutes < 60) return `${minutes} 分钟前`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} 小时前`;
	const days = Math.floor(hours / 24);
	return `${days} 天前`;
}

function ApiKeysPage() {
	const { data: session } = useSession();
	const queryClient = useQueryClient();
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newKeyName, setNewKeyName] = useState("");
	const [createdKey, setCreatedKey] = useState<string | null>(null);
	const [showKey, setShowKey] = useState(false);

	// 获取 API 密钥列表
	const {
		data: keys,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["api-keys"],
		queryFn: async () => {
			const result = await apiKey.list();
			if (result.error) throw new Error(result.error.message);
			return result.data ?? [];
		},
		enabled: !!session?.user,
	});

	// 创建密钥
	const createMutation = useMutation({
		mutationKey: ["api-keys", "create"],
		mutationFn: async (name: string) => {
			const result = await apiKey.create({
				name,
				expiresIn: 60 * 60 * 24 * 365, // 1 year
			});
			if (result.error) throw new Error(result.error.message);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["api-keys"] });
		},
	});

	// 撤销密钥（禁用）
	const revokeMutation = useMutation({
		mutationKey: ["api-keys", "revoke"],
		mutationFn: async (keyId: string) => {
			const result = await apiKey.update({
				keyId,
				enabled: false,
			});
			if (result.error) throw new Error(result.error.message);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["api-keys"] });
		},
	});

	// 删除密钥
	const deleteMutation = useMutation({
		mutationKey: ["api-keys", "delete"],
		mutationFn: async (keyId: string) => {
			const result = await apiKey.delete({
				keyId,
			});
			if (result.error) throw new Error(result.error.message);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["api-keys"] });
		},
	});

	const handleCreateKey = useCallback(async () => {
		if (!newKeyName.trim()) return;
		try {
			const data = await createMutation.mutateAsync(newKeyName);
			if (data?.key) {
				setCreatedKey(data.key);
			}
		} catch (err) {
			console.error("Failed to create API key:", err);
		}
	}, [newKeyName, createMutation]);

	const handleCopyKey = useCallback(() => {
		if (createdKey) {
			navigator.clipboard.writeText(createdKey);
		}
	}, [createdKey]);

	const handleRevokeKey = useCallback(
		(id: string) => {
			revokeMutation.mutate(id);
		},
		[revokeMutation],
	);

	const handleDeleteKey = useCallback(
		(id: string) => {
			deleteMutation.mutate(id);
		},
		[deleteMutation],
	);

	const closeModal = useCallback(() => {
		setShowCreateModal(false);
		setNewKeyName("");
		setCreatedKey(null);
		setShowKey(false);
	}, []);

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">API 密钥管理</h1>
					<p className="text-muted-foreground mt-1">
						创建和管理用于访问 MCP 服务的 API 密钥
					</p>
				</div>
				<Button
					className="bg-cyan-500 hover:bg-cyan-600"
					onClick={() => setShowCreateModal(true)}
				>
					<Plus className="w-4 h-4 mr-2" />
					创建密钥
				</Button>
			</div>

			{/* Info Banner */}
			<div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
				<div className="flex gap-3">
					<Key className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
					<div>
						<div className="text-sm font-medium text-cyan-600">
							API 密钥安全提示
						</div>
						<div className="text-sm text-muted-foreground mt-1">
							密钥只会在创建时显示一次，请妥善保管。建议为不同设备或环境创建独立的密钥，便于追踪和管理。
						</div>
					</div>
				</div>
			</div>

			{/* Keys Table */}
			<div className="bg-card border border-border rounded-xl overflow-hidden">
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
					</div>
				) : error ? (
					<div className="text-center py-12">
						<div className="text-red-400 text-sm">
							加载失败：{error.message}
						</div>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-border">
										<th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
											名称
										</th>
										<th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
											密钥
										</th>
										<th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
											状态
										</th>
										<th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
											调用次数
										</th>
										<th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
											最后使用
										</th>
										<th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
											创建时间
										</th>
										<th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
											操作
										</th>
									</tr>
								</thead>
								<tbody>
									{keys?.map((item) => {
										const status = getKeyStatus(item);
										return (
											<tr
												key={item.id}
												className="border-b border-border/50 last:border-0"
											>
												<td className="px-6 py-4">
													<div className="font-medium text-foreground">
														{item.name || "未命名密钥"}
													</div>
												</td>
												<td className="px-6 py-4">
													<code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
														{item.start || `${item.prefix ?? "mcp_"}****`}
													</code>
												</td>
												<td className="px-6 py-4">
													<KeyStatusBadge status={status} />
												</td>
												<td className="px-6 py-4 text-muted-foreground">
													{item.requestCount.toLocaleString()}
												</td>
												<td className="px-6 py-4 text-muted-foreground">
													{formatLastUsed(item.lastRequest)}
												</td>
												<td className="px-6 py-4 text-muted-foreground">
													{formatDate(item.createdAt)}
												</td>
												<td className="px-6 py-4 text-right">
													<div className="flex items-center justify-end gap-2">
														{status === "active" && (
															<Button
																variant="ghost"
																size="sm"
																className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
																onClick={() => handleRevokeKey(item.id)}
																disabled={revokeMutation.isPending}
															>
																撤销
															</Button>
														)}
														<Button
															variant="ghost"
															size="sm"
															className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
															onClick={() => handleDeleteKey(item.id)}
															disabled={deleteMutation.isPending}
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						{(!keys || keys.length === 0) && (
							<div className="text-center py-12">
								<Key className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
								<div className="text-muted-foreground">暂无 API 密钥</div>
								<div className="text-muted-foreground text-sm mt-1">
									创建第一个密钥以开始使用 MCP 服务
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* Create Modal */}
			{showCreateModal && (
				<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
					<div className="bg-card border border-border rounded-2xl w-full max-w-md">
						<div className="p-6 border-b border-border">
							<h2 className="text-xl font-semibold text-foreground">
								{createdKey ? "密钥已创建" : "创建新密钥"}
							</h2>
						</div>

						<div className="p-6">
							{!createdKey ? (
								<div className="space-y-4">
									<div>
										<Label className="text-foreground/70">密钥名称</Label>
										<Input
											placeholder="例如：生产环境 - 小智音箱"
											value={newKeyName}
											onChange={(e) => setNewKeyName(e.target.value)}
											className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground/60"
										/>
										<p className="text-xs text-muted-foreground mt-2">
											建议使用有意义的名称，便于后续管理和追踪
										</p>
									</div>
								</div>
							) : (
								<div className="space-y-4">
									<div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
										<div className="text-sm text-emerald-400 font-medium mb-2">
											请保存您的密钥
										</div>
										<div className="text-xs text-muted-foreground">
											这是密钥唯一一次显示的机会，请妥善保管。
										</div>
									</div>

									<div>
										<Label className="text-foreground/70">API 密钥</Label>
										<div className="mt-2 flex items-center gap-2">
											<code className="flex-1 bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground font-mono break-all">
												{showKey ? createdKey : "•".repeat(40)}
											</code>
											<Button
												variant="ghost"
												size="icon"
												className="text-muted-foreground hover:text-foreground"
												onClick={() => setShowKey(!showKey)}
											>
												{showKey ? (
													<EyeOff className="w-4 h-4" />
												) : (
													<Eye className="w-4 h-4" />
												)}
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="text-muted-foreground hover:text-foreground"
												onClick={handleCopyKey}
											>
												<Copy className="w-4 h-4" />
											</Button>
										</div>
									</div>
								</div>
							)}
						</div>

						<div className="p-6 border-t border-border flex justify-end gap-3">
							<Button
								variant="ghost"
								className="text-muted-foreground hover:text-foreground hover:bg-muted"
								onClick={closeModal}
							>
								{createdKey ? "完成" : "取消"}
							</Button>
							{!createdKey && (
								<Button
									className="bg-cyan-500 hover:bg-cyan-600"
									onClick={handleCreateKey}
									disabled={!newKeyName.trim() || createMutation.isPending}
								>
									{createMutation.isPending ? "创建中..." : "创建密钥"}
								</Button>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function KeyStatusBadge({ status }: { status: ApiKeyStatus }) {
	const config = {
		active: {
			bg: "bg-emerald-500/10 text-emerald-400",
			dot: "bg-emerald-400",
			label: "活跃",
		},
		expired: {
			bg: "bg-amber-500/10 text-amber-400",
			dot: "bg-amber-400",
			label: "已过期",
		},
		revoked: {
			bg: "bg-red-500/10 text-red-400",
			dot: "bg-red-400",
			label: "已撤销",
		},
	}[status];

	return (
		<span
			className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg}`}
		>
			<span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
			{config.label}
		</span>
	);
}
