"use client";

import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import { Checkbox } from "@community/ui/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@community/ui/ui/dropdown-menu";
import { Input } from "@community/ui/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@community/ui/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@community/ui/ui/table";
import { UserLevelBadges } from "@dashboard/level/components/LevelBadge";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import {
	Ban,
	Calendar,
	Crown,
	Mail,
	MoreVerticalIcon,
	Search,
	ShieldCheck,
	TrendingUp,
	User,
	LayoutGrid,
	LayoutList,
	List,
	GithubIcon,
	TwitterIcon,
	Globe,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// 通用用户/成员接口
export interface MemberData {
	id: string;
	name: string | null;
	email: string;
	username: string | null;
	image?: string | null;
	bio?: string | null;
	region?: string | null;
	role?: string;
	cpValue?: number;
	isBanned?: boolean;
	bannedUntil?: string;
	createdAt: string;
	totalContributions?: number;
	approvedContributions?: number;
	badgeCount?: number;
	skills?: string[];
	userRoleString?: string | null;
	// 联系方式
	phoneNumber?: string;
	showEmail?: boolean;
	showWechat?: boolean;
	githubUrl?: string | null;
	twitterUrl?: string | null;
	websiteUrl?: string | null;
	wechatId?: string | null;
	// 身份字段
	membershipLevel?: string | null;
	// 组织相关字段
	lastActiveAt?: string;
	joinedAt?: string;
	contributionValue?: number;
	status?: "active" | "inactive";
	inviter?: {
		id: string;
		name: string | null;
		username: string | null;
	} | null;
}

// 操作按钮配置
export interface MemberAction {
	label: string | ((member: MemberData) => string);
	icon?:
		| React.FC<{ className?: string }>
		| ((member: MemberData) => React.FC<{ className?: string }>);
	variant?: "default" | "outline" | "destructive" | "secondary" | "ghost";
	onClick: (member: MemberData) => void;
	disabled?: (member: MemberData) => boolean;
	hidden?: (member: MemberData) => boolean;
}

// 批量操作配置
export interface BatchAction {
	label: string;
	icon?: React.FC<{ className?: string }>;
	variant?: "default" | "outline" | "destructive" | "secondary" | "ghost";
	onClick: (selectedIds: string[]) => void;
}

// 筛选选项
export interface FilterOption {
	value: string;
	label: string;
}

// 排序选项
export interface SortOption {
	value: string;
	label: string;
}

export interface MemberListProps {
	// 数据
	members: MemberData[];
	loading?: boolean;
	// 分页
	pagination?: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		itemsPerPage: number;
		onPageChange: (page: number) => void;
	};
	// 视图模式
	viewMode?: "table" | "grid" | "compact";
	showViewModeToggle?: boolean;
	defaultViewMode?: "table" | "grid" | "compact";
	// 显示配置
	showEmailWithTruncation?: boolean;
	showAvatar?: boolean;
	showLevel?: boolean;
	showSkills?: boolean;
	showContributions?: boolean;
	showCP?: boolean;
	showRole?: boolean;
	showInviter?: boolean;
	showBanStatus?: boolean;
	showJoinDate?: boolean;
	showLastActive?: boolean;
	showBio?: boolean;
	showRegion?: boolean;
	showContactLinks?: boolean;
	// 功能配置
	enableSearch?: boolean;
	enableBatchSelect?: boolean;
	enableFilters?: boolean;
	enableSort?: boolean;
	searchPlaceholder?: string;
	// 过滤和角色选项
	roleFilterOptions?: FilterOption[];
	statusFilterOptions?: FilterOption[];
	sortOptions?: SortOption[];
	// 操作配置
	primaryActions?: MemberAction[];
	dropdownActions?: MemberAction[];
	batchActions?: BatchAction[];
	// 自定义操作列渲染
	customActionsRenderer?: (member: MemberData) => React.ReactNode;
	// 回调
	onSearch?: (term: string) => void;
	onFilter?: (filters: Record<string, string>) => void;
	onSort?: (sortBy: string) => void;
	onSelectionChange?: (selectedIds: string[]) => void;
	onViewModeChange?: (mode: "table" | "grid" | "compact") => void;
}

