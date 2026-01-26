import { Link } from "@tanstack/react-router";
import {
	Home,
	Key,
	LayoutDashboard,
	Menu,
	Settings,
	Users,
	X,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { BetterAuthHeader } from "../integrations/better-auth/header-user.tsx";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<header className="p-4 flex items-center bg-card text-foreground border-b border-border">
				<button
					onClick={() => setIsOpen(true)}
					className="p-2 hover:bg-muted rounded-lg transition-colors"
					aria-label="Open menu"
				>
					<Menu size={24} />
				</button>
				<h1 className="ml-4 text-xl font-semibold">
					<Link to="/" className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
							<Zap className="w-4 h-4 text-white" />
						</div>
						<span className="font-bold">Boilon MCP</span>
					</Link>
				</h1>
			</header>

			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-card text-foreground shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-border ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-border">
					<h2 className="text-xl font-bold">导航菜单</h2>
					<button
						onClick={() => setIsOpen(false)}
						className="p-2 hover:bg-muted rounded-lg transition-colors"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					<Link
						to="/"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10 text-cyan-600 transition-colors mb-2",
						}}
					>
						<Home size={20} />
						<span className="font-medium">首页</span>
					</Link>

					<div className="my-4 border-t border-border" />

					<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
						控制台
					</div>

					<Link
						to="/dashboard"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10 text-cyan-600 transition-colors mb-2",
						}}
					>
						<LayoutDashboard size={20} />
						<span className="font-medium">概览</span>
					</Link>

					<Link
						to="/dashboard/services"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10 text-cyan-600 transition-colors mb-2",
						}}
					>
						<Settings size={20} />
						<span className="font-medium">服务管理</span>
					</Link>

					<Link
						to="/dashboard/api-keys"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10 text-cyan-600 transition-colors mb-2",
						}}
					>
						<Key size={20} />
						<span className="font-medium">API 密钥</span>
					</Link>

					<Link
						to="/dashboard/team"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10 text-cyan-600 transition-colors mb-2",
						}}
					>
						<Users size={20} />
						<span className="font-medium">团队管理</span>
					</Link>
				</nav>

				<div className="p-4 border-t border-border bg-background flex flex-col gap-2">
					<BetterAuthHeader />
				</div>
			</aside>

			{/* Backdrop */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-40"
					onClick={() => setIsOpen(false)}
				/>
			)}
		</>
	);
}
