import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "./ui/button";

export function NotFoundPage() {
	return (
		<div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
			{/* Animated background */}
			<div className="fixed inset-0 pointer-events-none">
				<div
					className="absolute inset-0 opacity-[0.03]"
					style={{
						backgroundImage: `
							linear-gradient(rgba(0,180,200,0.3) 1px, transparent 1px),
							linear-gradient(90deg, rgba(0,180,200,0.3) 1px, transparent 1px)
						`,
						backgroundSize: "60px 60px",
					}}
				/>
				<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[128px]" />
				<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[128px]" />
			</div>

			<div className="relative text-center max-w-lg">
				{/* Icon */}
				<div className="flex justify-center mb-8">
					<div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-border flex items-center justify-center">
						<FileQuestion className="w-12 h-12 text-cyan-600" />
					</div>
				</div>

				{/* 404 Text */}
				<h1 className="text-8xl md:text-9xl font-black tracking-tight mb-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
					404
				</h1>

				{/* Message */}
				<h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
					页面未找到
				</h2>
				<p className="text-lg text-muted-foreground mb-10 leading-relaxed">
					抱歉，您访问的页面不存在或已被移动。请检查链接是否正确，或返回首页继续浏览。
				</p>

				{/* Actions */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
					<Link to="/">
						<Button
							size="lg"
							className="h-12 px-6 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 border-0 text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:scale-105"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							返回首页
						</Button>
					</Link>
					<Link to="/dashboard">
						<Button
							size="lg"
							variant="outline"
							className="h-12 px-6 text-base font-semibold"
						>
							进入控制台
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
