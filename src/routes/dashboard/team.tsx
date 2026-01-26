import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Crown,
	Loader2,
	Mail,
	Shield,
	Trash2,
	User,
	UserPlus,
	Users,
} from "lucide-react";
import { useCallback, useState } from "react";
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
import { organization, useActiveOrganization } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/team")({
	component: TeamPage,
});

const roleLabels: Record<string, { label: string; color: string }> = {
	owner: { label: "所有者", color: "text-amber-400 bg-amber-500/10" },
	admin: { label: "管理员", color: "text-purple-400 bg-purple-500/10" },
	member: { label: "成员", color: "text-cyan-600 bg-cyan-500/10" },
};

function formatDate(date: Date | string) {
	return new Date(date).toLocaleDateString("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

function getInvitationStatus(invitation: { status: string; expiresAt: Date }) {
	if (
		invitation.status === "pending" &&
		new Date(invitation.expiresAt) < new Date()
	) {
		return "expired" as const;
	}
	return invitation.status as "pending" | "accepted" | "rejected" | "canceled";
}

function TeamPage() {
	const { data: activeOrg } = useActiveOrganization();
	const queryClient = useQueryClient();
	const [showInviteModal, setShowInviteModal] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");

	// 获取组织完整数据（成员 + 邀请）
	const { data: fullOrg, isLoading } = useQuery({
		queryKey: ["organization", activeOrg?.id],
		queryFn: async () => {
			const result = await organization.getFullOrganization({
				organizationId: activeOrg?.id,
			});
			if (result.error) throw new Error(result.error.message);
			return result.data;
		},
		enabled: !!activeOrg?.id,
	});

	const members = fullOrg?.members ?? [];
	const invitations = fullOrg?.invitations ?? [];
	const pendingInvitations = invitations.filter(
		(i) => getInvitationStatus(i) === "pending",
	);

	// 邀请成员
	const inviteMutation = useMutation({
		mutationKey: ["organization", "invite"],
		mutationFn: async ({ email, role }: { email: string; role: string }) => {
			const result = await organization.inviteMember({
				email,
				role,
				organizationId: activeOrg?.id,
			});
			if (result.error) throw new Error(result.error.message);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["organization", activeOrg?.id],
			});
		},
	});

	// 移除成员
	const removeMutation = useMutation({
		mutationKey: ["organization", "remove"],
		mutationFn: async (memberIdOrEmail: string) => {
			const result = await organization.removeMember({
				memberIdOrEmail,
				organizationId: activeOrg?.id,
			});
			if (result.error) throw new Error(result.error.message);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["organization", activeOrg?.id],
			});
		},
	});

	// 更新角色
	const updateRoleMutation = useMutation({
		mutationKey: ["organization", "updateRole"],
		mutationFn: async ({
			memberId,
			role,
		}: {
			memberId: string;
			role: string;
		}) => {
			const result = await organization.updateMemberRole({
				memberId,
				role,
				organizationId: activeOrg?.id,
			});
			if (result.error) throw new Error(result.error.message);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["organization", activeOrg?.id],
			});
		},
	});

	// 取消邀请
	const cancelInvitationMutation = useMutation({
		mutationKey: ["organization", "cancelInvitation"],
		mutationFn: async (invitationId: string) => {
			const result = await organization.cancelInvitation({
				invitationId,
			});
			if (result.error) throw new Error(result.error.message);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["organization", activeOrg?.id],
			});
		},
	});

	const handleInvite = useCallback(async () => {
		if (!inviteEmail.trim()) return;
		try {
			await inviteMutation.mutateAsync({
				email: inviteEmail,
				role: inviteRole,
			});
			setShowInviteModal(false);
			setInviteEmail("");
			setInviteRole("member");
		} catch (err) {
			console.error("Failed to invite member:", err);
		}
	}, [inviteEmail, inviteRole, inviteMutation]);

	const handleRemoveMember = useCallback(
		(memberId: string) => {
			removeMutation.mutate(memberId);
		},
		[removeMutation],
	);

	const handleCancelInvitation = useCallback(
		(invitationId: string) => {
			cancelInvitationMutation.mutate(invitationId);
		},
		[cancelInvitationMutation],
	);

	const handleChangeRole = useCallback(
		(memberId: string, newRole: "admin" | "member") => {
			updateRoleMutation.mutate({ memberId, role: newRole });
		},
		[updateRoleMutation],
	);

	// 未选择组织
	if (!activeOrg) {
		return (
			<DashboardLayout>
				<div className="space-y-8">
					<div>
						<h1 className="text-2xl font-bold text-foreground">团队管理</h1>
						<p className="text-muted-foreground mt-1">管理团队成员和权限</p>
					</div>
					<div className="bg-card border border-border rounded-xl p-12 text-center">
						<Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
						<div className="text-muted-foreground">请先创建或选择一个组织</div>
					</div>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-foreground">团队管理</h1>
						<p className="text-muted-foreground mt-1">管理团队成员和权限</p>
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
					<div className="bg-card border border-border rounded-xl p-5">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
								<Users className="w-5 h-5 text-cyan-600" />
							</div>
							<div>
								<div className="text-2xl font-bold text-foreground">
									{members.length}
								</div>
								<div className="text-sm text-muted-foreground">团队成员</div>
							</div>
						</div>
					</div>
					<div className="bg-card border border-border rounded-xl p-5">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
								<Shield className="w-5 h-5 text-purple-400" />
							</div>
							<div>
								<div className="text-2xl font-bold text-foreground">
									{
										members.filter(
											(m) => m.role === "admin" || m.role === "owner",
										).length
									}
								</div>
								<div className="text-sm text-muted-foreground">管理员</div>
							</div>
						</div>
					</div>
					<div className="bg-card border border-border rounded-xl p-5">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
								<User className="w-5 h-5 text-emerald-400" />
							</div>
							<div>
								<div className="text-2xl font-bold text-foreground">
									{members.filter((m) => m.role === "member").length}
								</div>
								<div className="text-sm text-muted-foreground">普通成员</div>
							</div>
						</div>
					</div>
					<div className="bg-card border border-border rounded-xl p-5">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
								<Mail className="w-5 h-5 text-amber-400" />
							</div>
							<div>
								<div className="text-2xl font-bold text-foreground">
									{pendingInvitations.length}
								</div>
								<div className="text-sm text-muted-foreground">待处理邀请</div>
							</div>
						</div>
					</div>
				</div>

				{/* Members Table */}
				<div className="bg-card border border-border rounded-xl overflow-hidden">
					<div className="px-6 py-4 border-b border-border">
						<h2 className="text-lg font-semibold text-foreground">团队成员</h2>
					</div>
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-border">
										<th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
											成员
										</th>
										<th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
											角色
										</th>
										<th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
											加入时间
										</th>
										<th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
											操作
										</th>
									</tr>
								</thead>
								<tbody>
									{members.map((member) => {
										const name =
											member.user.name || member.user.email || "未知用户";
										const role = member.role as keyof typeof roleLabels;
										return (
											<tr
												key={member.id}
												className="border-b border-border/50 last:border-0"
											>
												<td className="px-6 py-4">
													<div className="flex items-center gap-3">
														{member.user.image ? (
															<img
																src={member.user.image}
																alt={name}
																className="w-9 h-9 rounded-full object-cover"
															/>
														) : (
															<div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
																{name[0]?.toUpperCase()}
															</div>
														)}
														<div>
															<div className="font-medium text-foreground flex items-center gap-2">
																{name}
																{role === "owner" && (
																	<Crown className="w-4 h-4 text-amber-400" />
																)}
															</div>
															<div className="text-sm text-muted-foreground">
																{member.user.email}
															</div>
														</div>
													</div>
												</td>
												<td className="px-6 py-4">
													{role === "owner" ? (
														<span
															className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleLabels.owner.color}`}
														>
															{roleLabels.owner.label}
														</span>
													) : (
														<Select
															value={member.role}
															onValueChange={(value) =>
																handleChangeRole(
																	member.id,
																	value as "admin" | "member",
																)
															}
															disabled={updateRoleMutation.isPending}
														>
															<SelectTrigger className="w-32 h-8 bg-muted border-border text-foreground text-xs">
																<SelectValue />
															</SelectTrigger>
															<SelectContent className="bg-popover border-border">
																<SelectItem
																	value="admin"
																	className="text-foreground focus:bg-accent"
																>
																	管理员
																</SelectItem>
																<SelectItem
																	value="member"
																	className="text-foreground focus:bg-accent"
																>
																	成员
																</SelectItem>
															</SelectContent>
														</Select>
													)}
												</td>
												<td className="px-6 py-4 text-muted-foreground">
													{formatDate(member.createdAt)}
												</td>
												<td className="px-6 py-4 text-right">
													{role !== "owner" && (
														<Button
															variant="ghost"
															size="sm"
															className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
															onClick={() => handleRemoveMember(member.id)}
															disabled={removeMutation.isPending}
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Pending Invitations */}
				{pendingInvitations.length > 0 && (
					<div className="bg-card border border-border rounded-xl overflow-hidden">
						<div className="px-6 py-4 border-b border-border">
							<h2 className="text-lg font-semibold text-foreground">
								待处理邀请
							</h2>
						</div>
						<div className="divide-y divide-border/50">
							{pendingInvitations.map((invitation) => {
								const status = getInvitationStatus(invitation);
								return (
									<div
										key={invitation.id}
										className="px-6 py-4 flex items-center justify-between"
									>
										<div className="flex items-center gap-3">
											<div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
												<Mail className="w-4 h-4 text-muted-foreground" />
											</div>
											<div>
												<div className="font-medium text-foreground">
													{invitation.email}
												</div>
												<div className="text-sm text-muted-foreground">
													邀请为{" "}
													{roleLabels[invitation.role]?.label ??
														invitation.role}{" "}
													· 发送于 {formatDate(invitation.createdAt)}
												</div>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<span
												className={`px-2.5 py-1 rounded-full text-xs font-medium ${
													status === "pending"
														? "bg-amber-500/10 text-amber-400"
														: "bg-muted text-muted-foreground"
												}`}
											>
												{status === "pending" ? "等待接受" : "已过期"}
											</span>
											<Button
												variant="ghost"
												size="sm"
												className="text-muted-foreground hover:text-foreground hover:bg-muted"
												onClick={() => handleCancelInvitation(invitation.id)}
												disabled={cancelInvitationMutation.isPending}
											>
												取消
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Invite Modal */}
				{showInviteModal && (
					<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
						<div className="bg-card border border-border rounded-2xl w-full max-w-md">
							<div className="p-6 border-b border-border">
								<h2 className="text-xl font-semibold text-foreground">
									邀请团队成员
								</h2>
							</div>

							<div className="p-6 space-y-4">
								<div>
									<Label className="text-foreground/70">邮箱地址</Label>
									<Input
										type="email"
										placeholder="colleague@example.com"
										value={inviteEmail}
										onChange={(e) => setInviteEmail(e.target.value)}
										className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground/60"
									/>
								</div>

								<div>
									<Label className="text-foreground/70">角色</Label>
									<Select
										value={inviteRole}
										onValueChange={(value) =>
											setInviteRole(value as "admin" | "member")
										}
									>
										<SelectTrigger className="mt-2 bg-muted border-border text-foreground">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-popover border-border">
											<SelectItem
												value="admin"
												className="text-foreground focus:bg-accent"
											>
												<div>
													<div className="font-medium">管理员</div>
													<div className="text-xs text-muted-foreground">
														可以管理团队、密钥和服务配置
													</div>
												</div>
											</SelectItem>
											<SelectItem
												value="member"
												className="text-foreground focus:bg-accent"
											>
												<div>
													<div className="font-medium">成员</div>
													<div className="text-xs text-muted-foreground">
														可以查看和使用服务
													</div>
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="p-6 border-t border-border flex justify-end gap-3">
								<Button
									variant="ghost"
									className="text-muted-foreground hover:text-foreground hover:bg-muted"
									onClick={() => setShowInviteModal(false)}
								>
									取消
								</Button>
								<Button
									className="bg-cyan-500 hover:bg-cyan-600"
									onClick={handleInvite}
									disabled={!inviteEmail.trim() || inviteMutation.isPending}
								>
									{inviteMutation.isPending ? "发送中..." : "发送邀请"}
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</DashboardLayout>
	);
}
