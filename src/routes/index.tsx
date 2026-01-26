import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BarChart3,
	Building2,
	Cloud,
	Cpu,
	Database,
	Gauge,
	Globe,
	Key,
	Music,
	Shield,
	Wifi,
	Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
	const services = [
		{
			icon: Database,
			name: "RAG 知识库服务",
			description:
				"为智能硬件提供语义搜索能力。上传产品文档、用户手册，让设备能够智能回答用户问题。",
			tools: ["search_documents", "add_document", "list_documents"],
			gradient: "from-emerald-500 to-cyan-500",
		},
		{
			icon: Cloud,
			name: "天气服务",
			description:
				"实时天气数据接入。让智能音箱、智能屏幕等设备轻松获取天气预报和气象预警。",
			tools: ["get_current_weather", "get_forecast", "get_weather_alerts"],
			gradient: "from-blue-500 to-indigo-500",
		},
		{
			icon: Music,
			name: "音乐发现服务",
			description:
				"智能音乐推荐引擎。为智能音箱提供歌曲搜索、歌手信息和个性化推荐能力。",
			tools: ["search_tracks", "get_artist", "get_recommendations"],
			gradient: "from-pink-500 to-rose-500",
		},
	];

	const features = [
		{
			icon: Building2,
			title: "组织管理",
			description:
				"创建团队、管理成员、分配角色。支持多租户部署，适合硬件厂商统一管理多条产品线。",
		},
		{
			icon: Key,
			title: "API 密钥管理",
			description:
				"生成、轮换、撤销 API 密钥。为每台设备或每批次产品分配独立密钥，精细化权限控制。",
		},
		{
			icon: Gauge,
			title: "速率限制",
			description:
				"可配置的请求限制策略。防止设备异常调用，确保服务稳定性和公平使用。",
		},
		{
			icon: BarChart3,
			title: "用量分析",
			description:
				"实时数据看板，追踪每个设备、每条产品线的 API 调用情况，助力产品决策。",
		},
	];

	const hardwareFeatures = [
		{
			icon: Cpu,
			title: "低延迟响应",
			description: "针对嵌入式场景优化，平均响应时间 <50ms",
		},
		{
			icon: Wifi,
			title: "SSE 长连接",
			description: "支持 Server-Sent Events，适合物联网设备持续通信",
		},
		{
			icon: Shield,
			title: "设备级鉴权",
			description: "每台设备独立身份认证，保障数据安全",
		},
	];

	return (
		<div className="min-h-screen bg-background text-foreground overflow-hidden">
			{/* Animated background grid */}
			<div className="fixed inset-0 pointer-events-none">
				<div
					className="absolute inset-0 opacity-[0.02]"
					style={{
						backgroundImage: `
              linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)
            `,
						backgroundSize: "60px 60px",
					}}
				/>
				<div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
				<div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
			</div>

			{/* Hero Section */}
			<section className="relative pt-24 pb-32 px-6">
				<div className="max-w-6xl mx-auto">
					{/* Badge */}
					<div className="flex justify-center mb-8">
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-600 text-sm font-medium tracking-wide">
							<Zap className="w-4 h-4" />
							<span>为智能硬件打造的 MCP 服务平台</span>
						</div>
					</div>

					{/* Main headline */}
					<h1
						className="text-center text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6"
						style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
					>
						<span className="block text-foreground">让硬件拥有</span>
						<span className="block bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
							AI 超能力
						</span>
					</h1>

					{/* Subheadline */}
					<p className="text-center text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed font-light">
						一站式 MCP 服务托管平台，为小智AI等智能硬件提供开箱即用的 AI
						能力接入。认证、限流、监控，全部内置。
					</p>

					{/* CTA buttons */}
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link to="/dashboard">
							<Button
								size="lg"
								className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0 shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:scale-105"
							>
								立即开始
								<ArrowRight className="w-5 h-5 ml-2" />
							</Button>
						</Link>
						<a
							href="https://modelcontextprotocol.io"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button
								size="lg"
								variant="outline"
								className="h-14 px-8 text-lg font-semibold border-border text-foreground hover:bg-accent"
							>
								了解 MCP 协议
							</Button>
						</a>
					</div>

					{/* Stats */}
					<div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
						{[
							{ value: "3", label: "MCP 服务" },
							{ value: "99.9%", label: "可用性 SLA" },
							{ value: "<50ms", label: "平均延迟" },
						].map((stat, i) => (
							<div key={i} className="text-center">
								<div className="text-3xl md:text-4xl font-black text-foreground mb-1">
									{stat.value}
								</div>
								<div className="text-sm text-muted-foreground uppercase tracking-wider">
									{stat.label}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Hardware Features Section */}
			<section className="relative py-16 px-6 border-y border-border/50">
				<div className="max-w-6xl mx-auto">
					<div className="grid md:grid-cols-3 gap-8">
						{hardwareFeatures.map((feature, i) => (
							<div key={i} className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
									<feature.icon className="w-6 h-6 text-cyan-600" />
								</div>
								<div>
									<h3 className="text-lg font-bold text-foreground mb-1">
										{feature.title}
									</h3>
									<p className="text-sm text-muted-foreground">{feature.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Services Section */}
			<section className="relative py-24 px-6">
				<div className="max-w-6xl mx-auto">
					{/* Section header */}
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
							<span className="text-foreground">开箱即用的</span>{" "}
							<span className="text-cyan-600">MCP 服务</span>
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							预置三大核心服务，支持 SSE
							传输协议。无需后端开发，设备固件直连即可使用。
						</p>
					</div>

					{/* Service cards */}
					<div className="grid md:grid-cols-3 gap-6">
						{services.map((service, i) => (
							<div
								key={i}
								className="group relative rounded-2xl border border-border bg-card backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-border hover:bg-accent"
							>
								{/* Glow effect */}
								<div
									className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b ${service.gradient} blur-3xl -z-10`}
									style={{ transform: "scale(0.5)", opacity: 0.1 }}
								/>

								<div className="p-8">
									{/* Icon */}
									<div
										className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-6 shadow-lg`}
									>
										<service.icon className="w-7 h-7 text-white" />
									</div>

									{/* Title */}
									<h3 className="text-2xl font-bold text-foreground mb-3">
										{service.name}
									</h3>

									{/* Description */}
									<p className="text-muted-foreground leading-relaxed mb-6">
										{service.description}
									</p>

									{/* Tools */}
									<div className="space-y-2">
										<div className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2">
											可用工具
										</div>
										<div className="flex flex-wrap gap-2">
											{service.tools.map((tool, j) => (
												<span
													key={j}
													className="px-3 py-1 rounded-full text-xs font-mono bg-muted text-muted-foreground border border-border"
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
				</div>
			</section>

			{/* Enterprise Features Section */}
			<section className="relative py-24 px-6">
				{/* Decorative line */}
				<div className="absolute left-1/2 top-0 w-px h-24 bg-gradient-to-b from-transparent to-cyan-500/50" />

				<div className="max-w-6xl mx-auto">
					{/* Section header */}
					<div className="text-center mb-16">
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-600 text-sm font-medium tracking-wide mb-6">
							<Shield className="w-4 h-4" />
							<span>企业级能力</span>
						</div>
						<h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
							<span className="text-foreground">专为</span>{" "}
							<span className="text-indigo-600">量产场景</span>{" "}
							<span className="text-foreground">设计</span>
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							从原型验证到百万级设备部署，提供完整的安全、监控和管理能力。
						</p>
					</div>

					{/* Feature grid */}
					<div className="grid md:grid-cols-2 gap-6">
						{features.map((feature, i) => (
							<div
								key={i}
								className="group flex gap-5 p-6 rounded-xl border border-border bg-card hover:bg-accent hover:border-border transition-all duration-300"
							>
								<div className="flex-shrink-0">
									<div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
										<feature.icon className="w-6 h-6 text-indigo-600" />
									</div>
								</div>
								<div>
									<h3 className="text-xl font-bold text-foreground mb-2">
										{feature.title}
									</h3>
									<p className="text-muted-foreground leading-relaxed">
										{feature.description}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Code Example Section */}
			<section className="relative py-24 px-6">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
							<span className="text-foreground">快速</span>{" "}
							<span className="text-cyan-600">接入</span>
						</h2>
						<p className="text-lg text-muted-foreground">
							添加配置到 Claude Desktop 或设备固件，即刻开始使用。
						</p>
					</div>

					{/* Code block */}
					<div className="rounded-2xl border border-border bg-card overflow-hidden">
						<div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
							<div className="flex gap-1.5">
								<div className="w-3 h-3 rounded-full bg-red-500/80" />
								<div className="w-3 h-3 rounded-full bg-yellow-500/80" />
								<div className="w-3 h-3 rounded-full bg-green-500/80" />
							</div>
							<span className="text-xs text-muted-foreground ml-2 font-mono">
								mcp_config.json
							</span>
						</div>
						<pre className="p-6 overflow-x-auto">
							<code className="text-sm font-mono leading-relaxed">
								<span className="text-muted-foreground/60">{"{"}</span>
								{"\n"}
								<span className="text-muted-foreground/60">{"  "}</span>
								<span className="text-cyan-600">"mcpServers"</span>
								<span className="text-muted-foreground/60">: {"{"}</span>
								{"\n"}
								<span className="text-muted-foreground/60">{"    "}</span>
								<span className="text-emerald-400">"boilon-rag"</span>
								<span className="text-muted-foreground/60">: {"{"}</span>
								{"\n"}
								<span className="text-muted-foreground/60">{"      "}</span>
								<span className="text-pink-400">"url"</span>
								<span className="text-muted-foreground/60">: </span>
								<span className="text-amber-300">
									"https://mcp.boilon.com/mcp/rag"
								</span>
								<span className="text-muted-foreground/60">,</span>
								{"\n"}
								<span className="text-muted-foreground/60">{"      "}</span>
								<span className="text-pink-400">"transport"</span>
								<span className="text-muted-foreground/60">: </span>
								<span className="text-amber-300">"sse"</span>
								<span className="text-muted-foreground/60">,</span>
								{"\n"}
								<span className="text-muted-foreground/60">{"      "}</span>
								<span className="text-pink-400">"headers"</span>
								<span className="text-muted-foreground/60">: {"{"}</span>
								{"\n"}
								<span className="text-muted-foreground/60">{"        "}</span>
								<span className="text-blue-400">"Authorization"</span>
								<span className="text-muted-foreground/60">: </span>
								<span className="text-amber-300">"Bearer 你的API密钥"</span>
								{"\n"}
								<span className="text-muted-foreground/60">{"      }"}</span>
								{"\n"}
								<span className="text-muted-foreground/60">{"    }"}</span>
								{"\n"}
								<span className="text-muted-foreground/60">{"  }"}</span>
								{"\n"}
								<span className="text-muted-foreground/60">{"}"}</span>
							</code>
						</pre>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative py-32 px-6">
				{/* Background decoration */}
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div className="w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 rounded-full blur-[120px]" />
				</div>

				<div className="relative max-w-4xl mx-auto text-center">
					<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-600 text-sm font-medium tracking-wide mb-8">
						<Globe className="w-4 h-4" />
						<span>现在开始构建</span>
					</div>

					<h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
						<span className="text-foreground">准备好为你的设备</span>
						<br />
						<span className="bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
							赋予 AI 能力了吗？
						</span>
					</h2>

					<p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
						注册账号，生成 API 密钥，几分钟内即可让你的智能硬件接入 MCP 服务。
					</p>

					<Link to="/dashboard">
						<Button
							size="lg"
							className="h-16 px-10 text-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0 shadow-xl shadow-cyan-500/30 transition-all hover:shadow-cyan-500/50 hover:scale-105"
						>
							免费开始使用
							<ArrowRight className="w-6 h-6 ml-2" />
						</Button>
					</Link>

					<p className="mt-6 text-sm text-muted-foreground/60">无需信用卡 · 提供免费额度</p>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border py-12 px-6">
				<div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
							<Zap className="w-4 h-4 text-white" />
						</div>
						<span className="text-lg font-bold text-foreground">Boilon MCP</span>
					</div>

					<div className="flex items-center gap-8 text-sm text-muted-foreground">
						<a href="#" className="hover:text-foreground/70 transition-colors">
							开发文档
						</a>
						<a href="#" className="hover:text-foreground/70 transition-colors">
							API 参考
						</a>
						<a href="#" className="hover:text-foreground/70 transition-colors">
							服务状态
						</a>
						<a href="#" className="hover:text-foreground/70 transition-colors">
							GitHub
						</a>
					</div>

					<div className="text-sm text-muted-foreground/60">
						© 2025 Boilon MCP. 保留所有权利。
					</div>
				</div>
			</footer>
		</div>
	);
}
