import { Link, useLocation } from "@tanstack/react-router";
import {
	BarChart3,
	BookOpen,
	Building2,
	Cloud,
	Database,
	Key,
	LayoutDashboard,
	LogOut,
	Menu,
	Music,
	Newspaper,
	Settings,
	Users,
	X,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";

interface DashboardLayoutProps {
	children: React.ReactNode;
}

const navigation = [
	{ name: "概览", href: "/dashboard", icon: LayoutDashboard },
	{ name: "服务管理", href: "/dashboard/services", icon: Settings },
	{ name: "API 密钥", href: "/dashboard/api-keys", icon: Key },
	{ name: "团队管理", href: "/dashboard/team", icon: Users },
];

const services = [
	{ name: "知识库", href: "/dashboard/knowledge-base", icon: Database },
	{ name: "天气服务", href: "/dashboard/weather", icon: Cloud },
	{ name: "音乐服务", href: "/dashboard/music", icon: Music },
	{ name: "新闻服务", href: "/dashboard/news", icon: Newspaper },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const location = useLocation();
	const { data: session } = useSession();

	const isActive = (href: string) => {
		if (href === "/dashboard") {
			return location.pathname === "/dashboard";
		}
		return location.pathname.startsWith(href);
	};

	const handleSignOut = async () => {
		await signOut();
		window.location.href = "/";
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Mobile sidebar backdrop */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 bg-black/60 z-40 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
					sidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex flex-col h-full">
					{/* Logo */}
					<div className="flex items-center justify-between h-16 px-4 border-b border-border">
						<Link to="/" className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
								<Zap className="w-4 h-4 text-white" />
							</div>
							<span className="text-lg font-bold text-foreground">
								Boilon MCP
							</span>
						</Link>
						<button
							className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
							onClick={() => setSidebarOpen(false)}
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Navigation */}
					<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
						{navigation.map((item) => (
							<Link
								key={item.name}
								to={item.href}
								onClick={() => setSidebarOpen(false)}
								className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
									isActive(item.href)
										? "bg-cyan-500/10 text-cyan-600"
										: "text-muted-foreground hover:text-foreground hover:bg-muted"
								}`}
							>
								<item.icon className="w-5 h-5" />
								{item.name}
							</Link>
						))}

						{/* Services section */}
						<div className="pt-6">
							<div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								MCP 服务
							</div>
							{services.map((service) => (
								<Link
									key={service.name}
									to={service.href}
									onClick={() => setSidebarOpen(false)}
									className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
										isActive(service.href)
											? "bg-cyan-500/10 text-cyan-600"
											: "text-muted-foreground hover:text-foreground hover:bg-muted"
									}`}
								>
									<service.icon className="w-5 h-5" />
									{service.name}
								</Link>
							))}
						</div>
					</nav>

					{/* User section */}
					<div className="p-4 border-t border-border">
						{session?.user ? (
							<div className="space-y-3">
								<div className="flex items-center gap-3">
									<div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
										{session.user.name?.[0]?.toUpperCase() ||
											session.user.email?.[0]?.toUpperCase()}
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium text-foreground truncate">
											{session.user.name || "用户"}
										</div>
										<div className="text-xs text-muted-foreground truncate">
											{session.user.email}
										</div>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
									onClick={handleSignOut}
								>
									<LogOut className="w-4 h-4 mr-2" />
									退出登录
								</Button>
							</div>
						) : (
							<Link to="/dashboard">
								<Button className="w-full bg-cyan-500 hover:bg-cyan-600">
									登录
								</Button>
							</Link>
						)}
					</div>
				</div>
			</aside>

			{/* Main content */}
			<div className="lg:pl-64">
				{/* Top bar */}
				<header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border">
					<div className="flex items-center justify-between h-full px-4 lg:px-8">
						<button
							className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
							onClick={() => setSidebarOpen(true)}
						>
							<Menu className="w-6 h-6" />
						</button>

						<div className="flex items-center gap-4 ml-auto">
							<Link to="/dashboard">
								<Button
									variant="outline"
									size="sm"
									className="border-border text-foreground/70 hover:text-foreground hover:bg-muted"
								>
									<BarChart3 className="w-4 h-4 mr-2" />
									用量统计
								</Button>
							</Link>
						</div>
					</div>
				</header>

				{/* Page content */}
				<main className="p-4 lg:p-8">{children}</main>
			</div>
		</div>
	);
}
