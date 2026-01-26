import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";

export const Route = createFileRoute("/auth/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("两次输入的密码不一致");
			return;
		}

		if (password.length < 8) {
			setError("密码长度至少为 8 位");
			return;
		}

		setIsLoading(true);

		try {
			const result = await signUp.email({
				email,
				password,
				name,
			});

			if (result.error) {
				setError(result.error.message || "注册失败，请稍后重试");
			} else {
				navigate({ to: "/dashboard" });
			}
		} catch (err) {
			setError("注册失败，请稍后重试");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			{/* Background */}
			<div className="fixed inset-0 pointer-events-none">
				<div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
				<div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
			</div>

			<div className="relative w-full max-w-md">
				{/* Logo */}
				<div className="text-center mb-8">
					<Link to="/" className="inline-flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
							<Zap className="w-5 h-5 text-white" />
						</div>
						<span className="text-2xl font-bold text-foreground">Boilon MCP</span>
					</Link>
				</div>

				{/* Card */}
				<div className="bg-card border border-border rounded-2xl p-8">
					<div className="text-center mb-6">
						<h1 className="text-2xl font-bold text-foreground">创建账号</h1>
						<p className="text-muted-foreground mt-2">
							注册后即可开始使用 MCP 服务
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
								{error}
							</div>
						)}

						<div>
							<Label className="text-foreground/70">姓名</Label>
							<Input
								type="text"
								placeholder="您的姓名"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground/60"
								required
							/>
						</div>

						<div>
							<Label className="text-foreground/70">邮箱</Label>
							<Input
								type="email"
								placeholder="your@email.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground/60"
								required
							/>
						</div>

						<div>
							<Label className="text-foreground/70">密码</Label>
							<Input
								type="password"
								placeholder="至少 8 位字符"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground/60"
								required
								minLength={8}
							/>
						</div>

						<div>
							<Label className="text-foreground/70">确认密码</Label>
							<Input
								type="password"
								placeholder="再次输入密码"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground/60"
								required
							/>
						</div>

						<Button
							type="submit"
							className="w-full bg-cyan-500 hover:bg-cyan-600 h-11"
							disabled={isLoading}
						>
							{isLoading ? "注册中..." : "创建账号"}
						</Button>
					</form>

					<div className="mt-6 text-center text-sm text-muted-foreground">
						已有账号？{" "}
						<Link
							to="/auth/login"
							className="text-cyan-600 hover:text-cyan-500"
						>
							立即登录
						</Link>
					</div>
				</div>

				<div className="mt-8 text-center text-xs text-muted-foreground/60">
					注册即表示您同意我们的{" "}
					<a href="#" className="text-muted-foreground hover:text-foreground/70">
						服务条款
					</a>{" "}
					和{" "}
					<a href="#" className="text-muted-foreground hover:text-foreground/70">
						隐私政策
					</a>
				</div>
			</div>
		</div>
	);
}
