import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function LoginLink() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
			<p className="text-muted-foreground">请先登录</p>
			<Link to="/auth/login">
				<Button className="mt-4 bg-cyan-500 hover:bg-cyan-600">登录账号</Button>
			</Link>
		</div>
	);
}
