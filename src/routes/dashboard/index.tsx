import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowUpRight,
	Cloud,
	Database,
	Key,
	Music,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardPage,
});

function DashboardPage() {
	const { data: session, isPending } = useSession();

	// 如果未登录，显示登录提示
	if (!isPending && !session?.user) {
		return (
			<DashboardLayout>
				<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
					<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-6">
						<Zap className="w-8 h-8 text-white" />
					</div>
					<h1 className="text-3xl font-bold text-white mb-4">
						欢迎使用 Boilon MCP
					</h1>
					<p className="text-white/50 max-w-md mb-8">
						登录后即可管理 API 密钥、查看用量统计、配置 MCP 服务。
					</p>
					<div className="flex gap-4">
						<Link to="/auth/login">
							<Button className="bg-cyan-500 hover:bg-cyan-600">登录账号</Button>
						</Link>
						<Link to="/auth/register">
							<Button
								variant="outline"
								className="border-white/20 text-white hover:bg-white/5"
							>
								注册新账号
							</Button>
						</Link>
					</div>
				</div>
			</DashboardLayout>
		);
	}

	const stats = [
		{
			name: "API 调用次数",
			value: "12,456",
			change: "+12.5%",
			changeType: "positive",
			icon: Zap,
		},
		{
			name: "活跃密钥",
			value: "8",
			change: "+2",
			changeType: "positive",
			icon: Key,
		},
		{
			name: "团队成员",
			value: "5",
			change: "0",
			changeType: "neutral",
			icon: Users,
		},
		{
			name: "本月用量",
			value: "78%",
			change: "+5.2%",
			changeType: "warning",
			icon: TrendingUp,
		},
	];

	const services = [
		{
			name: "RAG 知识库",
			icon: Database,
			status: "active",
			calls: "5,234",
			gradient: "from-emerald-500 to-cyan-500",
		},
		{
			name: "天气服务",
			icon: Cloud,
			status: "active",
			calls: "4,567",
			gradient: "from-blue-500 to-indigo-500",
		},
		{
			name: "音乐服务",
			icon: Music,
			status: "active",
			calls: "2,655",
			gradient: "from-pink-500 to-rose-500",
		},
	];

	const recentActivity = [
		{
			action: "API 调用",
			service: "RAG 知识库",
			tool: "search_documents",
			time: "2 分钟前",
		},
		{
			action: "API 调用",
			service: "天气服务",
			tool: "get_current_weather",
			time: "5 分钟前",
		},
		{
			action: "密钥创建",
			service: "-",
			tool: "mcp_prod_****",
			time: "1 小时前",
		},
		{
			action: "API 调用",
			service: "音乐服务",
			tool: "search_tracks",
			time: "2 小时前",
		},
		{
			action: "成员邀请",
			service: "-",
			tool: "developer@example.com",
			time: "3 小时前",
		},
	];

	return (
		<DashboardLayout>
			<div className="space-y-8">
				{/* Header */}
				<div>
					<h1 className="text-2xl font-bold text-white">控制台概览</h1>
					<p className="text-white/50 mt-1">
						欢迎回来，{session?.user?.name || "用户"}
					</p>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{stats.map((stat) => (
						<div
							key={stat.name}
							className="bg-white/[0.02] border border-white/10 rounded-xl p-5"
						>
							<div className="flex items-center justify-between">
								<div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
									<stat.icon className="w-5 h-5 text-cyan-400" />
								</div>
								<span
									className={`text-xs font-medium px-2 py-1 rounded-full ${
										stat.changeType === "positive"
											? "bg-emerald-500/10 text-emerald-400"
											: stat.changeType === "warning"
												? "bg-amber-500/10 text-amber-400"
												: "bg-white/5 text-white/40"
									}`}
								>
									{stat.change}
								</span>
							</div>
							<div className="mt-4">
								<div className="text-2xl font-bold text-white">{stat.value}</div>
								<div className="text-sm text-white/50">{stat.name}</div>
							</div>
						</div>
					))}
				</div>

				{/* Services and Activity */}
				<div className="grid lg:grid-cols-2 gap-6">
					{/* Services */}
					<div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-lg font-semibold text-white">服务状态</h2>
							<Link to="/dashboard/services">
								<Button
									variant="ghost"
									size="sm"
									className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
								>
									查看全部
									<ArrowUpRight className="w-4 h-4 ml-1" />
								</Button>
							</Link>
						</div>
						<div className="space-y-4">
							{services.map((service) => (
								<div
									key={service.name}
									className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5"
								>
									<div className="flex items-center gap-4">
										<div
											className={`w-10 h-10 rounded-lg bg-gradient-to-br ${service.gradient} flex items-center justify-center`}
										>
											<service.icon className="w-5 h-5 text-white" />
										</div>
										<div>
											<div className="font-medium text-white">
												{service.name}
											</div>
											<div className="text-sm text-white/40">
												{service.calls} 次调用
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 rounded-full bg-emerald-400" />
										<span className="text-sm text-emerald-400">运行中</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Recent Activity */}
					<div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-lg font-semibold text-white">最近活动</h2>
						</div>
						<div className="space-y-4">
							{recentActivity.map((activity, i) => (
								<div
									key={i}
									className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
								>
									<div>
										<div className="text-sm font-medium text-white">
											{activity.action}
										</div>
										<div className="text-xs text-white/40">
											{activity.service !== "-" && `${activity.service} · `}
											<span className="font-mono">{activity.tool}</span>
										</div>
									</div>
									<div className="text-xs text-white/40">{activity.time}</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
					<h2 className="text-lg font-semibold text-white mb-4">快速操作</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Link to="/dashboard/api-keys">
							<div className="p-4 rounded-lg border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors cursor-pointer">
								<Key className="w-6 h-6 text-cyan-400 mb-3" />
								<div className="font-medium text-white">创建 API 密钥</div>
								<div className="text-sm text-white/40 mt-1">
									为新设备或服务生成访问密钥
								</div>
							</div>
						</Link>
						<Link to="/dashboard/team">
							<div className="p-4 rounded-lg border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors cursor-pointer">
								<Users className="w-6 h-6 text-cyan-400 mb-3" />
								<div className="font-medium text-white">邀请团队成员</div>
								<div className="text-sm text-white/40 mt-1">
									添加开发者或管理员到团队
								</div>
							</div>
						</Link>
						<Link to="/dashboard/services">
							<div className="p-4 rounded-lg border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors cursor-pointer">
								<Database className="w-6 h-6 text-cyan-400 mb-3" />
								<div className="font-medium text-white">配置服务</div>
								<div className="text-sm text-white/40 mt-1">
									管理 MCP 服务的设置和权限
								</div>
							</div>
						</Link>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
