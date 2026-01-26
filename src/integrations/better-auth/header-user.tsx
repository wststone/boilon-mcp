import { Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export function BetterAuthHeader() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <div className="h-9 w-full bg-muted animate-pulse rounded-lg" />;
	}

	if (session?.user) {
		return (
			<div className="flex items-center gap-3">
				<div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
					{session.user.name?.charAt(0).toUpperCase() ||
						session.user.email?.charAt(0).toUpperCase() ||
						"U"}
				</div>
				<div className="flex-1 min-w-0">
					<div className="text-sm font-medium text-foreground truncate">
						{session.user.name || "用户"}
					</div>
					<div className="text-xs text-muted-foreground truncate">
						{session.user.email}
					</div>
				</div>
				<button
					onClick={() => authClient.signOut()}
					className="text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					退出
				</button>
			</div>
		);
	}

	return (
		<Link
			to="/auth/login"
			className="h-9 px-4 text-sm font-medium bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors inline-flex items-center justify-center"
		>
			登录
		</Link>
	);
}
