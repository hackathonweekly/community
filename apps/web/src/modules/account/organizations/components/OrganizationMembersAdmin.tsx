"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import { Input } from "@community/ui/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@community/ui/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@community/ui/ui/alert-dialog";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import {
	Search,
	UserCheck,
	UserX,
	Crown,
	Mail,
	Settings,
	MessageSquare,
	Users,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { InviteMemberForm } from "@account/organizations/components/InviteMemberForm";
import { OrganizationFunctionalRolesPanel } from "@account/organizations/components/OrganizationFunctionalRolesPanel";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Checkbox } from "@community/ui/ui/checkbox";
import { SendMessageModal } from "./SendMessageModal";

interface OrganizationMember {
	id: string;
	role: string;
	createdAt: string;
	user?: {
		id: string;
		name: string | null;
		email: string;
		username: string | null;
		image: string | null;
		bio: string | null;
		userRoleString: string | null;
		region: string | null;
		showEmail: boolean;
		showWechat: boolean;
		wechatId: string | null;
		githubUrl: string | null;
		twitterUrl: string | null;
		websiteUrl: string | null;
		skills: string[];
		profilePublic: boolean;
		// 会员身份字段
		membershipLevel?: string | null;
	};
	inviter?: {
		id: string;
		name: string | null;
		username: string | null;
	} | null;
	// Legacy fields for backward compatibility
	name?: string;
	email?: string;
	joinedAt?: string;
	lastActiveAt?: string;
	contributionValue?: number;
	status?: "active" | "inactive";
}

interface MemberApplication {
	id: string;
	name: string;
	email: string;
	username: string | null;
	userId: string;
	appliedAt: string;
	status: "pending" | "approved" | "rejected";
	message: string;
	phoneNumber: string | null;
	phoneNumberVerified?: boolean | null;
	wechatId: string | null;
	inviter?: {
		id: string;
		name: string | null;
		email: string | null;
		username: string | null;
	} | null;
	referral?: {
		inviteeName: string;
		inviterName: string | null;
		inviterEmail: string | null;
		invitationReason: string | null;
		eligibilityDetails: string | null;
	};
}

interface MemberInvitation {
	id: string;
	organizationId: string;
	role: string;
	status: "pending" | "accepted" | "expired";
	email: string | null;
	expiresAt: string;
	targetUserId: string | null;
	targetUser: {
		id: string;
		name: string | null;
		email: string | null;
		username: string | null;
		image: string | null;
	} | null;
	inviter: {
		id: string;
		name: string | null;
		email: string | null;
	} | null;
	metadata: {
		originalEmail?: string | null;
		targetUserId?: string | null;
		placeholderEmailUsed?: boolean;
		notificationSent?: boolean;
		linkType?: string;
		createdByUserId?: string;
		claimedByUserId?: string | null;
		claimedEmail?: string | null;
		claimedAt?: string | null;
		pendingProfileUserId?: string | null;
		inviterQuestionnaire?: {
			inviteeName?: string;
			invitationReason?: string;
			eligibilityDetails?: string;
		};
	};
	linkType?: string;
	notificationSent?: boolean;
	sharePath: string;
	shareUrl: string;
	createdAt: string;
	updatedAt: string;
}

interface ReferralInvitationRequest {
	id: string;
	code: string;
	status: "PENDING" | "APPLICATION_SUBMITTED" | "APPROVED" | "REJECTED";
	inviteeName: string;
	invitationReason: string;
	eligibilityDetails: string;
	inviter: {
		id: string;
		name: string | null;
		email: string | null;
	} | null;
	application: {
		id: string;
		status: string;
		submittedAt: string;
		user: {
			id: string;
			name: string | null;
			email: string | null;
			username: string | null;
		} | null;
	} | null;
	createdAt: string;
	updatedAt: string;
}

