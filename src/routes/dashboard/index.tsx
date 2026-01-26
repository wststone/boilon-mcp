import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowUpRight,
	Cloud,
	Database,
	Key,
	Loader2,
	Music,
	Newspaper,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import type { ElementType } from "react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { $getDashboardStats, $getRecentActivity } from "@/server/dashboard";
import type { ServiceId } from "@/server/services";
import { $listServices } from "@/server/services";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardPage,
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

const SERVICE_NAMES: Record<string, string> = {
	rag: "RAG 知识库",
	weather: "天气服务",
	music: "音乐服务",
	news: "新闻资讯",
};

function formatRelativeTime(date: Date | null) {
	if (!date) return "";
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

function formatChange(change: number) {
	if (change === 0) return "0";
	const sign = change > 0 ? "+" : "";
	return `${sign}${change}%`;
}

function DashboardPage() {
	const { data: session, isPending } = useSession();
	const loggedIn = !!session?.user;

	// 统计数据
	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["dashboard", "stats"],
		queryFn: () => $getDashboardStats(),
		enabled: loggedIn,
	});

	// 服务状态
	const { data: services, isLoading: servicesLoading } = useQuery({
		queryKey: ["dashboard", "services"],
		queryFn: () => $listServices(),
		enabled: loggedIn,
	});

	// 最近活动
	const { data: activities, isLoading: activitiesLoading } = useQuery({
		queryKey: ["dashboard", "activity"],
		queryFn: () => $getRecentActivity(),
		enabled: loggedIn,
	});

	// 如果未登录，显示登录提示
	if (!isPending && !loggedIn) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
				<div className="w-16 h-16 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-6">
					<Zap className="w-8 h-8 text-white" />
				</div>
				<h1 className="text-3xl font-bold text-foreground mb-4">
					欢迎使用 Boilon MCP
				</h1>
				<p className="text-muted-foreground max-w-md mb-8">
					登录后即可管理 API 密钥、查看用量统计、配置 MCP 服务。
				</p>
				<div className="flex gap-4">
					<Link to="/auth/login">
						<Button className="bg-cyan-500 hover:bg-cyan-600">登录账号</Button>
					</Link>
					<Link to="/auth/register">
						<Button
							variant="outline"
							className="border-border text-foreground hover:bg-muted"
						>
							注册新账号
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-foreground">控制台概览</h1>
				<p className="text-muted-foreground mt-1">
					欢迎回来，{session?.user?.name || "用户"}
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{statsLoading ? (
					<div className="col-span-full flex items-center justify-center py-8">
						<Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
					</div>
				) : stats ? (
					<>
						<StatCard
							icon={Zap}
							name="API 调用次数"
							value={stats.apiCalls.value.toLocaleString()}
							change={formatChange(stats.apiCalls.change)}
							changeType={stats.apiCalls.change > 0 ? "positive" : "neutral"}
						/>
						<StatCard
							icon={Key}
							name="活跃密钥"
							value={String(stats.activeKeys.value)}
						/>
						<StatCard
							icon={Users}
							name="团队成员"
							value={String(stats.teamMembers.value)}
						/>
						<StatCard
							icon={TrendingUp}
							name="令牌消耗"
							value={stats.monthlyTokens.value.toLocaleString()}
							change={formatChange(stats.monthlyTokens.change)}
							changeType={
								stats.monthlyTokens.change > 0 ? "positive" : "neutral"
							}
						/>
					</>
				) : null}
			</div>

			{/* Services and Activity */}
			<div className="grid lg:grid-cols-2 gap-6">
				{/* Services */}
				<div className="bg-card border border-border rounded-xl p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-lg font-semibold text-foreground">服务状态</h2>
						<Link to="/dashboard/services">
							<Button
								variant="ghost"
								size="sm"
								className="text-cyan-600 hover:text-cyan-500 hover:bg-cyan-500/10"
							>
								查看全部
								<ArrowUpRight className="w-4 h-4 ml-1" />
							</Button>
						</Link>
					</div>
					{servicesLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
						</div>
					) : (
						<div className="space-y-4">
							{services?.map((service) => {
								const Icon = SERVICE_ICONS[service.id];
								const gradient = SERVICE_GRADIENTS[service.id];
								return (
									<div
										key={service.id}
										className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50"
									>
										<div className="flex items-center gap-4">
											<div
												className={`w-10 h-10 rounded-lg bg-linear-to-br ${gradient} flex items-center justify-center`}
											>
												<Icon className="w-5 h-5 text-white" />
											</div>
											<div>
												<div className="font-medium text-foreground">
													{service.name}
												</div>
												<div className="text-sm text-muted-foreground">
													{service.stats.monthlyCalls.toLocaleString()} 次调用
												</div>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<div
												className={`w-2 h-2 rounded-full ${service.enabled ? "bg-emerald-400" : "bg-muted-foreground"}`}
											/>
											<span
												className={`text-sm ${service.enabled ? "text-emerald-400" : "text-muted-foreground"}`}
											>
												{service.enabled ? "运行中" : "已停用"}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Recent Activity */}
				<div className="bg-card border border-border rounded-xl p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-lg font-semibold text-foreground">最近活动</h2>
					</div>
					{activitiesLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
						</div>
					) : activities && activities.length > 0 ? (
						<div className="space-y-4">
							{activities.map((activity) => (
								<div
									key={`${activity.service}-${activity.tool}-${activity.timestamp}`}
									className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
								>
									<div>
										<div className="text-sm font-medium text-foreground">
											API 调用
										</div>
										<div className="text-xs text-muted-foreground">
											{SERVICE_NAMES[activity.service] ?? activity.service} ·{" "}
											<span className="font-mono">{activity.tool}</span>
										</div>
									</div>
									<div className="text-xs text-muted-foreground">
										{formatRelativeTime(activity.timestamp)}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-muted-foreground text-sm">
							暂无活动记录
						</div>
					)}
				</div>
			</div>

			{/* Quick Actions */}
			<div className="bg-card border border-border rounded-xl p-6">
				<h2 className="text-lg font-semibold text-foreground mb-4">快速操作</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Link to="/dashboard/api-keys">
						<div className="p-4 rounded-lg border border-border hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors cursor-pointer">
							<Key className="w-6 h-6 text-cyan-600 mb-3" />
							<div className="font-medium text-foreground">创建 API 密钥</div>
							<div className="text-sm text-muted-foreground mt-1">
								为新设备或服务生成访问密钥
							</div>
						</div>
					</Link>
					<Link to="/dashboard/team">
						<div className="p-4 rounded-lg border border-border hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors cursor-pointer">
							<Users className="w-6 h-6 text-cyan-600 mb-3" />
							<div className="font-medium text-foreground">邀请团队成员</div>
							<div className="text-sm text-muted-foreground mt-1">
								添加开发者或管理员到团队
							</div>
						</div>
					</Link>
					<Link to="/dashboard/services">
						<div className="p-4 rounded-lg border border-border hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors cursor-pointer">
							<Database className="w-6 h-6 text-cyan-600 mb-3" />
							<div className="font-medium text-foreground">配置服务</div>
							<div className="text-sm text-muted-foreground mt-1">
								管理 MCP 服务的设置和权限
							</div>
						</div>
					</Link>
				</div>
			</div>
		</div>
	);
}

// ============================================
// Sub-components
// ============================================

function StatCard({
	icon: Icon,
	name,
	value,
	change,
	changeType,
}: {
	icon: ElementType;
	name: string;
	value: string;
	change?: string;
	changeType?: "positive" | "warning" | "neutral";
}) {
	return (
		<div className="bg-card border border-border rounded-xl p-5">
			<div className="flex items-center justify-between">
				<div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
					<Icon className="w-5 h-5 text-cyan-600" />
				</div>
				{change && (
					<span
						className={`text-xs font-medium px-2 py-1 rounded-full ${
							changeType === "positive"
								? "bg-emerald-500/10 text-emerald-400"
								: changeType === "warning"
									? "bg-amber-500/10 text-amber-400"
									: "bg-muted text-muted-foreground"
						}`}
					>
						{change}
					</span>
				)}
			</div>
			<div className="mt-4">
				<div className="text-2xl font-bold text-foreground">{value}</div>
				<div className="text-sm text-muted-foreground">{name}</div>
			</div>
		</div>
	);
}
