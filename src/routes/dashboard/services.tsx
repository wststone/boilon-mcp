import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowUpRight,
	Cloud,
	Copy,
	Database,
	ExternalLink,
	Music,
	Newspaper,
	Settings,
} from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/dashboard/services")({
	component: ServicesPage,
});

interface ServiceConfig {
	id: string;
	name: string;
	description: string;
	icon: React.ElementType;
	gradient: string;
	endpoint: string;
	enabled: boolean;
	tools: string[];
	stats: {
		calls: number;
		avgLatency: number;
		errorRate: number;
	};
}

function ServicesPage() {
	const [services, setServices] = useState<ServiceConfig[]>([
		{
			id: "rag",
			name: "RAG 知识库",
			description:
				"语义文档搜索和检索服务。上传知识库文档，让设备能够智能回答问题。",
			icon: Database,
			gradient: "from-emerald-500 to-cyan-500",
			endpoint: "/mcp/rag",
			enabled: true,
			tools: [
				"search_documents",
				"add_document",
				"list_documents",
				"delete_document",
				"get_document",
			],
			stats: {
				calls: 5234,
				avgLatency: 45,
				errorRate: 0.2,
			},
		},
		{
			id: "weather",
			name: "天气服务",
			description:
				"实时天气数据和预报服务。获取当前天气、多日预报和气象预警。",
			icon: Cloud,
			gradient: "from-blue-500 to-indigo-500",
			endpoint: "/mcp/weather",
			enabled: true,
			tools: [
				"get_current_weather",
				"get_forecast",
				"get_weather_alerts",
				"get_weather_by_coordinates",
			],
			stats: {
				calls: 4567,
				avgLatency: 120,
				errorRate: 0.5,
			},
		},
		{
			id: "music",
			name: "音乐发现",
			description: "音乐搜索和推荐服务。搜索歌曲、查询歌手信息和获取个性化推荐。",
			icon: Music,
			gradient: "from-pink-500 to-rose-500",
			endpoint: "/mcp/music",
			enabled: true,
			tools: [
				"search_tracks",
				"get_artist",
				"get_recommendations",
				"get_genres",
				"get_top_charts",
			],
			stats: {
				calls: 2655,
				avgLatency: 89,
				errorRate: 0.3,
			},
		},
		{
			id: "news",
			name: "新闻资讯",
			description:
				"基于博查AI的智能新闻搜索服务。支持关键词搜索、分类浏览、头条和热门趋势。",
			icon: Newspaper,
			gradient: "from-orange-500 to-amber-500",
			endpoint: "/mcp/news",
			enabled: true,
			tools: [
				"search_news",
				"get_news_by_topic",
				"get_headlines",
				"get_trending",
			],
			stats: {
				calls: 0,
				avgLatency: 0,
				errorRate: 0,
			},
		},
	]);

	const toggleService = (id: string) => {
		setServices((prev) =>
			prev.map((service) =>
				service.id === id ? { ...service, enabled: !service.enabled } : service,
			),
		);
	};

	const copyEndpoint = (endpoint: string) => {
		const fullUrl = `${window.location.origin}${endpoint}`;
		navigator.clipboard.writeText(fullUrl);
	};

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
		<DashboardLayout>
			<div className="space-y-8">
				{/* Header */}
				<div>
					<h1 className="text-2xl font-bold text-foreground">服务管理</h1>
					<p className="text-muted-foreground mt-1">配置和监控 MCP 服务</p>
				</div>

				{/* Services Grid */}
				<div className="grid gap-6">
					{services.map((service) => (
						<div
							key={service.id}
							className="bg-card border border-border rounded-xl overflow-hidden"
						>
							<div className="p-6">
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-4">
										<div
											className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center`}
										>
											<service.icon className="w-6 h-6 text-white" />
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
											<div className="text-sm text-muted-foreground">启用服务</div>
										</div>
										<Switch
											checked={service.enabled}
											onCheckedChange={() => toggleService(service.id)}
										/>
									</div>
								</div>

								{/* Stats */}
								<div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
									<div>
										<div className="text-2xl font-bold text-foreground">
											{service.stats.calls.toLocaleString()}
										</div>
										<div className="text-sm text-muted-foreground">本月调用</div>
									</div>
									<div>
										<div className="text-2xl font-bold text-foreground">
											{service.stats.avgLatency}ms
										</div>
										<div className="text-sm text-muted-foreground">平均延迟</div>
									</div>
									<div>
										<div className="text-2xl font-bold text-foreground">
											{service.stats.errorRate}%
										</div>
										<div className="text-sm text-muted-foreground">错误率</div>
									</div>
								</div>

								{/* Endpoint */}
								<div className="mt-6 pt-6 border-t border-border">
									<div className="text-sm text-muted-foreground mb-2">服务端点</div>
									<div className="flex items-center gap-2">
										<code className="flex-1 bg-muted border border-border rounded-lg px-4 py-2 text-sm text-cyan-600 font-mono">
											{typeof window !== "undefined"
												? window.location.origin
												: "https://your-domain.com"}
											{service.endpoint}
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
									<div className="text-sm text-muted-foreground mb-3">可用工具</div>
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
					))}
				</div>

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
						将以下配置添加到 Claude Desktop 或您的设备固件中，即可接入 MCP
						服务。
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
		</DashboardLayout>
	);
}
