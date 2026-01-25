import { createFileRoute } from "@tanstack/react-router";
import {
	Crown,
	Mail,
	MoreVertical,
	Plus,
	Shield,
	Trash2,
	User,
	UserPlus,
	Users,
} from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useSession, organization } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/team")({
	component: TeamPage,
});

interface TeamMember {
	id: string;
	name: string;
	email: string;
	role: "owner" | "admin" | "developer" | "viewer";
	joinedAt: string;
	lastActive: string;
	avatar?: string;
}

interface Invitation {
	id: string;
	email: string;
	role: "admin" | "developer" | "viewer";
	sentAt: string;
	status: "pending" | "expired";
}

const roleLabels: Record<string, { label: string; color: string }> = {
	owner: { label: "所有者", color: "text-amber-400 bg-amber-500/10" },
	admin: { label: "管理员", color: "text-purple-400 bg-purple-500/10" },
	developer: { label: "开发者", color: "text-cyan-400 bg-cyan-500/10" },
	viewer: { label: "观察者", color: "text-white/60 bg-white/5" },
};

function TeamPage() {
	const { data: session } = useSession();
	const [showInviteModal, setShowInviteModal] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState<"admin" | "developer" | "viewer">(
		"developer",
	);
	const [isInviting, setIsInviting] = useState(false);

	// Mock data
	const [members, setMembers] = useState<TeamMember[]>([
		{
			id: "1",
			name: session?.user?.name || "当前用户",
			email: session?.user?.email || "user@example.com",
			role: "owner",
			joinedAt: "2025-01-01",
			lastActive: "刚刚",
		},
		{
			id: "2",
			name: "张工程师",
			email: "zhang@example.com",
			role: "admin",
			joinedAt: "2025-01-10",
			lastActive: "1 小时前",
		},
		{
			id: "3",
			name: "李开发",
			email: "li@example.com",
			role: "developer",
			joinedAt: "2025-01-15",
			lastActive: "3 小时前",
		},
		{
			id: "4",
			name: "王测试",
			email: "wang@example.com",
			role: "developer",
			joinedAt: "2025-01-18",
			lastActive: "1 天前",
		},
	]);

	const [invitations, setInvitations] = useState<Invitation[]>([
		{
			id: "i1",
			email: "new-dev@example.com",
			role: "developer",
			sentAt: "2025-01-20",
			status: "pending",
		},
	]);

	const handleInvite = async () => {
		if (!inviteEmail.trim()) return;

		setIsInviting(true);
		try {
			// TODO: 调用 Better Auth organization.inviteMember
			// await organization.inviteMember({
			//   email: inviteEmail,
			//   role: inviteRole,
			// });

			// 模拟添加邀请
			setInvitations((prev) => [
				{
					id: Date.now().toString(),
					email: inviteEmail,
					role: inviteRole,
					sentAt: new Date().toISOString().split("T")[0],
					status: "pending",
				},
				...prev,
			]);

			setShowInviteModal(false);
			setInviteEmail("");
			setInviteRole("developer");
		} catch (error) {
			console.error("Failed to invite member:", error);
		} finally {
			setIsInviting(false);
		}
	};

	const handleRemoveMember = (id: string) => {
		setMembers((prev) => prev.filter((m) => m.id !== id));
	};

	const handleCancelInvitation = (id: string) => {
		setInvitations((prev) => prev.filter((i) => i.id !== id));
	};

	const handleChangeRole = (
		memberId: string,
		newRole: "admin" | "developer" | "viewer",
	) => {
		setMembers((prev) =>
			prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
		);
	};

	return (
		<DashboardLayout>
			<div className="space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-white">团队管理</h1>
						<p className="text-white/50 mt-1">管理团队成员和权限</p>
					</div>
					<Button
						className="bg-cyan-500 hover:bg-cyan-600"
						onClick={() => setShowInviteModal(true)}
					>
						<UserPlus className="w-4 h-4 mr-2" />
						邀请成员
					</Button>
				</div>

				{/* Team Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
								<Users className="w-5 h-5 text-cyan-400" />
							</div>
							<div>
								<div className="text-2xl font-bold text-white">
									{members.length}
								</div>
								<div className="text-sm text-white/50">团队成员</div>
							</div>
						</div>
					</div>
					<div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
								<Shield className="w-5 h-5 text-purple-400" />
							</div>
							<div>
								<div className="text-2xl font-bold text-white">
									{members.filter((m) => m.role === "admin").length + 1}
								</div>
								<div className="text-sm text-white/50">管理员</div>
							</div>
						</div>
					</div>
					<div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
								<User className="w-5 h-5 text-emerald-400" />
							</div>
							<div>
								<div className="text-2xl font-bold text-white">
									{members.filter((m) => m.role === "developer").length}
								</div>
								<div className="text-sm text-white/50">开发者</div>
							</div>
						</div>
					</div>
					<div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
								<Mail className="w-5 h-5 text-amber-400" />
							</div>
							<div>
								<div className="text-2xl font-bold text-white">
									{invitations.filter((i) => i.status === "pending").length}
								</div>
								<div className="text-sm text-white/50">待处理邀请</div>
							</div>
						</div>
					</div>
				</div>

				{/* Members Table */}
				<div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
					<div className="px-6 py-4 border-b border-white/10">
						<h2 className="text-lg font-semibold text-white">团队成员</h2>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-white/10">
									<th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider px-6 py-4">
										成员
									</th>
									<th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider px-6 py-4">
										角色
									</th>
									<th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider px-6 py-4">
										加入时间
									</th>
									<th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider px-6 py-4">
										最后活跃
									</th>
									<th className="text-right text-xs font-semibold text-white/40 uppercase tracking-wider px-6 py-4">
										操作
									</th>
								</tr>
							</thead>
							<tbody>
								{members.map((member) => (
									<tr
										key={member.id}
										className="border-b border-white/5 last:border-0"
									>
										<td className="px-6 py-4">
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
													{member.name[0]?.toUpperCase()}
												</div>
												<div>
													<div className="font-medium text-white flex items-center gap-2">
														{member.name}
														{member.role === "owner" && (
															<Crown className="w-4 h-4 text-amber-400" />
														)}
													</div>
													<div className="text-sm text-white/40">
														{member.email}
													</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											{member.role === "owner" ? (
												<span
													className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleLabels[member.role].color}`}
												>
													{roleLabels[member.role].label}
												</span>
											) : (
												<Select
													value={member.role}
													onValueChange={(value) =>
														handleChangeRole(
															member.id,
															value as "admin" | "developer" | "viewer",
														)
													}
												>
													<SelectTrigger className="w-32 h-8 bg-white/5 border-white/10 text-white text-xs">
														<SelectValue />
													</SelectTrigger>
													<SelectContent className="bg-[#1a1a24] border-white/10">
														<SelectItem
															value="admin"
															className="text-white focus:bg-white/10"
														>
															管理员
														</SelectItem>
														<SelectItem
															value="developer"
															className="text-white focus:bg-white/10"
														>
															开发者
														</SelectItem>
														<SelectItem
															value="viewer"
															className="text-white focus:bg-white/10"
														>
															观察者
														</SelectItem>
													</SelectContent>
												</Select>
											)}
										</td>
										<td className="px-6 py-4 text-white/60">{member.joinedAt}</td>
										<td className="px-6 py-4 text-white/60">
											{member.lastActive}
										</td>
										<td className="px-6 py-4 text-right">
											{member.role !== "owner" && (
												<Button
													variant="ghost"
													size="sm"
													className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
													onClick={() => handleRemoveMember(member.id)}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Pending Invitations */}
				{invitations.length > 0 && (
					<div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
						<div className="px-6 py-4 border-b border-white/10">
							<h2 className="text-lg font-semibold text-white">待处理邀请</h2>
						</div>
						<div className="divide-y divide-white/5">
							{invitations.map((invitation) => (
								<div
									key={invitation.id}
									className="px-6 py-4 flex items-center justify-between"
								>
									<div className="flex items-center gap-3">
										<div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
											<Mail className="w-4 h-4 text-white/40" />
										</div>
										<div>
											<div className="font-medium text-white">
												{invitation.email}
											</div>
											<div className="text-sm text-white/40">
												邀请为 {roleLabels[invitation.role].label} · 发送于{" "}
												{invitation.sentAt}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<span
											className={`px-2.5 py-1 rounded-full text-xs font-medium ${
												invitation.status === "pending"
													? "bg-amber-500/10 text-amber-400"
													: "bg-white/5 text-white/40"
											}`}
										>
											{invitation.status === "pending" ? "等待接受" : "已过期"}
										</span>
										<Button
											variant="ghost"
											size="sm"
											className="text-white/60 hover:text-white hover:bg-white/5"
											onClick={() => handleCancelInvitation(invitation.id)}
										>
											取消
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Invite Modal */}
				{showInviteModal && (
					<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
						<div className="bg-[#0d0d14] border border-white/10 rounded-2xl w-full max-w-md">
							<div className="p-6 border-b border-white/10">
								<h2 className="text-xl font-semibold text-white">邀请团队成员</h2>
							</div>

							<div className="p-6 space-y-4">
								<div>
									<Label className="text-white/70">邮箱地址</Label>
									<Input
										type="email"
										placeholder="colleague@example.com"
										value={inviteEmail}
										onChange={(e) => setInviteEmail(e.target.value)}
										className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30"
									/>
								</div>

								<div>
									<Label className="text-white/70">角色</Label>
									<Select
										value={inviteRole}
										onValueChange={(value) =>
											setInviteRole(value as "admin" | "developer" | "viewer")
										}
									>
										<SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-[#1a1a24] border-white/10">
											<SelectItem
												value="admin"
												className="text-white focus:bg-white/10"
											>
												<div>
													<div className="font-medium">管理员</div>
													<div className="text-xs text-white/50">
														可以管理团队、密钥和服务配置
													</div>
												</div>
											</SelectItem>
											<SelectItem
												value="developer"
												className="text-white focus:bg-white/10"
											>
												<div>
													<div className="font-medium">开发者</div>
													<div className="text-xs text-white/50">
														可以创建密钥和查看服务
													</div>
												</div>
											</SelectItem>
											<SelectItem
												value="viewer"
												className="text-white focus:bg-white/10"
											>
												<div>
													<div className="font-medium">观察者</div>
													<div className="text-xs text-white/50">
														只能查看统计数据
													</div>
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="p-6 border-t border-white/10 flex justify-end gap-3">
								<Button
									variant="ghost"
									className="text-white/60 hover:text-white hover:bg-white/5"
									onClick={() => setShowInviteModal(false)}
								>
									取消
								</Button>
								<Button
									className="bg-cyan-500 hover:bg-cyan-600"
									onClick={handleInvite}
									disabled={!inviteEmail.trim() || isInviting}
								>
									{isInviting ? "发送中..." : "发送邀请"}
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</DashboardLayout>
	);
}
