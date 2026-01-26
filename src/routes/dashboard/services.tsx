import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Cloud,
	Copy,
	Database,
	ExternalLink,
	Loader2,
	Music,
	Newspaper,
	Settings,
} from "lucide-react";
import type { ElementType } from "react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/lib/auth-client";
import type { ServiceId } from "@/server/services";
import { $listServices, $toggleService } from "@/server/services";

export const Route = createFileRoute("/dashboard/services")({
	component: ServicesPage,
});

const SERVICE_ICONS: Record<ServiceId, ElementType> = {
	rag: Database,
	weather: Cloud,
	music: Music,
	news: Newspaper,
};

const SERVICE_GRADIENTS: Record<ServiceId, string> = {
	rag: "from-emerald-500 to-cyan-500",
	weather: "from-blue-500 to-indigo-500",
	music: "from-pink-500 to-rose-500",
	news: "from-orange-500 to-amber-500",
};

function ServicesPage() {
	const { data: session } = useSession();
	const queryClient = useQueryClient();

	const {
		data: services,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["services"],
		queryFn: () => $listServices(),
		enabled: !!session?.user,
	});

	const toggleMutation = useMutation({
		mutationKey: ["services", "toggle"],
		mutationFn: (params: { serviceId: string; enabled: boolean }) =>
			$toggleService({ data: params }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["services"] });
		},
	});

	const toggleService = useCallback(
		(id: string, currentEnabled: boolean) => {
			toggleMutation.mutate({ serviceId: id, enabled: !currentEnabled });
		},
		[toggleMutation],
	);

	const copyEndpoint = useCallback((endpoint: string) => {
		const fullUrl = `${window.location.origin}${endpoint}`;
		navigator.clipboard.writeText(fullUrl);
	}, []);

	const configExample = `{
  "mcpServers": {
    "boilon-rag": {
      "url": "${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/mcp/rag",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer 你的API密钥"
      }
    }
  }
}`;

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-foreground">服务管理</h1>
				<p className="text-muted-foreground mt-1">配置和监控 MCP 服务</p>
			</div>

			{/* Loading */}
			{isLoading && (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
				</div>
			)}

			{/* Error */}
			{error && (
				<div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">
					加载服务列表失败：{error.message}
				</div>
			)}

			{/* Services Grid */}
			{services && (
				<div className="grid gap-6">
					{services.map((service) => {
						const Icon = SERVICE_ICONS[service.id];
						const gradient = SERVICE_GRADIENTS[service.id];

						return (
							<div
								key={service.id}
								className="bg-card border border-border rounded-xl overflow-hidden"
							>
								<div className="p-6">
									<div className="flex items-start justify-between">
										<div className="flex items-start gap-4">
											<div
												className={`w-12 h-12 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center`}
											>
												<Icon className="w-6 h-6 text-white" />
											</div>
											<div>
												<div className="flex items-center gap-3">
													<h3 className="text-lg font-semibold text-foreground">
														{service.name}
													</h3>
													<span
														className={`px-2 py-0.5 rounded-full text-xs font-medium ${
															service.enabled
																? "bg-emerald-500/10 text-emerald-400"
																: "bg-muted text-muted-foreground"
														}`}
													>
														{service.enabled ? "已启用" : "已禁用"}
													</span>
												</div>
												<p className="text-muted-foreground text-sm mt-1 max-w-xl">
													{service.description}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<div className="text-right">
												<div className="text-sm text-muted-foreground">
													启用服务
												</div>
											</div>
											<Switch
												checked={service.enabled}
												onCheckedChange={() =>
													toggleService(service.id, service.enabled)
												}
												disabled={toggleMutation.isPending}
											/>
										</div>
									</div>

									{/* Stats */}
									<div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
										<div>
											<div className="text-2xl font-bold text-foreground">
												{service.stats.monthlyCalls.toLocaleString()}
											</div>
											<div className="text-sm text-muted-foreground">
												本月调用
											</div>
										</div>
										<div>
											<div className="text-2xl font-bold text-foreground">
												{service.stats.monthlyTokens.toLocaleString()}
											</div>
											<div className="text-sm text-muted-foreground">
												本月令牌消耗
											</div>
										</div>
									</div>

									{/* Endpoint */}
									<div className="mt-6 pt-6 border-t border-border">
										<div className="text-sm text-muted-foreground mb-2">
											服务端点
										</div>
										<div className="flex items-center gap-2">
											<code className="flex-1 bg-muted border border-border rounded-lg px-4 py-2 text-sm text-cyan-600 font-mono">
												{`${import.meta.env.VITE_BASE_URL}${service.endpoint}`}
											</code>
											<Button
												variant="ghost"
												size="icon"
												className="text-muted-foreground hover:text-foreground"
												onClick={() => copyEndpoint(service.endpoint)}
											>
												<Copy className="w-4 h-4" />
											</Button>
										</div>
									</div>

									{/* Tools */}
									<div className="mt-6 pt-6 border-t border-border">
										<div className="text-sm text-muted-foreground mb-3">
											可用工具
										</div>
										<div className="flex flex-wrap gap-2">
											{service.tools.map((tool) => (
												<span
													key={tool}
													className="px-3 py-1.5 rounded-lg text-xs font-mono bg-muted text-muted-foreground border border-border"
												>
													{tool}
												</span>
											))}
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Connection Guide */}
			<div className="bg-card border border-border rounded-xl p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-foreground">接入指南</h2>
					<a
						href="https://modelcontextprotocol.io"
						target="_blank"
						rel="noopener noreferrer"
						className="text-cyan-600 hover:text-cyan-500 text-sm flex items-center gap-1"
					>
						MCP 文档
						<ExternalLink className="w-3 h-3" />
					</a>
				</div>

				<p className="text-muted-foreground text-sm mb-4">
					将以下配置添加到 Claude Desktop 或您的设备固件中，即可接入 MCP 服务。
				</p>

				<div className="rounded-xl border border-border bg-card overflow-hidden">
					<div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
						<span className="text-xs text-muted-foreground font-mono">
							mcp_config.json
						</span>
						<Button
							variant="ghost"
							size="sm"
							className="text-muted-foreground hover:text-foreground h-7"
							onClick={() => navigator.clipboard.writeText(configExample)}
						>
							<Copy className="w-3 h-3 mr-1" />
							复制
						</Button>
					</div>
					<pre className="p-4 overflow-x-auto">
						<code className="text-sm font-mono text-foreground/70">
							{configExample}
						</code>
					</pre>
				</div>

				<div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
					<Settings className="w-4 h-4" />
					<span>
						需要 API 密钥？前往{" "}
						<Link
							to="/dashboard/api-keys"
							className="text-cyan-600 hover:text-cyan-500"
						>
							API 密钥管理
						</Link>{" "}
						创建。
					</span>
				</div>
			</div>
		</div>
	);
}