export function OrganizationMembersAdmin({
	organizationSlug,
}: {
	organizationSlug?: string;
}) {
	const [activeTab, setActiveTab] = useState("members");
	const [members, setMembers] = useState<OrganizationMember[]>([]);
	const [applications, setApplications] = useState<MemberApplication[]>([]);
	const [invitations, setInvitations] = useState<MemberInvitation[]>([]);
	const [referralRequests, setReferralRequests] = useState<
		ReferralInvitationRequest[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [showInviteModal, setShowInviteModal] = useState(false);
	const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
		new Set(),
	);
	const [showMessageModal, setShowMessageModal] = useState(false);
	const [organizationData, setOrganizationData] = useState<{
		id: string;
		name: string;
		slug: string;
	} | null>(null);
	const { toast } = useToast();

	const getOrgSlug = () =>
		organizationSlug || window.location.pathname.split("/")[2];

	const resolvedOrganizationSlug =
		organizationSlug || organizationData?.slug || getOrgSlug();

	useEffect(() => {
		fetchMembers();
		fetchApplications();
		fetchInvitations();
	}, []);

	const fetchMembers = async () => {
		try {
			const orgSlug = resolvedOrganizationSlug;
			const response = await fetch(
				`/api/organizations/${orgSlug}/members`,
			);
			if (response.ok) {
				const data = await response.json();
				setMembers(data.members || []);
				setOrganizationData(data.organization);
			}
		} catch (error) {
			console.error("Failed to fetch members:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchApplications = async () => {
		try {
			const orgSlug = resolvedOrganizationSlug;
			// First get organization data to get the ID
			const orgResponse = await fetch(
				`/api/organizations/by-slug/${orgSlug}`,
			);
			if (!orgResponse.ok) {
				return;
			}

			const orgData = await orgResponse.json();
			const response = await fetch(
				`/api/organizations/${orgData.id}/applications?status=PENDING`,
			);
			if (response.ok) {
				const data = await response.json();
				// Transform the API response to match the expected format
				const transformedApplications = (data.applications || []).map(
					(app: any) => ({
						id: app.id,
						name: app.user.name || "未知用户",
						email: app.user.email,
						username: app.user.username || null,
						userId: app.user.id,
						appliedAt: app.submittedAt,
						status: app.status.toLowerCase(),
						message: app.reason,
						phoneNumber: app.user.phoneNumber ?? null,
						phoneNumberVerified:
							app.user.phoneNumberVerified ?? null,
						wechatId: app.user.wechatId ?? null,
						inviter: app.inviter
							? {
									id: app.inviter.id,
									name: app.inviter.name ?? null,
									email: app.inviter.email ?? null,
									username: app.inviter.username ?? null,
								}
							: null,
						referral: app.invitationRequest
							? {
									inviteeName:
										app.invitationRequest.inviteeName || "",
									inviterName:
										app.invitationRequest.inviter?.name ||
										null,
									inviterEmail:
										app.invitationRequest.inviter?.email ||
										null,
									invitationReason:
										app.invitationRequest
											.invitationReason || null,
									eligibilityDetails:
										app.invitationRequest
											.eligibilityDetails || null,
								}
							: undefined,
					}),
				);
				setApplications(transformedApplications);
			}
		} catch (error) {
			console.error("Failed to fetch applications:", error);
		}
	};

	const fetchInvitations = async () => {
		try {
			const orgSlug = resolvedOrganizationSlug;
			const response = await fetch(
				`/api/organizations/${orgSlug}/invitations`,
			);
			if (response.ok) {
				const data = await response.json();
				setInvitations(data.invitations || []);
				setReferralRequests(data.referralRequests || []);
			}
		} catch (error) {
			console.error("Failed to fetch invitations:", error);
		}
	};

	const handleRoleChange = async (memberId: string, newRole: string) => {
		try {
			const orgSlug = resolvedOrganizationSlug;
			const response = await fetch(
				`/api/organizations/${orgSlug}/members/${memberId}/role`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ role: newRole }),
				},
			);
			if (response.ok) {
				fetchMembers();
			}
		} catch (error) {
			console.error("Failed to update role:", error);
		}
	};

	const handleRemoveMember = async (memberId: string) => {
		try {
			const orgSlug = resolvedOrganizationSlug;
			const response = await fetch(
				`/api/organizations/${orgSlug}/members/${memberId}`,
				{
					method: "DELETE",
				},
			);
			if (response.ok) {
				fetchMembers();
				toast({
					title: "成功",
					description: "成员已成功移除",
				});
			} else {
				const errorData = await response.json();
				toast({
					title: "移除失败",
					description: errorData.error || "未知错误",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Failed to remove member:", error);
			toast({
				title: "操作失败",
				description: "移除成员失败",
				variant: "destructive",
			});
		}
	};

	const handleApplicationAction = async (
		applicationId: string,
		action: "approve" | "reject",
	) => {
		try {
			const response = await fetch(
				`/api/organizations/applications/${applicationId}/review`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						status: action === "approve" ? "APPROVED" : "REJECTED",
						reviewNote:
							action === "reject" ? "申请被拒绝" : undefined,
					}),
				},
			);
			if (response.ok) {
				fetchApplications();
				if (action === "approve") {
					fetchMembers();
				}
				toast({
					title: "操作成功",
					description:
						action === "approve" ? "申请已通过" : "申请已拒绝",
				});
			} else {
				const errorData = await response.json();
				toast({
					title: "操作失败",
					description: errorData.error || "未知错误",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Failed to handle application:", error);
			toast({
				title: "操作失败",
				description: "处理申请失败",
				variant: "destructive",
			});
		}
	};

	const handleInvitationAction = async (
		invitationId: string,
		action: "approve" | "reject",
	) => {
		try {
			const orgSlug = resolvedOrganizationSlug;

			if (action === "approve") {
				// For approval, we need to accept the invitation
				const response = await fetch(
					`/api/organizations/invitations/${invitationId}/accept`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
					},
				);

				if (response.ok) {
					fetchInvitations();
					fetchMembers();
					toast({
						title: "邀请通过",
						description: "成员邀请已通过，用户已加入组织",
					});
				} else {
					const errorData = await response.json();
					toast({
						title: "操作失败",
						description: errorData.error || "通过邀请失败",
						variant: "destructive",
					});
				}
			} else {
				// For rejection, we need to mark the invitation as expired/rejected
				// Since there's no direct rejection endpoint, we can update the invitation status
				// This would need a custom endpoint or we can delete the invitation
				toast({
					title: "功能开发中",
					description: "邀请拒绝功能正在开发中",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Failed to handle invitation:", error);
			toast({
				title: "操作失败",
				description: "处理邀请失败",
				variant: "destructive",
			});
		}
	};

	// 批量操作函数
	const handleSelectMember = (memberId: string) => {
		const newSelected = new Set(selectedMembers);
		if (newSelected.has(memberId)) {
			newSelected.delete(memberId);
		} else {
			newSelected.add(memberId);
		}
		setSelectedMembers(newSelected);
	};

	const handleSelectAll = () => {
		if (selectedMembers.size === filteredMembers.length) {
			setSelectedMembers(new Set());
		} else {
			setSelectedMembers(new Set(filteredMembers.map((m) => m.id)));
		}
	};

	const handleBatchRoleChange = async (newRole: string) => {
		const selectedArray = Array.from(selectedMembers);
		let successCount = 0;

		for (const memberId of selectedArray) {
			try {
				const orgSlug = resolvedOrganizationSlug;
				const response = await fetch(
					`/api/organizations/${orgSlug}/members/${memberId}/role`,
					{
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ role: newRole }),
					},
				);
				if (response.ok) {
					successCount++;
				}
			} catch (error) {
				console.error(
					"Failed to update role for member:",
					memberId,
					error,
				);
			}
		}

		toast({
			title: "批量操作完成",
			description: `成功修改 ${successCount}/${selectedArray.length} 个成员的角色`,
		});

		setSelectedMembers(new Set());
		fetchMembers();
	};

	const handleBatchRemove = async () => {
		const selectedArray = Array.from(selectedMembers);
		let successCount = 0;

		for (const memberId of selectedArray) {
			try {
				const orgSlug = resolvedOrganizationSlug;
				const response = await fetch(
					`/api/organizations/${orgSlug}/members/${memberId}`,
					{
						method: "DELETE",
					},
				);
				if (response.ok) {
					successCount++;
				}
			} catch (error) {
				console.error("Failed to remove member:", memberId, error);
			}
		}

		toast({
			title: "批量删除完成",
			description: `成功删除 ${successCount}/${selectedArray.length} 个成员`,
		});

		setSelectedMembers(new Set());
		fetchMembers();
	};

	// 群发消息函数
	const handleSendMessage = async (
		type: "EMAIL" | "SMS",
		subject: string,
		content: string,
	) => {
		try {
			const orgSlug = resolvedOrganizationSlug;
			const response = await fetch(
				`/api/organizations/${orgSlug}/send-message`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						type,
						subject,
						content,
						memberIds:
							selectedMembers.size > 0
								? Array.from(selectedMembers)
								: undefined,
					}),
				},
			);

			if (response.ok) {
				const result = await response.json();
				toast({
					title: "消息发送完成",
					description: `成功发送 ${result.successCount}/${result.totalCount} 条消息`,
				});
				setShowMessageModal(false);
				setSelectedMembers(new Set());
			} else {
				const errorData = await response.json();
				toast({
					title: "发送失败",
					description: errorData.error || "未知错误",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Failed to send message:", error);
			toast({
				title: "发送失败",
				description: "网络错误",
				variant: "destructive",
			});
		}
	};

	const filteredMembers = members.filter((member) => {
		const name = member.user?.name || member.name || "";
		const email = member.user?.email || member.email || "";

		const matchesSearch =
			name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			email.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesRole = roleFilter === "all" || member.role === roleFilter;
		return matchesSearch && matchesRole;
	});

	const pendingApplications = applications.filter(
		(app) => app.status === "pending",
	);

	const pendingInvitations = invitations.filter(
		(invitation) => invitation.status === "pending",
	);

	const pendingReferralRequests = referralRequests.filter(
		(request) =>
			request.status === "PENDING" ||
			request.status === "APPLICATION_SUBMITTED",
	);

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-muted rounded w-64" />
					<div className="h-96 bg-muted rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* 页面标题 */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-brand text-2xl font-bold text-foreground">
						成员管理
					</h1>
					<p className="text-muted-foreground mt-1">
						管理组织成员与权限
					</p>
				</div>
				<div className="flex space-x-2">
					<Button
						variant="outline"
						onClick={() => setShowMessageModal(true)}
						disabled={members.length === 0}
					>
						<MessageSquare className="w-4 h-4 mr-2" />
						群发消息
					</Button>
					<Button onClick={() => setShowInviteModal(true)}>
						<Mail className="w-4 h-4 mr-2" />
						邀请成员
					</Button>
				</div>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-6"
			>
				<TabsList>
					<TabsTrigger value="members" className="whitespace-nowrap">
						成员列表
					</TabsTrigger>
					<TabsTrigger
						value="applications"
						className="relative whitespace-nowrap"
					>
						申请审批
						{pendingApplications.length > 0 && (
							<Badge className="ml-2 h-5 w-5 p-0 text-xs">
								{pendingApplications.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger
						value="functionalRoles"
						className="whitespace-nowrap"
					>
						职能角色
					</TabsTrigger>
				</TabsList>

				<TabsContent value="members" className="space-y-6">
					{/* 搜索和筛选 */}
					<Card>
						<CardHeader>
							<CardTitle>成员列表</CardTitle>
							<CardDescription>
								当前组织共有 {members.length} 名成员
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center space-x-4">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="搜索成员姓名或邮箱..."
										value={searchTerm}
										onChange={(e) =>
											setSearchTerm(e.target.value)
										}
										className="pl-10"
									/>
								</div>
								<Select
									value={roleFilter}
									onValueChange={setRoleFilter}
								>
									<SelectTrigger className="w-32">
										<SelectValue placeholder="角色筛选" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											全部角色
										</SelectItem>
										<SelectItem value="member">
											普通成员
										</SelectItem>
										<SelectItem value="admin">
											管理员
										</SelectItem>
										<SelectItem value="core">
											核心成员
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* 批量操作栏 */}
							{selectedMembers.size > 0 && (
								<div className="rounded-lg border border-border bg-accent/50 p-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="flex items-center space-x-2">
												<Users className="w-4 h-4 text-primary" />
												<span className="text-sm text-foreground">
													已选择{" "}
													{selectedMembers.size}{" "}
													个成员
												</span>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<Select
												onValueChange={
													handleBatchRoleChange
												}
											>
												<SelectTrigger className="w-32">
													<SelectValue placeholder="批量角色" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="member">
														设为普通成员
													</SelectItem>
													<SelectItem value="core">
														设为核心成员
													</SelectItem>
													<SelectItem value="admin">
														设为管理员
													</SelectItem>
												</SelectContent>
											</Select>
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													setShowMessageModal(true)
												}
											>
												<MessageSquare className="w-4 h-4 mr-1" />
												发消息
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														size="sm"
														variant="destructive"
													>
														<Trash2 className="w-4 h-4 mr-1" />
														批量删除
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															确认批量删除
														</AlertDialogTitle>
														<AlertDialogDescription>
															您确定要删除选中的{" "}
															{
																selectedMembers.size
															}{" "}
															个成员吗？此操作无法撤销。
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>
															取消
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={
																handleBatchRemove
															}
															className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
														>
															确认删除
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
											<Button
												size="sm"
												variant="ghost"
												onClick={() =>
													setSelectedMembers(
														new Set(),
													)
												}
											>
												取消选择
											</Button>
										</div>
									</div>
								</div>
							)}

							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-12">
											<Checkbox
												checked={
													selectedMembers.size ===
														filteredMembers.length &&
													filteredMembers.length > 0
												}
												onCheckedChange={
													handleSelectAll
												}
											/>
										</TableHead>
										<TableHead>姓名</TableHead>
										<TableHead>邮箱</TableHead>
										<TableHead>邀请人</TableHead>
										<TableHead>技能标签</TableHead>
										<TableHead>最后活跃</TableHead>
										<TableHead>角色</TableHead>
										<TableHead>加入时间</TableHead>
										<TableHead>操作</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredMembers.map((member) => (
										<TableRow key={member.id}>
											<TableCell>
												<Checkbox
													checked={selectedMembers.has(
														member.id,
													)}
													onCheckedChange={() =>
														handleSelectMember(
															member.id,
														)
													}
													disabled={
														member.role === "owner"
													}
												/>
											</TableCell>
											<TableCell className="font-medium">
												<Link
													href={`/u/${member.user?.username || member.user?.id}`}
													className="hover:text-primary hover:underline"
												>
													{member.user?.name ||
														member.name ||
														"Unknown"}
												</Link>
											</TableCell>
											<TableCell>
												{member.user?.email ||
													member.email ||
													"No email"}
											</TableCell>
											<TableCell>
												{member.inviter ? (
													member.inviter.username ? (
														<Link
															href={`/u/${member.inviter.username}`}
															className="text-sm text-muted-foreground hover:text-primary hover:underline"
														>
															{member.inviter
																.name ||
																member.inviter
																	.username ||
																"未知"}
														</Link>
													) : (
														<span className="text-sm text-muted-foreground">
															{member.inviter
																.name || "未知"}
														</span>
													)
												) : (
													<span className="text-xs text-muted-foreground">
														—
													</span>
												)}
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1 max-w-xs">
													{member.user?.skills &&
													member.user.skills.length >
														0 ? (
														member.user.skills
															.slice(0, 2)
															.map(
																(
																	skill: string,
																	index: number,
																) => (
																	<Badge
																		key={
																			index
																		}
																		variant="default"
																		className="text-xs"
																	>
																		{skill}
																	</Badge>
																),
															)
													) : member.user
															?.userRoleString ? (
														<Badge
															variant="outline"
															className="text-xs"
														>
															{
																member.user
																	.userRoleString
															}
														</Badge>
													) : (
														<span className="text-xs text-muted-foreground">
															暂无技能
														</span>
													)}
													{member.user?.skills &&
														member.user.skills
															.length > 2 && (
															<Badge
																variant="secondary"
																className="text-xs"
															>
																+
																{member.user
																	.skills
																	.length - 2}
															</Badge>
														)}
												</div>
											</TableCell>
											<TableCell>
												<span className="text-xs text-muted-foreground">
													{member.lastActiveAt
														? new Date(
																member.lastActiveAt,
															).toLocaleDateString()
														: "未知"}
												</span>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														member.role === "owner"
															? "default"
															: member.role ===
																	"admin"
																? "destructive"
																: member.role ===
																		"core"
																	? "secondary"
																	: "outline"
													}
												>
													{member.role ===
														"owner" && (
														<Crown className="w-3 h-3 mr-1" />
													)}
													{member.role ===
														"admin" && (
														<Crown className="w-3 h-3 mr-1" />
													)}
													{member.role === "owner"
														? "组织者"
														: member.role ===
																"admin"
															? "管理员"
															: member.role ===
																	"core"
																? "核心成员"
																: "普通成员"}
												</Badge>
											</TableCell>
											<TableCell>
												{new Date(
													member.createdAt ||
														member.joinedAt ||
														Date.now(),
												).toLocaleDateString()}
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													{member.role !==
														"owner" && (
														<Dialog>
															<DialogTrigger
																asChild
															>
																<Button
																	size="sm"
																	variant="outline"
																>
																	<Settings className="w-4 h-4" />
																</Button>
															</DialogTrigger>
															<DialogContent>
																<DialogHeader>
																	<DialogTitle>
																		管理成员:{" "}
																		{member
																			.user
																			?.name ||
																			member.name ||
																			"Unknown"}
																	</DialogTitle>
																	<DialogDescription>
																		调整成员角色和权限
																	</DialogDescription>
																</DialogHeader>
																<div className="space-y-4 pt-4">
																	<div>
																		<label
																			htmlFor={`role-select-${member.id}`}
																			className="text-sm font-medium"
																		>
																			角色
																		</label>
																		<Select
																			value={
																				member.role
																			}
																			onValueChange={(
																				value,
																			) =>
																				handleRoleChange(
																					member.id,
																					value,
																				)
																			}
																		>
																			<SelectTrigger
																				id={`role-select-${member.id}`}
																				className="mt-1"
																			>
																				<SelectValue />
																			</SelectTrigger>
																			<SelectContent>
																				<SelectItem value="member">
																					普通成员
																				</SelectItem>
																				<SelectItem value="core">
																					核心成员
																				</SelectItem>
																				<SelectItem value="admin">
																					管理员
																				</SelectItem>
																			</SelectContent>
																		</Select>
																	</div>
																	<div className="border-t pt-4">
																		<AlertDialog>
																			<AlertDialogTrigger
																				asChild
																			>
																				<Button
																					variant="destructive"
																					size="sm"
																					className="w-full"
																				>
																					<UserX className="w-4 h-4 mr-2" />
																					移除成员
																				</Button>
																			</AlertDialogTrigger>
																			<AlertDialogContent>
																				<AlertDialogHeader>
																					<AlertDialogTitle>
																						确认移除成员
																					</AlertDialogTitle>
																					<AlertDialogDescription>
																						您确定要移除成员
																						"
																						{member
																							.user
																							?.name ||
																							member.name ||
																							"Unknown"}
																						"
																						吗？此操作无法撤销。
																					</AlertDialogDescription>
																				</AlertDialogHeader>
																				<AlertDialogFooter>
																					<AlertDialogCancel>
																						取消
																					</AlertDialogCancel>
																					<AlertDialogAction
																						onClick={() =>
																							handleRemoveMember(
																								member.id,
																							)
																						}
																						className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
																					>
																						确认移除
																					</AlertDialogAction>
																				</AlertDialogFooter>
																			</AlertDialogContent>
																		</AlertDialog>
																	</div>
																</div>
															</DialogContent>
														</Dialog>
													)}
													{member.role ===
														"owner" && (
														<span className="text-sm text-muted-foreground italic px-3 py-1">
															组织创建者
														</span>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					{/* 成员推荐申请 */}
					<Card>
						<CardHeader>
							<CardTitle>成员推荐申请</CardTitle>
							<CardDescription>
								待跟进推荐 {pendingReferralRequests.length} 个
							</CardDescription>
						</CardHeader>
						<CardContent>
							{pendingReferralRequests.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>候选人</TableHead>
											<TableHead>邀请人</TableHead>
											<TableHead>当前状态</TableHead>
											<TableHead>邀请信息</TableHead>
											<TableHead>操作</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pendingReferralRequests.map(
											(request) => {
												const inviter = request.inviter;
												const statusLabel =
													request.status ===
													"APPLICATION_SUBMITTED"
														? "候选人已提交申请"
														: "等待候选人申请";
												return (
													<TableRow key={request.id}>
														<TableCell className="font-medium">
															{
																request.inviteeName
															}
														</TableCell>
														<TableCell>
															<div className="space-y-1">
																<div>
																	{inviter?.name ||
																		"未知用户"}
																</div>
																{inviter?.email ? (
																	<div className="text-xs text-muted-foreground">
																		{
																			inviter.email
																		}
																	</div>
																) : null}
															</div>
														</TableCell>
														<TableCell>
															<Badge
																variant={
																	request.status ===
																	"APPLICATION_SUBMITTED"
																		? "default"
																		: "secondary"
																}
															>
																{statusLabel}
															</Badge>
														</TableCell>
														<TableCell className="max-w-md">
															<Dialog>
																<DialogTrigger
																	asChild
																>
																	<Button
																		variant="ghost"
																		size="sm"
																		className="h-auto p-0 text-left font-normal hover:underline"
																	>
																		查看邀请详情
																	</Button>
																</DialogTrigger>
																<DialogContent className="max-w-3xl max-h-[75vh] overflow-y-auto">
																	<DialogHeader>
																		<DialogTitle>
																			{
																				request.inviteeName
																			}{" "}
																			的推荐信息
																		</DialogTitle>
																		<DialogDescription>
																			由{" "}
																			{inviter?.name ||
																				"未知用户"}{" "}
																			提交于{" "}
																			{new Date(
																				request.createdAt,
																			).toLocaleString()}
																		</DialogDescription>
																	</DialogHeader>
																	<div className="space-y-4 py-2">
																		<div className="space-y-2">
																			<h4 className="font-medium text-sm text-muted-foreground">
																				邀请理由
																			</h4>
																			<div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
																				{request.invitationReason ||
																					"邀请人未填写"}
																			</div>
																		</div>
																		<div className="space-y-2">
																			<h4 className="font-medium text-sm text-muted-foreground">
																				符合加入条件的依据
																			</h4>
																			<div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
																				{request.eligibilityDetails ||
																					"邀请人未补充"}
																			</div>
																		</div>
																		{request.application ? (
																			<div className="space-y-2">
																				<h4 className="font-medium text-sm text-muted-foreground">
																					候选人申请情况
																				</h4>
																				<div className="p-3 bg-muted/50 rounded-md text-sm">
																					候选人已于{" "}
																					{new Date(
																						request
																							.application
																							.submittedAt,
																					).toLocaleString()}{" "}
																					提交申请。
																				</div>
																			</div>
																		) : null}
																	</div>
																</DialogContent>
															</Dialog>
														</TableCell>
														<TableCell>
															<div className="flex items-center space-x-2">
																{request.application ? (
																	<Button
																		size="sm"
																		onClick={() => {
																			setActiveTab(
																				"applications",
																			);
																			window.requestAnimationFrame(
																				() => {
																					window.scrollTo(
																						{
																							top: 0,
																							behavior:
																								"smooth",
																						},
																					);
																				},
																			);
																		}}
																	>
																		<UserCheck className="w-4 h-4 mr-1" />
																		前往审批
																	</Button>
																) : (
																	<span className="text-sm text-muted-foreground">
																		等待候选人提交申请
																	</span>
																)}
															</div>
														</TableCell>
													</TableRow>
												);
											},
										)}
									</TableBody>
								</Table>
							) : (
								<div className="text-center py-8 text-muted-foreground">
									暂无待处理的成员推荐
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="applications" className="space-y-6">
					{/* 直接申请 */}
					<Card>
						<CardHeader>
							<CardTitle>直接申请</CardTitle>
							<CardDescription>
								待处理直接申请 {pendingApplications.length} 个
							</CardDescription>
						</CardHeader>
						<CardContent>
							{pendingApplications.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>姓名</TableHead>
											<TableHead>邮箱</TableHead>
											<TableHead>联系方式</TableHead>
											<TableHead>申请时间</TableHead>
											<TableHead>申请理由</TableHead>
											<TableHead>操作</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pendingApplications.map(
											(application) => (
												<TableRow key={application.id}>
													<TableCell className="font-medium">
														{application.username ? (
															<Link
																href={`/u/${application.username}`}
																className="hover:text-primary hover:underline"
																target="_blank"
															>
																{
																	application.name
																}
															</Link>
														) : (
															<span>
																{
																	application.name
																}
															</span>
														)}
													</TableCell>
													<TableCell>
														{application.email}
													</TableCell>
													<TableCell>
														<div className="flex flex-col gap-1 text-sm">
															{application.phoneNumber ? (
																<span>
																	手机号：
																	{
																		application.phoneNumber
																	}
																	{application.phoneNumberVerified ===
																	false ? (
																		<span className="ml-1 text-xs text-muted-foreground">
																			未验证
																		</span>
																	) : null}
																</span>
															) : null}
															{application.wechatId ? (
																<span>
																	微信：
																	{
																		application.wechatId
																	}
																</span>
															) : null}
															{!application.phoneNumber &&
															!application.wechatId ? (
																<span className="text-muted-foreground">
																	未提供
																</span>
															) : null}
														</div>
													</TableCell>
													<TableCell>
														{new Date(
															application.appliedAt,
														).toLocaleDateString()}
													</TableCell>
													<TableCell className="max-w-md">
														<Dialog>
															<DialogTrigger
																asChild
															>
																<Button
																	variant="ghost"
																	size="sm"
																	className="h-auto p-0 text-left font-normal hover:underline"
																>
																	<div className="max-w-xs truncate">
																		{
																			application.message
																		}
																	</div>
																</Button>
															</DialogTrigger>
															<DialogContent className="max-w-2xl">
																<DialogHeader>
																	<DialogTitle>
																		申请理由
																		-{" "}
																		{
																			application.name
																		}
																	</DialogTitle>
																	<DialogDescription>
																		{new Date(
																			application.appliedAt,
																		).toLocaleString()}
																	</DialogDescription>
																</DialogHeader>
																<div className="space-y-6 py-4 text-sm">
																	<div className="whitespace-pre-wrap">
																		{
																			application.message
																		}
																	</div>
																	<div className="space-y-2 border-t pt-4">
																		<h4 className="font-medium text-muted-foreground">
																			联系方式
																		</h4>
																		{application.phoneNumber ||
																		application.wechatId ? (
																			<div className="space-y-1 text-sm">
																				{application.phoneNumber ? (
																					<p>
																						手机号：
																						{
																							application.phoneNumber
																						}
																						{application.phoneNumberVerified ===
																						false ? (
																							<span className="ml-1 text-xs text-muted-foreground">
																								未验证
																							</span>
																						) : null}
																					</p>
																				) : null}
																				{application.wechatId ? (
																					<p>
																						微信：
																						{
																							application.wechatId
																						}
																					</p>
																				) : null}
																			</div>
																		) : (
																			<p className="text-sm text-muted-foreground">
																				未提供
																			</p>
																		)}
																	</div>
																	{application.inviter ? (
																		<div className="space-y-2 border-t pt-4">
																			<h4 className="font-medium text-muted-foreground">
																				邀请人
																			</h4>
																			<p className="text-sm">
																				{application
																					.inviter
																					.name ||
																					application
																						.inviter
																						.username ||
																					"未知"}
																				{application
																					.inviter
																					.email
																					? `（${application.inviter.email}）`
																					: null}
																			</p>
																		</div>
																	) : null}
																	{application.referral ? (
																		<div className="space-y-3 border-t pt-4">
																			<h4 className="font-medium text-muted-foreground">
																				邀请人补充信息
																			</h4>
																			<div className="rounded-md bg-muted/40 p-3 whitespace-pre-wrap">
																				<strong>
																					邀请理由：
																				</strong>
																				{application
																					.referral
																					.invitationReason ||
																					"暂无"}
																			</div>
																			<div className="rounded-md bg-muted/40 p-3 whitespace-pre-wrap">
																				<strong>
																					符合加入条件的依据：
																				</strong>
																				{application
																					.referral
																					.eligibilityDetails ||
																					"暂无"}
																			</div>
																			<p className="text-xs text-muted-foreground">
																				邀请人：
																				{application
																					.referral
																					.inviterName ||
																					"未知"}
																				{application
																					.referral
																					.inviterEmail
																					? `（${application.referral.inviterEmail}）`
																					: null}
																			</p>
																		</div>
																	) : null}
																</div>
															</DialogContent>
														</Dialog>
													</TableCell>
													<TableCell>
														<div className="flex items-center space-x-2">
															<Button
																size="sm"
																onClick={() =>
																	handleApplicationAction(
																		application.id,
																		"approve",
																	)
																}
															>
																<UserCheck className="w-4 h-4 mr-1" />
																通过
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={() =>
																	handleApplicationAction(
																		application.id,
																		"reject",
																	)
																}
															>
																<UserX className="w-4 h-4 mr-1" />
																拒绝
															</Button>
														</div>
													</TableCell>
												</TableRow>
											),
										)}
									</TableBody>
								</Table>
							) : (
								<div className="text-center py-8 text-muted-foreground">
									暂无待处理的直接申请
								</div>
							)}
						</CardContent>
					</Card>

					{/* 成员邀请 */}
					<Card>
						<CardHeader>
							<CardTitle>直接加入邀请</CardTitle>
							<CardDescription>
								待处理直接加入邀请 {pendingInvitations.length}{" "}
								个
							</CardDescription>
						</CardHeader>
						<CardContent>
							{pendingInvitations.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>被邀请人</TableHead>
											<TableHead>邀请人</TableHead>
											<TableHead>邀请时间</TableHead>
											<TableHead>过期时间</TableHead>
											<TableHead>邀请信息</TableHead>
											<TableHead>操作</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pendingInvitations.map(
											(invitation) => {
												const questionnaire =
													invitation.metadata
														?.inviterQuestionnaire;
												return (
													<TableRow
														key={invitation.id}
													>
														<TableCell className="font-medium">
															<div className="space-y-1">
																<div>
																	{questionnaire?.inviteeName ||
																		"未知"}
																</div>
																{invitation.email && (
																	<div className="text-xs text-muted-foreground">
																		{
																			invitation.email
																		}
																	</div>
																)}
															</div>
														</TableCell>
														<TableCell>
															<div className="space-y-1">
																<div>
																	{invitation
																		.inviter
																		?.name ||
																		"未知用户"}
																</div>
																{invitation
																	.inviter
																	?.email && (
																	<div className="text-xs text-muted-foreground">
																		{
																			invitation
																				.inviter
																				.email
																		}
																	</div>
																)}
															</div>
														</TableCell>
														<TableCell>
															{new Date(
																invitation.createdAt,
															).toLocaleDateString()}
														</TableCell>
														<TableCell>
															<div
																className={`text-sm ${
																	new Date(
																		invitation.expiresAt,
																	) <=
																	new Date()
																		? "text-destructive"
																		: "text-primary"
																}`}
															>
																{new Date(
																	invitation.expiresAt,
																).toLocaleDateString()}
															</div>
														</TableCell>
														<TableCell className="max-w-md">
															{questionnaire ? (
																<Dialog>
																	<DialogTrigger
																		asChild
																	>
																		<Button
																			variant="ghost"
																			size="sm"
																			className="h-auto p-0 text-left font-normal hover:underline"
																		>
																			查看问卷详情
																		</Button>
																	</DialogTrigger>
																	<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
																		<DialogHeader>
																			<DialogTitle>
																				邀请问卷详情
																				-{" "}
																				{
																					questionnaire.inviteeName
																				}
																			</DialogTitle>
																			<DialogDescription>
																				由{" "}
																				{invitation
																					.inviter
																					?.name ||
																					"未知用户"}{" "}
																				填写于{" "}
																				{new Date(
																					invitation.createdAt,
																				).toLocaleString()}
																			</DialogDescription>
																		</DialogHeader>
																		<div className="space-y-6 py-4">
																			<div className="space-y-2">
																				<h4 className="font-medium text-sm text-muted-foreground">
																					邀请理由
																				</h4>
																				<div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
																					{questionnaire.invitationReason ||
																						"邀请人未填写"}
																				</div>
																			</div>
																			<div className="space-y-2">
																				<h4 className="font-medium text-sm text-muted-foreground">
																					符合加入条件的依据
																				</h4>
																				<div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
																					{questionnaire.eligibilityDetails ||
																						"邀请人未补充"}
																				</div>
																			</div>
																		</div>
																	</DialogContent>
																</Dialog>
															) : (
																<span className="text-sm text-muted-foreground">
																	无问卷数据
																</span>
															)}
														</TableCell>
														<TableCell>
															<div className="flex items-center space-x-2">
																<Button
																	size="sm"
																	onClick={() =>
																		handleInvitationAction(
																			invitation.id,
																			"approve",
																		)
																	}
																	disabled={
																		new Date(
																			invitation.expiresAt,
																		) <=
																		new Date()
																	}
																>
																	<UserCheck className="w-4 h-4 mr-1" />
																	通过
																</Button>
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() =>
																		handleInvitationAction(
																			invitation.id,
																			"reject",
																		)
																	}
																>
																	<UserX className="w-4 h-4 mr-1" />
																	拒绝
																</Button>
															</div>
														</TableCell>
													</TableRow>
												);
											},
										)}
									</TableBody>
								</Table>
							) : (
								<div className="text-center py-8 text-muted-foreground">
									暂无待处理的直接加入邀请
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="functionalRoles" className="space-y-6">
					<OrganizationFunctionalRolesPanel
						organizationSlug={resolvedOrganizationSlug}
						organizationId={organizationData?.id}
						members={members}
					/>
				</TabsContent>
			</Tabs>

			{/* Send Message Modal */}
			<SendMessageModal
				open={showMessageModal}
				onOpenChange={setShowMessageModal}
				onSendMessage={handleSendMessage}
				selectedCount={selectedMembers.size}
				totalCount={members.length}
			/>

			{/* Invite Member Modal */}
			<Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>邀请成员</DialogTitle>
						<DialogDescription>
							邀请新成员加入组织
						</DialogDescription>
					</DialogHeader>
					{organizationData && (
						<div className="py-4">
							<InviteMemberForm
								organizationId={organizationData.id}
								organizationSlug={organizationData.slug}
								onMemberAdded={fetchMembers}
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