export function MemberList({
	members,
	loading = false,
	pagination,
	viewMode: controlledViewMode,
	showViewModeToggle = false,
	defaultViewMode = "table",
	showEmailWithTruncation = false,
	showAvatar = true,
	showLevel = true,
	showSkills = true,
	showContributions = false,
	showCP = false,
	showRole = true,
	showInviter = false,
	showBanStatus = false,
	showJoinDate = true,
	showLastActive = false,
	showBio = false,
	showRegion = false,
	showContactLinks = false,
	enableSearch = true,
	enableBatchSelect = false,
	enableFilters = true,
	enableSort = false,
	searchPlaceholder = "搜索成员姓名或邮箱...",
	roleFilterOptions = [],
	statusFilterOptions = [],
	sortOptions = [],
	primaryActions = [],
	dropdownActions = [],
	batchActions = [],
	customActionsRenderer,
	onSearch,
	onFilter,
	onSort,
	onSelectionChange,
	onViewModeChange,
}: MemberListProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortBy, setSortBy] = useState("joinDate");
	const [internalViewMode, setInternalViewMode] = useState(defaultViewMode);
	const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
		new Set(),
	);

	const renderInviter = (member: MemberData) => {
		const inviter = member.inviter;
		if (!inviter) {
			return <span className="text-muted-foreground">—</span>;
		}

		const label = inviter.name || inviter.username || "未知";
		if (inviter.username) {
			return (
				<Link
					href={`/u/${inviter.username}`}
					target="_blank"
					className="hover:text-primary transition-colors hover:underline"
				>
					{label}
				</Link>
			);
		}

		return <span>{label}</span>;
	};

	// 使用受控或非受控的视图模式
	const viewMode = controlledViewMode || internalViewMode;

	// 处理搜索
	const handleSearch = (value: string) => {
		setSearchTerm(value);
		onSearch?.(value);
	};

	// 处理筛选
	const handleFilter = (type: string, value: string) => {
		const filters: Record<string, string> = {};
		if (type === "role") {
			setRoleFilter(value);
			filters.role = value;
		}
		if (type === "status") {
			setStatusFilter(value);
			filters.status = value;
		}
		onFilter?.(filters);
	};

	// 处理排序
	const handleSort = (value: string) => {
		setSortBy(value);
		onSort?.(value);
	};

	// 处理视图模式切换
	const handleViewModeChange = (mode: "table" | "grid" | "compact") => {
		setInternalViewMode(mode);
		onViewModeChange?.(mode);
	};

	// 处理选择
	const handleSelectMember = (memberId: string) => {
		const newSelected = new Set(selectedMembers);
		if (newSelected.has(memberId)) {
			newSelected.delete(memberId);
		} else {
			newSelected.add(memberId);
		}
		setSelectedMembers(newSelected);
		onSelectionChange?.(Array.from(newSelected));
	};

	const handleSelectAll = () => {
		if (selectedMembers.size === members.length) {
			setSelectedMembers(new Set());
			onSelectionChange?.([]);
		} else {
			const allIds = new Set(members.map((m) => m.id));
			setSelectedMembers(allIds);
			onSelectionChange?.(Array.from(allIds));
		}
	};

	// 获取角色徽章
	const getRoleBadge = (role?: string) => {
		if (!role) return null;

		const roleMap: Record<
			string,
			{
				label: string;
				variant: any;
				icon?: React.ComponentType<{ className?: string }>;
			}
		> = {
			owner: { label: "负责人", variant: "default", icon: Crown },
			admin: { label: "管理员", variant: "destructive", icon: Crown },
			core: { label: "核心成员", variant: "secondary" },
			member: { label: "成员", variant: "outline" },
			viewer: { label: "观众", variant: "outline" },
			super_admin: {
				label: "超级管理员",
				variant: "destructive",
				icon: ShieldCheck,
			},
			operation_admin: { label: "运营管理员", variant: "default" },
			user: { label: "普通用户", variant: "outline" },
		};

		const roleInfo = roleMap[role] || { label: role, variant: "outline" };
		const IconComponent = roleInfo.icon;

		return (
			<Badge variant={roleInfo.variant}>
				{IconComponent && <IconComponent className="w-3 h-3 mr-1" />}
				{roleInfo.label}
			</Badge>
		);
	};

	// 获取状态徽章
	const getStatusBadge = (member: MemberData) => {
		if (member.isBanned) {
			return (
				<Badge variant="destructive" className="text-xs">
					<Ban className="w-3 h-3 mr-1" />
					已封禁
				</Badge>
			);
		}
		return null;
	};

	if (loading) {
		return (
			<div className="space-y-4">
				<div className="animate-pulse space-y-4">
					<div className="h-10 bg-gray-200 rounded" />
					<div className="h-64 bg-gray-200 rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* 搜索和筛选 */}
			{(enableSearch ||
				enableFilters ||
				enableSort ||
				showViewModeToggle) && (
				<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
					<div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
						{enableSearch && (
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder={searchPlaceholder}
									value={searchTerm}
									onChange={(e) =>
										handleSearch(e.target.value)
									}
									className="pl-10"
								/>
							</div>
						)}

						{enableFilters && roleFilterOptions.length > 0 && (
							<Select
								value={roleFilter}
								onValueChange={(value) =>
									handleFilter("role", value)
								}
							>
								<SelectTrigger className="w-32">
									<SelectValue placeholder="角色筛选" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										全部角色
									</SelectItem>
									{roleFilterOptions.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}

						{enableFilters && statusFilterOptions.length > 0 && (
							<Select
								value={statusFilter}
								onValueChange={(value) =>
									handleFilter("status", value)
								}
							>
								<SelectTrigger className="w-32">
									<SelectValue placeholder="状态筛选" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										全部状态
									</SelectItem>
									{statusFilterOptions.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}

						{enableSort && sortOptions.length > 0 && (
							<Select value={sortBy} onValueChange={handleSort}>
								<SelectTrigger className="w-32">
									<SelectValue placeholder="排序" />
								</SelectTrigger>
								<SelectContent>
									{sortOptions.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>

					<div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
						{showViewModeToggle && (
							<div className="flex items-center bg-gray-100 dark:bg-[#1A1A1A] rounded-lg p-0.5">
								<button
									type="button"
									onClick={() =>
										handleViewModeChange("table")
									}
									className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${viewMode === "table" ? "bg-white dark:bg-[#262626] shadow-sm text-black dark:text-white" : "text-gray-500 dark:text-[#666] hover:text-gray-700 dark:hover:text-[#999]"}`}
								>
									<List className="h-3.5 w-3.5" />
								</button>
								<button
									type="button"
									onClick={() => handleViewModeChange("grid")}
									className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-[#262626] shadow-sm text-black dark:text-white" : "text-gray-500 dark:text-[#666] hover:text-gray-700 dark:hover:text-[#999]"}`}
								>
									<LayoutGrid className="h-3.5 w-3.5" />
								</button>
								<button
									type="button"
									onClick={() =>
										handleViewModeChange("compact")
									}
									className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${viewMode === "compact" ? "bg-white dark:bg-[#262626] shadow-sm text-black dark:text-white" : "text-gray-500 dark:text-[#666] hover:text-gray-700 dark:hover:text-[#999]"}`}
								>
									<LayoutList className="h-3.5 w-3.5" />
								</button>
							</div>
						)}

						<div className="text-sm text-muted-foreground whitespace-nowrap">
							{pagination
								? `共 ${pagination.totalItems} 位成员 (第 ${pagination.currentPage} / ${pagination.totalPages} 页)`
								: `共 ${members.length} 位成员`}
						</div>
					</div>
				</div>
			)}

			{/* 批量操作栏 */}
			{enableBatchSelect &&
				selectedMembers.size > 0 &&
				batchActions.length > 0 && (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div className="flex items-center justify-between">
							<div className="text-sm text-blue-800">
								已选择 {selectedMembers.size} 个成员
							</div>
							<div className="flex items-center gap-2">
								{batchActions.map((action, index) => {
									const IconComponent = action.icon;
									return (
										<Button
											key={index}
											size="sm"
											variant={
												action.variant || "outline"
											}
											onClick={() =>
												action.onClick(
													Array.from(selectedMembers),
												)
											}
										>
											{IconComponent && (
												<IconComponent className="w-4 h-4 mr-1" />
											)}
											{action.label}
										</Button>
									);
								})}
								<Button
									size="sm"
									variant="ghost"
									onClick={() => {
										setSelectedMembers(new Set());
										onSelectionChange?.([]);
									}}
								>
									取消选择
								</Button>
							</div>
						</div>
					</div>
				)}

			{/* 成员显示区域 - 根据视图模式渲染 */}
			{viewMode === "table" ? (
				// 表格视图
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								{enableBatchSelect && (
									<TableHead className="w-12">
										<Checkbox
											checked={
												selectedMembers.size ===
													members.length &&
												members.length > 0
											}
											onCheckedChange={handleSelectAll}
										/>
									</TableHead>
								)}
								<TableHead>成员</TableHead>
								{showEmailWithTruncation && (
									<TableHead>邮箱</TableHead>
								)}
								{showLevel && <TableHead>身份</TableHead>}
								{showRole && <TableHead>角色</TableHead>}
								{showInviter && <TableHead>邀请人</TableHead>}
								{showSkills && <TableHead>技能标签</TableHead>}
								{showCP && <TableHead>积分</TableHead>}
								{showContributions && (
									<TableHead>贡献</TableHead>
								)}
								{showJoinDate && (
									<TableHead>加入时间</TableHead>
								)}
								{showLastActive && (
									<TableHead>最后活跃</TableHead>
								)}
								<TableHead>操作</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{members.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={10}
										className="h-24 text-center"
									>
										<div className="flex flex-col items-center gap-2">
											<User className="h-8 w-8 text-muted-foreground/50" />
											<span className="text-muted-foreground">
												暂无成员数据
											</span>
										</div>
									</TableCell>
								</TableRow>
							) : (
								members.map((member) => (
									<TableRow key={member.id}>
										{enableBatchSelect && (
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
										)}

										{/* 成员信息 */}
										<TableCell>
											<div className="flex items-center gap-3">
												{showAvatar && (
													<UserAvatar
														name={
															member.name ||
															member.email
														}
														avatarUrl={member.image}
														className="h-8 w-8"
													/>
												)}
												<div className="min-w-0">
													<div className="font-medium">
														{member.username ? (
															<Link
																href={`/u/${member.username}`}
																target="_blank"
																className="hover:text-primary transition-colors hover:underline"
															>
																{member.name ||
																	"Unknown"}
															</Link>
														) : (
															<span>
																{member.name ||
																	"Unknown"}
															</span>
														)}
													</div>
													{/* 显示手机号和邮箱 */}
													<div className="text-sm text-muted-foreground truncate flex items-center gap-1">
														{member.phoneNumber ? (
															<span>
																{" "}
																{
																	member.phoneNumber
																}
															</span>
														) : (
															<span
																title={
																	member.email
																}
															>
																{" "}
																{member.email
																	.length > 25
																	? `${member.email.substring(
																			0,
																			25,
																		)}...`
																	: member.email}
															</span>
														)}
													</div>
													{showBanStatus &&
														getStatusBadge(member)}
												</div>
											</div>
										</TableCell>

										{/* 邮箱 */}
										{showEmailWithTruncation && (
											<TableCell>
												<div className="flex items-center gap-1 text-sm">
													<Mail className="h-4 w-4 text-muted-foreground" />
													<span
														className="truncate max-w-32"
														title={member.email}
													>
														{member.email}
													</span>
												</div>
											</TableCell>
										)}

										{/* 身份 */}
										{showLevel && (
											<TableCell>
												<div className="flex items-center gap-2">
													<UserLevelBadges
														user={member}
														size="sm"
														showTooltip={false}
													/>
													{showCP && (
														<span className="text-xs text-muted-foreground">
															积分:{" "}
															{member.cpValue ||
																0}
														</span>
													)}
												</div>
											</TableCell>
										)}

										{/* 角色 */}
										{showRole && (
											<TableCell>
												{getRoleBadge(member.role)}
											</TableCell>
										)}
										{showInviter && (
											<TableCell>
												<div className="text-sm">
													{renderInviter(member)}
												</div>
											</TableCell>
										)}

										{/* 技能标签 */}
										{showSkills && (
											<TableCell>
												<div className="flex flex-wrap gap-1 max-w-xs">
													{member.skills &&
													member.skills.length > 0 ? (
														member.skills
															.slice(0, 2)
															.map(
																(
																	skill,
																	index,
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
													) : member.userRoleString ? (
														<Badge
															variant="outline"
															className="text-xs"
														>
															{
																member.userRoleString
															}
														</Badge>
													) : (
														<span className="text-xs text-muted-foreground">
															暂无技能
														</span>
													)}
													{member.skills &&
														member.skills.length >
															2 && (
															<Badge
																variant="secondary"
																className="text-xs"
															>
																+
																{member.skills
																	.length - 2}
															</Badge>
														)}
												</div>
											</TableCell>
										)}

										{/* 积分 */}
										{showCP && !showLevel && (
											<TableCell>
												<div className="flex items-center gap-1">
													<TrendingUp className="h-4 w-4 text-primary/60" />
													<span className="font-medium text-blue-600">
														{member.cpValue || 0}
													</span>
												</div>
											</TableCell>
										)}

										{/* 贡献 */}
										{showContributions && (
											<TableCell>
												<div className="text-sm">
													<div className="flex items-center gap-1">
														<span className="text-muted-foreground">
															总计:
														</span>
														<span className="font-medium">
															{member.totalContributions ||
																0}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<span className="text-muted-foreground">
															通过:
														</span>
														<span className="font-medium text-green-600">
															{member.approvedContributions ||
																0}
														</span>
													</div>
												</div>
											</TableCell>
										)}

										{/* 加入时间 */}
										{showJoinDate && (
											<TableCell>
												<div className="flex items-center gap-1 text-sm text-muted-foreground">
													<Calendar className="h-4 w-4" />
													<span>
														{new Date(
															member.joinedAt ||
																member.createdAt,
														).toLocaleDateString(
															"zh-CN",
														)}
													</span>
												</div>
											</TableCell>
										)}

										{/* 最后活跃 */}
										{showLastActive && (
											<TableCell>
												<span className="text-sm text-muted-foreground">
													{member.lastActiveAt
														? new Date(
																member.lastActiveAt,
															).toLocaleDateString(
																"zh-CN",
															)
														: "未知"}
												</span>
											</TableCell>
										)}

										{/* 操作 */}
										<TableCell>
											<div className="flex items-center gap-2">
												{/* 如果有自定义渲染函数，使用它 */}
												{customActionsRenderer ? (
													customActionsRenderer(
														member,
													)
												) : (
													<>
														{/* 主要操作按钮 */}
														{primaryActions.map(
															(action, index) => {
																if (
																	action.hidden?.(
																		member,
																	)
																)
																	return null;

																let IconComponent:
																	| React.FC<{
																			className?: string;
																	  }>
																	| undefined;
																if (
																	action.icon
																) {
																	IconComponent =
																		typeof action.icon ===
																		"function"
																			? (
																					action.icon as (
																						member: MemberData,
																					) => React.FC<{
																						className?: string;
																					}>
																				)(
																					member,
																				)
																			: (action.icon as React.FC<{
																					className?: string;
																				}>);
																}

																const label =
																	typeof action.label ===
																	"function"
																		? action.label(
																				member,
																			)
																		: action.label;

																return (
																	<Button
																		key={
																			index
																		}
																		size="sm"
																		variant={
																			action.variant ||
																			"outline"
																		}
																		onClick={() =>
																			action.onClick(
																				member,
																			)
																		}
																		disabled={action.disabled?.(
																			member,
																		)}
																		className="text-xs"
																	>
																		{IconComponent && (
																			<IconComponent className="w-3 h-3 mr-1" />
																		)}
																		{label}
																	</Button>
																);
															},
														)}

														{/* 下拉菜单操作 */}
														{dropdownActions.length >
															0 && (
															<DropdownMenu>
																<DropdownMenuTrigger
																	asChild
																>
																	<Button
																		size="sm"
																		variant="ghost"
																	>
																		<MoreVerticalIcon className="w-4 h-4" />
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent>
																	{dropdownActions.map(
																		(
																			action,
																			index,
																		) => {
																			if (
																				action.hidden?.(
																					member,
																				)
																			)
																				return null;

																			let IconComponent:
																				| React.FC<{
																						className?: string;
																				  }>
																				| undefined;
																			if (
																				action.icon
																			) {
																				IconComponent =
																					typeof action.icon ===
																					"function"
																						? (
																								action.icon as (
																									member: MemberData,
																								) => React.FC<{
																									className?: string;
																								}>
																							)(
																								member,
																							)
																						: (action.icon as React.FC<{
																								className?: string;
																							}>);
																			}

																			const label =
																				typeof action.label ===
																				"function"
																					? action.label(
																							member,
																						)
																					: action.label;

																			return (
																				<DropdownMenuItem
																					key={
																						index
																					}
																					onClick={() =>
																						action.onClick(
																							member,
																						)
																					}
																					disabled={action.disabled?.(
																						member,
																					)}
																					className={
																						action.variant ===
																						"destructive"
																							? "text-destructive"
																							: ""
																					}
																				>
																					{IconComponent && (
																						<IconComponent className="mr-2 w-4 h-4" />
																					)}
																					{
																						label
																					}
																				</DropdownMenuItem>
																			);
																		},
																	)}
																</DropdownMenuContent>
															</DropdownMenu>
														)}
													</>
												)}
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			) : viewMode === "grid" ? (
				// 网格卡片视图
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{members.length === 0 ? (
						<div className="col-span-full flex flex-col items-center gap-2 py-12">
							<User className="h-8 w-8 text-muted-foreground/50" />
							<span className="text-muted-foreground">
								暂无成员数据
							</span>
						</div>
					) : (
						members.map((member) => (
							<div
								key={member.id}
								className="bg-white dark:bg-[#141414] rounded-lg border border-gray-200 dark:border-[#262626] p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
							>
								<div className="flex items-center gap-3">
									{showAvatar && (
										<UserAvatar
											name={member.name || member.email}
											avatarUrl={member.image}
											className="h-12 w-12"
										/>
									)}
									<div className="flex-1 min-w-0">
										<div className="font-brand text-sm font-bold truncate">
											{member.username ? (
												<Link
													href={`/u/${member.username}`}
													target="_blank"
													className="text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
												>
													{member.name}
												</Link>
											) : (
												<span className="text-black dark:text-white">
													{member.name}
												</span>
											)}
										</div>
										<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
											{showRole &&
												getRoleBadge(member.role)}
											{member.userRoleString && (
												<Badge
													variant="outline"
													className="text-[10px] px-1.5 py-0"
												>
													{member.userRoleString}
												</Badge>
											)}
										</div>
									</div>
								</div>

								<div className="mt-2.5 space-y-2">
									{showInviter && (
										<p className="text-[11px] text-gray-500 dark:text-[#A3A3A3]">
											邀请人: {renderInviter(member)}
										</p>
									)}
									{showBio && member.bio && (
										<p className="text-[11px] text-gray-500 dark:text-[#A3A3A3] line-clamp-2">
											{member.bio}
										</p>
									)}

									{showRegion && member.region && (
										<p className="text-[11px] text-gray-500 dark:text-[#A3A3A3]">
											📍 {member.region}
										</p>
									)}

									{showLevel && (
										<div className="flex items-center gap-2">
											<UserLevelBadges
												user={member}
												size="sm"
												showTooltip={false}
											/>
										</div>
									)}

									{showSkills &&
										member.skills &&
										member.skills.length > 0 && (
											<div className="flex flex-wrap gap-1">
												{member.skills
													.slice(0, 3)
													.map((skill, index) => (
														<span
															key={index}
															className="px-1.5 py-0.5 bg-gray-50 dark:bg-[#1A1A1A] text-[9px] font-medium rounded border border-gray-100 dark:border-[#262626] text-gray-600 dark:text-[#A3A3A3]"
														>
															{skill}
														</span>
													))}
												{member.skills.length > 3 && (
													<span className="px-1.5 py-0.5 bg-gray-50 dark:bg-[#1A1A1A] text-[9px] font-medium rounded border border-gray-100 dark:border-[#262626] text-gray-600 dark:text-[#A3A3A3]">
														+
														{member.skills.length -
															3}
													</span>
												)}
											</div>
										)}

									{showContactLinks && (
										<div className="flex flex-wrap items-center gap-2">
											{member.showEmail &&
												member.email && (
													<a
														href={`mailto:${member.email}`}
														className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
													>
														<Mail className="h-3.5 w-3.5" />
													</a>
												)}
											{member.githubUrl && (
												<a
													href={member.githubUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
												>
													<GithubIcon className="h-3.5 w-3.5" />
												</a>
											)}
											{member.twitterUrl && (
												<a
													href={member.twitterUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
												>
													<TwitterIcon className="h-3.5 w-3.5" />
												</a>
											)}
											{member.websiteUrl && (
												<a
													href={member.websiteUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
												>
													<Globe className="h-3.5 w-3.5" />
												</a>
											)}
										</div>
									)}

									{customActionsRenderer && (
										<div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-[#262626]">
											{customActionsRenderer(member)}
										</div>
									)}
								</div>
							</div>
						))
					)}
				</div>
			) : (
				// 紧凑列表视图
				<div className="space-y-3">
					{members.length === 0 ? (
						<div className="flex flex-col items-center gap-2 py-12">
							<User className="h-8 w-8 text-muted-foreground/50" />
							<span className="text-muted-foreground">
								暂无成员数据
							</span>
						</div>
					) : (
						members.map((member) => (
							<div
								key={member.id}
								className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
							>
								{showAvatar && (
									<UserAvatar
										name={member.name || member.email}
										avatarUrl={member.image}
										className="h-10 w-10 flex-shrink-0"
									/>
								)}
								<div className="flex-1 min-w-0 space-y-1.5">
									<div className="flex items-center flex-wrap gap-1.5">
										<div className="font-semibold text-sm">
											{member.username ? (
												<Link
													href={`/u/${member.username}`}
													target="_blank"
													className="hover:underline text-primary"
												>
													{member.name}
												</Link>
											) : (
												member.name
											)}
										</div>
										{showRole && getRoleBadge(member.role)}
										{member.userRoleString && (
											<Badge
												variant="outline"
												className="text-xs h-5"
											>
												{member.userRoleString}
											</Badge>
										)}
									</div>

									{showBio && member.bio && (
										<p className="text-xs text-muted-foreground line-clamp-2">
											{member.bio}
										</p>
									)}

									<div className="flex items-center gap-2.5 text-xs text-muted-foreground">
										{showRegion && member.region && (
											<span className="flex items-center gap-0.5">
												📍 {member.region}
											</span>
										)}
										{showSkills &&
											member.skills &&
											member.skills.length > 0 && (
												<span className="flex items-center gap-0.5">
													🔧 {member.skills[0]}
												</span>
											)}
										{showContactLinks &&
											member.showEmail &&
											member.email && (
												<a
													href={`mailto:${member.email}`}
													className="flex items-center gap-0.5 hover:text-primary transition-colors"
												>
													<Mail className="h-3 w-3" />
												</a>
											)}
										{showContactLinks &&
											member.githubUrl && (
												<a
													href={member.githubUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-0.5 hover:text-primary transition-colors"
												>
													<GithubIcon className="h-3 w-3" />
												</a>
											)}
									</div>
									{showInviter && (
										<div className="text-xs text-muted-foreground">
											邀请人: {renderInviter(member)}
										</div>
									)}
								</div>
								{customActionsRenderer && (
									<div className="flex items-center gap-2">
										{customActionsRenderer(member)}
									</div>
								)}
							</div>
						))
					)}
				</div>
			)}

			{/* 分页 */}
			{pagination && pagination.totalPages > 1 && (
				<div className="flex items-center justify-center pt-4">
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									href="#"
									onClick={(e) => {
										e.preventDefault();
										if (pagination.currentPage > 1) {
											pagination.onPageChange(
												pagination.currentPage - 1,
											);
										}
									}}
									className={
										pagination.currentPage === 1
											? "pointer-events-none opacity-50"
											: ""
									}
								/>
							</PaginationItem>
							{Array.from(
								{ length: Math.min(5, pagination.totalPages) },
								(_, i) => {
									const page =
										i +
										Math.max(
											1,
											Math.min(
												pagination.currentPage - 2,
												pagination.totalPages - 4,
											),
										);
									if (page > pagination.totalPages)
										return null;
									return (
										<PaginationItem key={page}>
											<PaginationLink
												href="#"
												onClick={(e) => {
													e.preventDefault();
													pagination.onPageChange(
														page,
													);
												}}
												isActive={
													page ===
													pagination.currentPage
												}
											>
												{page}
											</PaginationLink>
										</PaginationItem>
									);
								},
							)}
							<PaginationItem>
								<PaginationNext
									href="#"
									onClick={(e) => {
										e.preventDefault();
										if (
											pagination.currentPage <
											pagination.totalPages
										) {
											pagination.onPageChange(
												pagination.currentPage + 1,
											);
										}
									}}
									className={
										pagination.currentPage ===
										pagination.totalPages
											? "pointer-events-none opacity-50"
											: ""
									}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			)}
		</div>
	);
}
