"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
	MemberList,
	type MemberData,
	type FilterOption,
} from "@/components/shared/MemberList";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { UserLevelBadges } from "@dashboard/level/components/LevelBadge";
import { UserBadgeAward } from "./UserBadgeAward";
import { UserBanDialog } from "./UserBanDialog";
import { UserCpAdjust } from "./UserCpAdjust";
import { UserFunctionalRoleDialog } from "./UserFunctionalRoleDialog";
import {
	Award,
	Ban,
	Briefcase,
	IdCard,
	MoreVerticalIcon,
	Settings,
	ShieldCheck,
	TrendingUp,
	UnlockKeyhole,
	User,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import type { ComponentProps } from "react";

interface AdminUser extends MemberData {
	badgeCount: number;
}

// 等级选项配置
const LEVEL_OPTIONS = {
	MEMBERSHIP: [
		{ value: "NONE", label: "无等级" },
		{ value: "VISITOR", label: "新朋友" },
		{ value: "MEMBER", label: "共创伙伴" },
	],
	CREATOR: [
		{ value: "NONE", label: "无等级" },
		{ value: "C1", label: "创作者 C1" },
		{ value: "C2", label: "创作者 C2" },
		{ value: "C3", label: "创作者 C3" },
	],
	MENTOR: [
		{ value: "NONE", label: "无等级" },
		{ value: "M1", label: "导师 M1" },
		{ value: "M2", label: "导师 M2" },
		{ value: "M3", label: "导师 M3" },
	],
	CONTRIBUTOR: [
		{ value: "NONE", label: "无等级" },
		{ value: "O1", label: "贡献者 O1" },
		{ value: "O2", label: "贡献者 O2" },
		{ value: "O3", label: "贡献者 O3" },
	],
};

const LEVEL_TYPE_OPTIONS = [
	{ value: "MEMBERSHIP", label: "会员等级" },
	{ value: "CREATOR", label: "创作者等级" },
	{ value: "MENTOR", label: "导师等级" },
	{ value: "CONTRIBUTOR", label: "贡献者等级" },
];

// 管理员角色选项配置
const ADMIN_ROLE_OPTIONS = [
	{ value: "user", label: "普通用户", description: "无管理权限" },
	{
		value: "operation_admin",
		label: "运营管理员",
		description: "可以管理用户、内容审核、贡献、勋章等运营相关权限",
	},
	{ value: "super_admin", label: "超级管理员", description: "拥有所有权限" },
];

interface LevelAdjustDialogProps {
	user: AdminUser;
	onAdjust: (
		userId: string,
		levelType: string,
		level: string | null,
		reason: string,
	) => void;
	isLoading: boolean;
	trigger?: React.ReactNode;
}

interface RoleAssignDialogProps {
	user: AdminUser;
	onAssign: (userId: string, role: string, reason: string) => void;
	isLoading: boolean;
	trigger?: React.ReactNode;
}

function RoleAssignDialog({
	user,
	onAssign,
	isLoading,
	trigger,
}: RoleAssignDialogProps) {
	const [open, setOpen] = useState(false);
	const [selectedRole, setSelectedRole] = useState<string>(
		user.role || "user",
	);
	const [reason, setReason] = useState("");

	const handleSubmit = () => {
		if (!reason.trim()) {
			return;
		}

		onAssign(user.id, selectedRole, reason);
		setOpen(false);
		setReason("");
		setSelectedRole(user.role || "user");
	};

	const getCurrentRoleInfo = () => {
		return (
			ADMIN_ROLE_OPTIONS.find((option) => option.value === user.role) || {
				value: user.role || "user",
				label: user.role || "普通用户",
				description: "",
			}
		);
	};

	const getSelectedRoleInfo = () => {
		return ADMIN_ROLE_OPTIONS.find(
			(option) => option.value === selectedRole,
		);
	};

	const getRoleBadge = (role: string) => {
		const roleMap: Record<string, { label: string; variant: any }> = {
			super_admin: { label: "超级管理员", variant: "destructive" },
			admin: { label: "管理员", variant: "destructive" },
			operation_admin: { label: "运营管理员", variant: "default" },
			user: { label: "普通用户", variant: "outline" },
		};

		const roleInfo = roleMap[role] || { label: role, variant: "outline" };
		return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline" size="sm" className="text-xs">
						<ShieldCheck className="h-4 w-4 mr-1" />
						<span className="hidden sm:inline">设置角色</span>
						<span className="sm:hidden">角色</span>
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>设置管理员角色</DialogTitle>
					<DialogDescription>
						为 {user.name} 设置管理员角色，请谨慎操作
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* 用户信息 */}
					<div className="p-4 border rounded-lg bg-muted/50">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="font-medium">用户:</span>{" "}
								{user.name}
							</div>
							<div>
								<span className="font-medium">邮箱:</span>{" "}
								<span className="break-all">{user.email}</span>
							</div>
							{user.username && (
								<div>
									<span className="font-medium">用户名:</span>{" "}
									@{user.username}
								</div>
							)}
						</div>
					</div>

					{/* 当前角色 */}
					<div>
						<Label className="text-base font-medium">
							当前角色
						</Label>
						<div className="mt-2 p-3 border rounded-lg bg-background">
							<div className="flex items-center gap-2">
								{getRoleBadge(user.role || "user")}
								<span className="text-sm text-muted-foreground">
									{getCurrentRoleInfo().description}
								</span>
							</div>
						</div>
					</div>

					{/* 角色选择 */}
					<div>
						<Label htmlFor="role">目标角色</Label>
						<Select
							value={selectedRole}
							onValueChange={setSelectedRole}
						>
							<SelectTrigger>
								<SelectValue placeholder="选择目标角色" />
							</SelectTrigger>
							<SelectContent>
								{ADMIN_ROLE_OPTIONS.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										<div className="flex flex-col">
											<div className="font-medium">
												{option.label}
											</div>
											<div className="text-xs text-muted-foreground">
												{option.description}
											</div>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{getSelectedRoleInfo() && (
							<p className="text-sm text-muted-foreground mt-2">
								{getSelectedRoleInfo()!.description}
							</p>
						)}
					</div>

					{/* 权限变化警告 */}
					{selectedRole !== user.role && (
						<div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
							<div className="flex items-start gap-2">
								<Settings className="h-4 w-4 text-yellow-600 mt-0.5" />
								<div className="text-sm">
									<div className="font-medium text-yellow-800">
										角色变更警告
									</div>
									<div className="text-yellow-700 mt-1">
										用户角色将从{" "}
										<Badge
											variant="outline"
											className="mx-1"
										>
											{getCurrentRoleInfo().label}
										</Badge>
										变更为{" "}
										<Badge
											variant="outline"
											className="mx-1"
										>
											{getSelectedRoleInfo()?.label}
										</Badge>
									</div>
									{selectedRole === "super_admin" && (
										<div className="text-red-600 mt-2 font-medium">
											⚠️
											设置为超级管理员将授予该用户所有系统权限
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					{/* 设置理由 */}
					<div>
						<Label htmlFor="reason">
							设置理由
							<span className="text-sm text-muted-foreground ml-2">
								(至少5个字符)
							</span>
						</Label>
						<Textarea
							id="reason"
							placeholder="请输入角色设置理由，至少5个字符..."
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							rows={3}
						/>
						{reason.length > 0 && reason.length < 5 && (
							<p className="text-sm text-destructive mt-1">
								设置理由至少需要5个字符，当前 {reason.length}{" "}
								个字符
							</p>
						)}
					</div>

					{/* 操作按钮 */}
					<div className="flex gap-3 pt-4">
						<Button
							onClick={handleSubmit}
							disabled={
								isLoading ||
								reason.length < 5 ||
								selectedRole === user.role
							}
							className="flex-1"
							variant={
								selectedRole === "super_admin"
									? "destructive"
									: "default"
							}
						>
							{isLoading ? "处理中..." : "确认设置"}
						</Button>
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isLoading}
						>
							取消
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

interface UserDetailsDialogProps {
	user: AdminUser;
	trigger: React.ReactNode;
}

function UserDetailsDialog({ user, trigger }: UserDetailsDialogProps) {
	const [open, setOpen] = useState(false);

	const accountStatusLabel = useMemo(() => {
		if (!user.status) {
			return "—";
		}
		switch (user.status) {
			case "active":
				return "正常";
			case "inactive":
				return "未激活";
			default:
				return user.status;
		}
	}, [user.status]);

	const detailSections = useMemo(
		() => [
			{
				title: "基础信息",
				items: [
					{ label: "用户ID", value: user.id },
					{ label: "姓名", value: formatNullableText(user.name) },
					{
						label: "用户名",
						value: user.username ? `@${user.username}` : "—",
					},
					{ label: "邮箱", value: user.email },
					{
						label: "手机号",
						value: formatNullableText(user.phoneNumber),
					},
				],
			},
			{
				title: "状态与权限",
				items: [
					{
						label: "管理员角色",
						value: renderAdminRoleBadge(user.role),
					},
					{
						label: "职能角色",
						value: formatNullableText(user.userRoleString),
					},
					{ label: "封禁状态", value: renderBanStatus(user) },
					{ label: "账号状态", value: accountStatusLabel },
				],
			},
			{
				title: "等级信息",
				items: [
					{
						label: "会员等级",
						value: formatNullableText(user.membershipLevel),
					},
					{
						label: "创作者等级",
						value: formatNullableText(user.creatorLevel),
					},
					{
						label: "导师等级",
						value: formatNullableText(user.mentorLevel),
					},
					{
						label: "贡献者等级",
						value: formatNullableText(user.contributorLevel),
					},
				],
			},
			{
				title: "数据统计",
				items: [
					{ label: "CP 值", value: formatNumberValue(user.cpValue) },
					{
						label: "总贡献次数",
						value: formatNumberValue(user.totalContributions),
					},
					{
						label: "通过审核的贡献",
						value: formatNumberValue(user.approvedContributions),
					},
					{
						label: "勋章数量",
						value: formatNumberValue(user.badgeCount),
					},
					{
						label: "贡献值",
						value: formatNumberValue(user.contributionValue),
					},
				],
			},
			{
				title: "时间记录",
				items: [
					{
						label: "注册时间",
						value: formatDateTimeValue(user.createdAt),
					},
					{
						label: "加入组织时间",
						value: formatDateTimeValue(user.joinedAt),
					},
					{
						label: "最近活跃",
						value: formatDateTimeValue(user.lastActiveAt),
					},
					{
						label: "封禁到期",
						value: formatDateTimeValue(user.bannedUntil),
					},
				],
			},
		],
		[user, accountStatusLabel],
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-w-3xl sm:max-w-3xl max-h-[85vh] grid-rows-[auto,1fr] overflow-hidden">
				<DialogHeader className="pr-1 sm:pr-2">
					<DialogTitle>用户详细资料</DialogTitle>
					<DialogDescription>
						查看 {user.name || user.email || `ID: ${user.id}`}{" "}
						的完整信息
					</DialogDescription>
				</DialogHeader>
				<div className="overflow-y-auto pr-1 sm:pr-2">
					<div className="space-y-4 sm:space-y-6">
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg border p-3 sm:p-4">
							<UserAvatar
								name={user.name || user.email}
								avatarUrl={user.image ?? undefined}
								className="h-16 w-16"
							/>
							<div className="space-y-1">
								<h3 className="text-lg font-semibold">
									{user.name || user.email}
								</h3>
								<p className="text-sm text-muted-foreground break-all">
									{user.email}
								</p>
								{user.username && (
									<p className="text-sm text-muted-foreground">
										@{user.username}
									</p>
								)}
								<div className="flex flex-wrap gap-2 pt-1">
									{renderAdminRoleBadge(user.role)}
									{user.userRoleString && (
										<Badge variant="secondary">
											{user.userRoleString}
										</Badge>
									)}
									{renderBanStatus(user)}
								</div>
							</div>
						</div>

						{detailSections.map((section) => (
							<section
								key={section.title}
								className="rounded-lg border p-3 sm:p-4"
							>
								<h4 className="text-sm font-semibold text-muted-foreground">
									{section.title}
								</h4>
								<dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
									{section.items.map((item) => (
										<div
											key={item.label}
											className="space-y-0.5"
										>
											<dt className="text-xs uppercase tracking-wide text-muted-foreground">
												{item.label}
											</dt>
											<dd className="text-sm leading-snug text-foreground break-words">
												{item.value}
											</dd>
										</div>
									))}
								</dl>
							</section>
						))}

						<section className="rounded-lg border p-3 sm:p-4">
							<h4 className="text-sm font-semibold text-muted-foreground">
								技能标签
							</h4>
							<div className="mt-3 min-h-[1.5rem]">
								{user.skills && user.skills.length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{user.skills.map((skill) => (
											<Badge
												key={skill}
												variant="outline"
											>
												{skill}
											</Badge>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										暂无技能信息
									</p>
								)}
							</div>
						</section>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function formatNullableText(value?: string | null) {
	if (!value) {
		return "—";
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : "—";
}

function formatNumberValue(value?: number | null) {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return "—";
	}
	return value.toLocaleString("zh-CN");
}

function formatDateTimeValue(value?: string | null, fallback = "—") {
	if (!value) {
		return fallback;
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return new Intl.DateTimeFormat("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function renderAdminRoleBadge(role?: string | null) {
	const roleConfig: Record<
		string,
		{ label: string; variant: ComponentProps<typeof Badge>["variant"] }
	> = {
		super_admin: { label: "超级管理员", variant: "destructive" },
		admin: { label: "管理员", variant: "secondary" },
		operation_admin: { label: "运营管理员", variant: "secondary" },
		user: { label: "普通用户", variant: "outline" },
	};

	const fallback = role
		? { label: role, variant: "outline" as const }
		: roleConfig.user;
	const resolved = role ? (roleConfig[role] ?? fallback) : roleConfig.user;
	return <Badge variant={resolved.variant}>{resolved.label}</Badge>;
}

function renderBanStatus(user: AdminUser) {
	if (user.isBanned) {
		const until = formatDateTimeValue(user.bannedUntil, "");
		return (
			<Badge variant="destructive">
				已封禁
				{until ? ` · 至 ${until}` : ""}
			</Badge>
		);
	}
	return <Badge variant="outline">正常</Badge>;
}

function LevelAdjustDialog({
	user,
	onAdjust,
	isLoading,
	trigger,
}: LevelAdjustDialogProps) {
	const [open, setOpen] = useState(false);
	const [levelType, setLevelType] = useState<string>("");
	const [level, setLevel] = useState<string>("");
	const [reason, setReason] = useState("");

	const handleSubmit = () => {
		if (!levelType || !reason.trim()) {
			return;
		}

		onAdjust(user.id, levelType, level === "NONE" ? null : level, reason);
		setOpen(false);
		setLevelType("");
		setLevel("");
		setReason("");
	};

	const getCurrentLevel = (type: string) => {
		switch (type) {
			case "MEMBERSHIP":
				return user.membershipLevel;
			case "CREATOR":
				return user.creatorLevel;
			case "MENTOR":
				return user.mentorLevel;
			case "CONTRIBUTOR":
				return user.contributorLevel;
			default:
				return null;
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline" size="sm" className="text-xs">
						<Settings className="h-4 w-4 mr-1" />
						<span className="hidden sm:inline">调整等级</span>
						<span className="sm:hidden">等级</span>
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>调整用户等级</DialogTitle>
					<DialogDescription>
						直接为 {user.name} 设置等级，无需用户申请
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* 用户信息 */}
					<div className="p-4 border rounded-lg bg-muted/50">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="font-medium">用户:</span>{" "}
								{user.name}
							</div>
							<div>
								<span className="font-medium">邮箱:</span>{" "}
								<span className="break-all">{user.email}</span>
							</div>
							{user.username && (
								<div>
									<span className="font-medium">用户名:</span>{" "}
									@{user.username}
								</div>
							)}
						</div>
					</div>

					{/* 当前等级 */}
					<div>
						<Label className="text-base font-medium">
							当前等级
						</Label>
						<div className="mt-2">
							<UserLevelBadges user={user} />
						</div>
					</div>

					{/* 等级类型选择 */}
					<div>
						<Label htmlFor="levelType">等级类型</Label>
						<Select value={levelType} onValueChange={setLevelType}>
							<SelectTrigger>
								<SelectValue placeholder="选择要调整的等级类型" />
							</SelectTrigger>
							<SelectContent>
								{LEVEL_TYPE_OPTIONS.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* 目标等级选择 */}
					{levelType && (
						<div>
							<Label htmlFor="level">
								目标等级
								{getCurrentLevel(levelType) && (
									<span className="text-sm text-muted-foreground ml-2">
										(当前: {getCurrentLevel(levelType)})
									</span>
								)}
							</Label>
							<Select value={level} onValueChange={setLevel}>
								<SelectTrigger>
									<SelectValue placeholder="选择目标等级" />
								</SelectTrigger>
								<SelectContent>
									{LEVEL_OPTIONS[
										levelType as keyof typeof LEVEL_OPTIONS
									]?.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* 调整理由 */}
					<div>
						<Label htmlFor="reason">
							调整理由
							<span className="text-sm text-muted-foreground ml-2">
								(至少5个字符)
							</span>
						</Label>
						<Textarea
							id="reason"
							placeholder="请输入调整理由，至少5个字符..."
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							rows={3}
						/>
						{reason.length > 0 && reason.length < 5 && (
							<p className="text-sm text-destructive mt-1">
								调整理由至少需要5个字符，当前 {reason.length}{" "}
								个字符
							</p>
						)}
					</div>

					{/* 操作按钮 */}
					<div className="flex gap-3 pt-4">
						<Button
							onClick={handleSubmit}
							disabled={
								isLoading || !levelType || reason.length < 5
							}
							className="flex-1"
						>
							{isLoading ? "处理中..." : "确认调整"}
						</Button>
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isLoading}
						>
							取消
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function UserManagementCenter() {
	const { toast } = useToast();
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [totalUserCount, setTotalUserCount] = useState<number>(0);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [levelAdjustLoading, setLevelAdjustLoading] = useState(false);
	const [roleAssignLoading, setRoleAssignLoading] = useState(false);
	// 分页相关状态
	const [currentPage, setCurrentPage] = useState(1);
	const [searchTerm, setSearchTerm] = useState("");
	const [itemsPerPage] = useState(20);
	const [totalPages, setTotalPages] = useState(1);

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async (page = 1, searchTerm?: string) => {
		try {
			setLoading(true);
			const params = new URLSearchParams();
			params.append("limit", itemsPerPage.toString());
			params.append("offset", ((page - 1) * itemsPerPage).toString());
			if (searchTerm) {
				params.append("search", searchTerm);
			}

			const response = await fetch(`/api/super-admin/users?${params}`);
			if (response.ok) {
				const data = await response.json();
				// 转换数据格式以匹配 MemberData 接口
				const transformedUsers: AdminUser[] = data.users.map(
					(user: any) => ({
						id: user.id,
						name: user.name,
						email: user.email,
						username: user.username,
						image: user.image,
						cpValue: user.cpValue,
						role: user.role,
						isBanned: user.isBanned,
						bannedUntil: user.bannedUntil,
						createdAt: user.createdAt,
						totalContributions: user.totalContributions,
						approvedContributions: user.approvedContributions,
						badgeCount: user.badgeCount,
						phoneNumber: user.phoneNumber, // 添加手机号字段
						bio: user.bio,
						userRoleString: user.userRoleString,
						membershipLevel: user.membershipLevel,
						creatorLevel: user.creatorLevel,
						mentorLevel: user.mentorLevel,
						contributorLevel: user.contributorLevel,
					}),
				);
				setUsers(transformedUsers);
				setTotalUserCount(data.totalCount);
				// 计算总页数
				const calculatedTotalPages = Math.ceil(
					data.totalCount / itemsPerPage,
				);
				setTotalPages(calculatedTotalPages);
			}
		} catch (error) {
			console.error("Failed to fetch users:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = useCallback(async (searchTerm: string) => {
		// 搜索时重置到第一页
		setSearchTerm(searchTerm);
		setCurrentPage(1);
		await fetchUsers(1, searchTerm);
	}, []);

	// 防抖处理搜索
	const debouncedSearch = useCallback(
		((fn, delay) => {
			let timeoutId: NodeJS.Timeout;
			return (searchTerm: string) => {
				clearTimeout(timeoutId);
				timeoutId = setTimeout(() => fn(searchTerm), delay);
			};
		})(handleSearch, 500),
		[handleSearch],
	);

	// 分页处理函数
	const handlePageChange = async (page: number) => {
		setCurrentPage(page);
		await fetchUsers(page, searchTerm); // 保持当前搜索词
	};

	const handleUnbanUser = async (userId: string) => {
		setActionLoading(userId);
		try {
			const response = await fetch(
				`/api/super-admin/users/${userId}/unban`,
				{
					method: "POST",
				},
			);

			if (response.ok) {
				fetchUsers(currentPage);
				toast({
					title: "解封成功",
					description: "用户已成功解封",
				});
			}
		} catch (error) {
			console.error("Failed to unban user:", error);
			toast({
				title: "解封失败",
				description: "操作失败，请稍后重试",
				variant: "destructive",
			});
		} finally {
			setActionLoading(null);
		}
	};

	const handleRoleAssign = async (
		userId: string,
		role: string,
		reason: string,
	) => {
		try {
			setRoleAssignLoading(true);

			const response = await fetch("/api/super-admin/users/assign-role", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId,
					role,
					reason,
				}),
			});

			const result = await response.json();

			if (response.ok && result.success) {
				toast({
					title: "角色设置成功",
					description: `用户角色已更新为 ${ADMIN_ROLE_OPTIONS.find((opt) => opt.value === role)?.label || role}`,
				});

				fetchUsers(currentPage);
			} else {
				throw new Error(result.error || "设置失败");
			}
		} catch (error) {
			console.error("设置用户角色失败:", error);

			let errorMessage = "请稍后重试";

			if (error instanceof Error) {
				errorMessage = error.message;
			}

			if (errorMessage.includes("Access denied")) {
				errorMessage =
					"权限不足，只有超级管理员可以设置其他用户为超级管理员";
			} else if (errorMessage.includes("User not found")) {
				errorMessage = "用户不存在";
			}

			toast({
				title: "角色设置失败",
				description: errorMessage,
				variant: "destructive",
			});
		} finally {
			setRoleAssignLoading(false);
		}
	};

	const handleLevelAdjust = async (
		userId: string,
		levelType: string,
		level: string | null,
		reason: string,
	) => {
		try {
			setLevelAdjustLoading(true);

			const response = await fetch("/api/level/admin/adjust", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId,
					levelType,
					level,
					reason,
				}),
			});

			const result = await response.json();

			if (result.success) {
				toast({
					title: "等级调整成功",
					description: "用户等级已更新",
				});

				fetchUsers(currentPage);
			} else {
				throw new Error(result.error || "调整失败");
			}
		} catch (error) {
			console.error("调整用户等级失败:", error);

			let errorMessage = "请稍后重试";

			if (error instanceof Error) {
				errorMessage = error.message;
			}

			if (
				error instanceof Error &&
				error.message.includes("请求数据格式错误")
			) {
				errorMessage =
					"数据格式错误，请检查用户ID格式和调整理由长度（至少5个字符）";
			}

			toast({
				title: "调整失败",
				description: errorMessage,
				variant: "destructive",
			});
		} finally {
			setLevelAdjustLoading(false);
		}
	};

	// 角色筛选选项
	const roleFilterOptions: FilterOption[] = [
		{ value: "user", label: "普通用户" },
		{ value: "operation_admin", label: "运营管理员" },
		{ value: "super_admin", label: "超级管理员" },
	];

	// 状态筛选选项
	const statusFilterOptions: FilterOption[] = [
		{ value: "active", label: "正常" },
		{ value: "banned", label: "已封禁" },
	];

	// 自定义操作列渲染函数 - 将所有操作合并到三个点菜单中
	const renderCustomActions = (member: MemberData) => {
		// 转换为 AdminUser 类型（添加缺失的 badgeCount 字段）
		const adminUser: AdminUser = {
			...member,
			badgeCount: (member as any).badgeCount || 0,
		};

		return (
			<div className="flex items-center gap-2">
				{/* 解封按钮 - 单独显示 */}
				{member.isBanned && (
					<Button
						size="sm"
						variant="outline"
						onClick={() => handleUnbanUser(member.id)}
						disabled={actionLoading === member.id}
						className="text-xs"
					>
						<UnlockKeyhole className="w-3 h-3 mr-1" />
						{actionLoading === member.id ? "处理中..." : "解封"}
					</Button>
				)}
				{/* 操作下拉菜单 */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							size="sm"
							variant="outline"
							className="text-xs px-2"
						>
							操作
							<MoreVerticalIcon className="w-3 h-3 ml-1" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-52">
						<div className="p-1">
							<UserDetailsDialog
								user={adminUser}
								trigger={
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-start px-2 py-1.5 h-auto font-normal"
									>
										<IdCard className="mr-2 w-4 h-4" />
										查看用户资料
									</Button>
								}
							/>
						</div>
						<div className="p-1">
							<UserFunctionalRoleDialog
								user={{
									id: adminUser.id,
									name: adminUser.name,
									email: adminUser.email,
									username: adminUser.username,
								}}
								trigger={
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-start px-2 py-1.5 h-auto font-normal"
									>
										<Briefcase className="mr-2 w-4 h-4" />
										调整职能角色
									</Button>
								}
							/>
						</div>
						{/* 等级调整对话框 */}
						<div className="p-1">
							<LevelAdjustDialog
								user={adminUser}
								onAdjust={handleLevelAdjust}
								isLoading={levelAdjustLoading}
								trigger={
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-start px-2 py-1.5 h-auto font-normal"
									>
										<Settings className="mr-2 w-4 h-4" />
										调整等级
									</Button>
								}
							/>
						</div>
						{/* 角色设置对话框 */}
						<div className="p-1">
							<RoleAssignDialog
								user={adminUser}
								onAssign={handleRoleAssign}
								isLoading={roleAssignLoading}
								trigger={
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-start px-2 py-1.5 h-auto font-normal"
									>
										<ShieldCheck className="mr-2 w-4 h-4" />
										设置角色
									</Button>
								}
							/>
						</div>
						{/* 封禁用户 */}
						{!member.isBanned && (
							<div className="p-1">
								<UserBanDialog
									userId={member.id}
									userName={member.name || member.email}
									onSuccess={() => {
										fetchUsers(currentPage);
									}}
									trigger={
										<Button
											variant="ghost"
											size="sm"
											className="w-full justify-start px-2 py-1.5 h-auto font-normal text-destructive hover:text-destructive"
										>
											<Ban className="mr-2 w-4 h-4" />
											封禁用户
										</Button>
									}
								/>
							</div>
						)}
						{/* 授予勋章 */}
						<div className="p-1">
							<UserBadgeAward
								userId={member.id}
								userName={member.name || member.email}
								trigger={
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-start px-2 py-1.5 h-auto font-normal"
									>
										<Award className="mr-2 w-4 h-4" />
										授予勋章
									</Button>
								}
							/>
						</div>
						{/* 调整CP */}
						<div className="p-1">
							<UserCpAdjust
								userId={member.id}
								userName={member.name || member.email}
								currentCp={member.cpValue || 0}
								onSuccess={() => {
									// 刷新用户列表
									fetchUsers(currentPage);
								}}
								trigger={
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-start px-2 py-1.5 h-auto font-normal"
									>
										<TrendingUp className="mr-2 w-4 h-4" />
										调整CP
									</Button>
								}
							/>
						</div>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		);
	};

	return (
		<div className="p-4 sm:p-6 space-y-6">
			{/* 页面标题 */}
			<div>
				<h1 className="text-2xl sm:text-3xl font-bold">用户管理</h1>
				<p className="text-gray-600 mt-2">管理社区用户和权限</p>
			</div>

			{/* 统计卡片 */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<User className="h-4 w-4 text-blue-600 flex-shrink-0" />
							<div className="min-w-0">
								<div className="text-xl lg:text-2xl font-bold">
									{totalUserCount}
								</div>
								<div className="text-xs lg:text-sm text-gray-600 truncate">
									总用户数
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
							<div className="min-w-0">
								<div className="text-xl lg:text-2xl font-bold">
									{
										users.filter((u) =>
											[
												"admin",
												"super_admin",
												"operation_admin",
												"reviewer",
											].includes(u.role || ""),
										).length
									}
								</div>
								<div className="text-xs lg:text-sm text-gray-600 truncate">
									管理员
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<Ban className="h-4 w-4 text-red-600 flex-shrink-0" />
							<div className="min-w-0">
								<div className="text-xl lg:text-2xl font-bold">
									{users.filter((u) => u.isBanned).length}
								</div>
								<div className="text-xs lg:text-sm text-gray-600 truncate">
									被封禁
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<TrendingUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
							<div className="min-w-0">
								<div className="text-xl lg:text-2xl font-bold">
									{
										users.filter(
											(u) => (u.cpValue || 0) >= 100,
										).length
									}
								</div>
								<div className="text-xs lg:text-sm text-gray-600 truncate">
									活跃用户
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 用户列表 */}
			<Card>
				<CardHeader>
					<CardTitle>用户列表</CardTitle>
				</CardHeader>
				<CardContent>
					<MemberList
						members={users}
						loading={loading}
						pagination={{
							currentPage,
							totalPages,
							totalItems: totalUserCount,
							itemsPerPage,
							onPageChange: handlePageChange,
						}}
						showAvatar={true}
						showEmailWithTruncation={false}
						showLevel={true}
						showRole={true}
						showSkills={false}
						showContributions={false}
						showCP={true}
						showBanStatus={true}
						showJoinDate={true}
						enableSearch={true}
						enableBatchSelect={false}
						enableFilters={true}
						searchPlaceholder="搜索姓名、用户名、邮箱、简介或个人角色..."
						roleFilterOptions={roleFilterOptions}
						statusFilterOptions={statusFilterOptions}
						primaryActions={[]}
						dropdownActions={[]}
						customActionsRenderer={renderCustomActions}
						onSearch={debouncedSearch}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
