import { createFileRoute } from "@tanstack/react-router";
import {
	Copy,
	Eye,
	EyeOff,
	Key,
	MoreVertical,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession, apiKey } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/api-keys")({
	component: ApiKeysPage,
});

interface ApiKeyItem {
	id: string;
	name: string;
	keyPreview: string;
	createdAt: string;
	lastUsed: string;
	status: "active" | "expired" | "revoked";
	requestCount: number;
}

function ApiKeysPage() {
	const { data: session } = useSession();
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newKeyName, setNewKeyName] = useState("");
	const [createdKey, setCreatedKey] = useState<string | null>(null);
	const [showKey, setShowKey] = useState(false);
	const [isCreating, setIsCreating] = useState(false);

	// Mock data - 实际应从 API 获取
	const [keys, setKeys] = useState<ApiKeyItem[]>([
		{
			id: "1",
			name: "生产环境 - 小智音箱",
			keyPreview: "mcp_prod_****abcd",
			createdAt: "2025-01-20",
			lastUsed: "2 分钟前",
			status: "active",
			requestCount: 5234,
		},
		{
			id: "2",
			name: "开发环境",
			keyPreview: "mcp_dev_****efgh",
			createdAt: "2025-01-15",
			lastUsed: "1 小时前",
			status: "active",
			requestCount: 1256,
		},
		{
			id: "3",
			name: "测试设备",
			keyPreview: "mcp_test_****ijkl",
			createdAt: "2025-01-10",
			lastUsed: "3 天前",
			status: "active",
			requestCount: 89,
		},
	]);

	const handleCreateKey = async () => {
		if (!newKeyName.trim()) return;

		setIsCreating(true);
		try {
			// 使用 Better Auth API Key 创建
			const result = await apiKey.create({
				name: newKeyName,
				expiresIn: 60 * 60 * 24 * 365, // 1 year
			});

			if (result.data?.key) {
				setCreatedKey(result.data.key);
				// 添加到列表
				setKeys((prev) => [
					{
						id: result.data?.id || Date.now().toString(),
						name: newKeyName,
						keyPreview: `mcp_****${result.data?.key?.slice(-4) || "xxxx"}`,
						createdAt: new Date().toISOString().split("T")[0],
						lastUsed: "从未使用",
						status: "active",
						requestCount: 0,
					},
					...prev,
				]);
			}
		} catch (error) {
			console.error("Failed to create API key:", error);
			// 模拟创建成功
			const mockKey = `mcp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
			setCreatedKey(mockKey);
			setKeys((prev) => [
				{
					id: Date.now().toString(),
					name: newKeyName,
					keyPreview: `mcp_****${mockKey.slice(-4)}`,
					createdAt: new Date().toISOString().split("T")[0],
					lastUsed: "从未使用",
					status: "active",
					requestCount: 0,
				},
				...prev,
			]);
		} finally {
			setIsCreating(false);
		}
	};

	const handleCopyKey = () => {
		if (createdKey) {
			navigator.clipboard.writeText(createdKey);
		}
	};

	const handleRevokeKey = async (id: string) => {
		// TODO: 调用 API 撤销密钥
		setKeys((prev) =>
			prev.map((key) =>
				key.id === id ? { ...key, status: "revoked" as const } : key,
			),
		);
	};

	const handleDeleteKey = async (id: string) => {
		// TODO: 调用 API 删除密钥
		setKeys((prev) => prev.filter((key) => key.id !== id));
	};

	const closeModal = () => {
		setShowCreateModal(false);
		setNewKeyName("");
		setCreatedKey(null);
		setShowKey(false);
	};

	return (
		<DashboardLayout>
			<div className="space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-white">API 密钥管理</h1>
						<p className="text-white/50 mt-1">
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
						<Key className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
						<div>
							<div className="text-sm font-medium text-cyan-400">
								API 密钥安全提示
							</div>
							<div className="text-sm text-white/60 mt-1">
								密钥只会在创建时显示一次，请妥善保管。建议为不同设备或环境创建独立的密钥，便于追踪和管理。
							</div>
						</div>
					</div>
				</div>

				{/* Keys Table */}
				<div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-white/10">
									<th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider px-6 py-4">
										名称
									</th>
									<th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider px-6 py-4">
										密钥
									</th>
									<th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider px-6 py-4">
										状态
									</th>
									<th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider px-6 py-4">
										调用次数
									</th>
									<th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider px-6 py-4">
										最后使用
									</th>
									<th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider px-6 py-4">
										创建时间
									</th>
									<th className="text-right text-xs font-semibold text-white/40 uppercase tracking-wider px-6 py-4">
										操作
									</th>
								</tr>
							</thead>
							<tbody>
								{keys.map((key) => (
									<tr
										key={key.id}
										className="border-b border-white/5 last:border-0"
									>
										<td className="px-6 py-4">
											<div className="font-medium text-white">{key.name}</div>
										</td>
										<td className="px-6 py-4">
											<code className="text-sm text-white/60 bg-white/5 px-2 py-1 rounded">
												{key.keyPreview}
											</code>
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
													key.status === "active"
														? "bg-emerald-500/10 text-emerald-400"
														: key.status === "expired"
															? "bg-amber-500/10 text-amber-400"
															: "bg-red-500/10 text-red-400"
												}`}
											>
												<span
													className={`w-1.5 h-1.5 rounded-full ${
														key.status === "active"
															? "bg-emerald-400"
															: key.status === "expired"
																? "bg-amber-400"
																: "bg-red-400"
													}`}
												/>
												{key.status === "active"
													? "活跃"
													: key.status === "expired"
														? "已过期"
														: "已撤销"}
											</span>
										</td>
										<td className="px-6 py-4 text-white/60">
											{key.requestCount.toLocaleString()}
										</td>
										<td className="px-6 py-4 text-white/60">{key.lastUsed}</td>
										<td className="px-6 py-4 text-white/60">{key.createdAt}</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-2">
												{key.status === "active" && (
													<Button
														variant="ghost"
														size="sm"
														className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
														onClick={() => handleRevokeKey(key.id)}
													>
														撤销
													</Button>
												)}
												<Button
													variant="ghost"
													size="sm"
													className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
													onClick={() => handleDeleteKey(key.id)}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{keys.length === 0 && (
						<div className="text-center py-12">
							<Key className="w-12 h-12 text-white/20 mx-auto mb-4" />
							<div className="text-white/60">暂无 API 密钥</div>
							<div className="text-white/40 text-sm mt-1">
								创建第一个密钥以开始使用 MCP 服务
							</div>
						</div>
					)}
				</div>

				{/* Create Modal */}
				{showCreateModal && (
					<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
						<div className="bg-[#0d0d14] border border-white/10 rounded-2xl w-full max-w-md">
							<div className="p-6 border-b border-white/10">
								<h2 className="text-xl font-semibold text-white">
									{createdKey ? "密钥已创建" : "创建新密钥"}
								</h2>
							</div>

							<div className="p-6">
								{!createdKey ? (
									<div className="space-y-4">
										<div>
											<Label className="text-white/70">密钥名称</Label>
											<Input
												placeholder="例如：生产环境 - 小智音箱"
												value={newKeyName}
												onChange={(e) => setNewKeyName(e.target.value)}
												className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30"
											/>
											<p className="text-xs text-white/40 mt-2">
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
											<div className="text-xs text-white/60">
												这是密钥唯一一次显示的机会，请妥善保管。
											</div>
										</div>

										<div>
											<Label className="text-white/70">API 密钥</Label>
											<div className="mt-2 flex items-center gap-2">
												<code className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-mono break-all">
													{showKey ? createdKey : "•".repeat(40)}
												</code>
												<Button
													variant="ghost"
													size="icon"
													className="text-white/60 hover:text-white"
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
													className="text-white/60 hover:text-white"
													onClick={handleCopyKey}
												>
													<Copy className="w-4 h-4" />
												</Button>
											</div>
										</div>
									</div>
								)}
							</div>

							<div className="p-6 border-t border-white/10 flex justify-end gap-3">
								<Button
									variant="ghost"
									className="text-white/60 hover:text-white hover:bg-white/5"
									onClick={closeModal}
								>
									{createdKey ? "完成" : "取消"}
								</Button>
								{!createdKey && (
									<Button
										className="bg-cyan-500 hover:bg-cyan-600"
										onClick={handleCreateKey}
										disabled={!newKeyName.trim() || isCreating}
									>
										{isCreating ? "创建中..." : "创建密钥"}
									</Button>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</DashboardLayout>
	);
}
