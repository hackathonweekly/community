"use client";

import { useToast } from "@/hooks/use-toast";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import { Switch } from "@community/ui/ui/switch";
import { Textarea } from "@community/ui/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import { format } from "date-fns";
import {
	CalendarIcon,
	History,
	Loader2,
	PenSquare,
	Plus,
	RefreshCcw,
	ShieldCheck,
	ToggleLeft,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { createFunctionalRoleDisplayNameResolver } from "@/features/functional-roles/display-name";

interface OrganizationMemberSummary {
	id: string;
	userId?: string;
	role: string;
	name?: string | null;
	email?: string | null;
	user?: {
		id: string;
		name?: string | null;
		email?: string | null;
		username?: string | null;
	};
}

interface FunctionalRoleItem {
	id: string;
	name: string;
	description: string;
	applicableScope: string | null;
	organizationId: string | null;
	isActive: boolean;
	createdAt?: string;
	updatedAt?: string;
}

interface RoleAssignmentItem {
	id: string;
	userId: string;
	functionalRoleId: string;
	startDate: string;
	endDate: string | null;
	isActive: boolean;
	status: "ACTIVE" | "UPCOMING" | "HISTORICAL" | "INACTIVE";
	roleType: "system" | "custom";
	functionalRole: FunctionalRoleItem;
	user: {
		id: string;
		name?: string | null;
		email?: string | null;
		username?: string | null;
	};
}

interface OrganizationFunctionalRolesPanelProps {
	organizationSlug: string;
	organizationId?: string | null;
	members: OrganizationMemberSummary[];
}

const DATE_INPUT_DEFAULT = format(new Date(), "yyyy-MM-dd");

const STATUS_LABEL: Record<RoleAssignmentItem["status"], string> = {
	ACTIVE: "在任",
	UPCOMING: "即将生效",
	HISTORICAL: "历史记录",
	INACTIVE: "已停用",
};

const ROLE_TYPE_LABEL: Record<RoleAssignmentItem["roleType"], string> = {
	system: "系统预设",
	custom: "组织自定义",
};

export function OrganizationFunctionalRolesPanel({
	organizationSlug,
	organizationId,
	members,
}: OrganizationFunctionalRolesPanelProps) {
	const { toast } = useToast();
	const systemRoleMessages = useTranslations("profile.systemRoles");
	const resolveRoleDisplayName = useMemo(
		() =>
			createFunctionalRoleDisplayNameResolver((key) =>
				systemRoleMessages(
					key as Parameters<typeof systemRoleMessages>[0],
				),
			),
		[systemRoleMessages],
	);

	const [roles, setRoles] = useState<FunctionalRoleItem[]>([]);
	const [rolesLoading, setRolesLoading] = useState(false);
	const [rolesError, setRolesError] = useState<string | null>(null);

	const [assignments, setAssignments] = useState<RoleAssignmentItem[]>([]);
	const [assignmentsLoading, setAssignmentsLoading] = useState(false);
	const [assignmentsError, setAssignmentsError] = useState<string | null>(
		null,
	);

	const [newRoleName, setNewRoleName] = useState("");
	const [newRoleDescription, setNewRoleDescription] = useState("");
	const [newRoleScope, setNewRoleScope] = useState("");
	const [createRoleLoading, setCreateRoleLoading] = useState(false);

	const [editingRole, setEditingRole] = useState<FunctionalRoleItem | null>(
		null,
	);
	const [editRoleDescription, setEditRoleDescription] = useState("");
	const [editRoleScope, setEditRoleScope] = useState("");
	const [editRoleLoading, setEditRoleLoading] = useState(false);
	const editingRoleDisplayName = useMemo(
		() => (editingRole ? resolveRoleDisplayName(editingRole) : ""),
		[editingRole, resolveRoleDisplayName],
	);

	const [selectedMemberId, setSelectedMemberId] = useState("");
	const [selectedRoleId, setSelectedRoleId] = useState("");
	const [assignmentStartDate, setAssignmentStartDate] =
		useState(DATE_INPUT_DEFAULT);
	const [assignmentEndDate, setAssignmentEndDate] = useState("");
	const [assignmentActive, setAssignmentActive] = useState(true);
	const [createAssignmentLoading, setCreateAssignmentLoading] =
		useState(false);

	const [editingAssignmentId, setEditingAssignmentId] = useState<
		string | null
	>(null);
	const [editAssignmentStart, setEditAssignmentStart] =
		useState(DATE_INPUT_DEFAULT);
	const [editAssignmentEnd, setEditAssignmentEnd] = useState("");
	const [editAssignmentActive, setEditAssignmentActive] = useState(true);
	const [updateAssignmentLoading, setUpdateAssignmentLoading] =
		useState(false);

	useEffect(() => {
		void fetchRoles();
		void fetchAssignments();
	}, [organizationSlug]);

	const activeAssignments = useMemo(
		() =>
			assignments.filter(
				(assignment) =>
					assignment.status === "ACTIVE" ||
					assignment.status === "UPCOMING",
			),
		[assignments],
	);

	const historicalAssignments = useMemo(
		() =>
			assignments.filter(
				(assignment) => assignment.status === "HISTORICAL",
			),
		[assignments],
	);

	const inactiveAssignments = useMemo(
		() =>
			assignments.filter(
				(assignment) => assignment.status === "INACTIVE",
			),
		[assignments],
	);

	async function fetchRoles() {
		try {
			setRolesLoading(true);
			setRolesError(null);
			const params = new URLSearchParams({
				roleType: "all",
				includeInactive: "true",
			});
			const response = await fetch(
				`/api/organizations/${organizationSlug}/admin/roles?${params.toString()}`,
			);

			if (!response.ok) {
				const errorData = await safeJson(response);
				throw new Error(errorData?.error || "加载职能角色失败");
			}

			const data = await response.json();
			setRoles(data.roles || []);
		} catch (error) {
			if (error instanceof Error) {
				setRolesError(error.message);
			} else {
				setRolesError("加载职能角色失败");
			}
		} finally {
			setRolesLoading(false);
		}
	}

	async function fetchAssignments() {
		try {
			setAssignmentsLoading(true);
			setAssignmentsError(null);
			const params = new URLSearchParams({
				includeInactive: "true",
				status: "all",
				limit: "100",
			});
			const response = await fetch(
				`/api/organizations/${organizationSlug}/admin/roles/assignments?${params.toString()}`,
			);

			if (!response.ok) {
				const errorData = await safeJson(response);
				throw new Error(errorData?.error || "加载职能角色任期失败");
			}

			const data = await response.json();
			setAssignments(data.assignments || []);
		} catch (error) {
			if (error instanceof Error) {
				setAssignmentsError(error.message);
			} else {
				setAssignmentsError("加载职能角色任期失败");
			}
		} finally {
			setAssignmentsLoading(false);
		}
	}

	async function handleCreateRole() {
		if (!newRoleName.trim() || !newRoleDescription.trim()) {
			toast({
				title: "请填写完整信息",
				description: "角色名称和职责描述不能为空",
				variant: "destructive",
			});
			return;
		}

		try {
			setCreateRoleLoading(true);
			const response = await fetch(
				`/api/organizations/${organizationSlug}/admin/roles`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: newRoleName.trim(),
						description: newRoleDescription.trim(),
						applicableScope: newRoleScope.trim() || undefined,
					}),
				},
			);

			if (!response.ok) {
				const errorData = await safeJson(response);
				throw new Error(errorData?.error || "创建职能角色失败");
			}

			toast({
				title: "创建成功",
				description: "自定义职能角色已创建",
			});

			setNewRoleName("");
			setNewRoleDescription("");
			setNewRoleScope("");
			void fetchRoles();
		} catch (error) {
			toast({
				title: "创建失败",
				description:
					error instanceof Error ? error.message : "创建职能角色失败",
				variant: "destructive",
			});
		} finally {
			setCreateRoleLoading(false);
		}
	}

	async function handleToggleRole(
		role: FunctionalRoleItem,
		nextActive: boolean,
	) {
		try {
			const response = await fetch(
				`/api/organizations/${organizationSlug}/admin/roles/${role.id}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ isActive: nextActive }),
				},
			);

			if (!response.ok) {
				const errorData = await safeJson(response);
				throw new Error(errorData?.error || "更新职能角色失败");
			}

			toast({
				title: nextActive ? "已启用" : "已停用",
				description: `${resolveRoleDisplayName(role)} 已${
					nextActive ? "重新启用" : "停用"
				}`,
			});

			void fetchRoles();
		} catch (error) {
			toast({
				title: "更新失败",
				description:
					error instanceof Error ? error.message : "更新职能角色失败",
				variant: "destructive",
			});
		}
	}

	function openEditRole(role: FunctionalRoleItem) {
		setEditingRole(role);
		setEditRoleDescription(role.description);
		setEditRoleScope(role.applicableScope || "");
	}

	async function handleUpdateRole() {
		if (!editingRole) {
			return;
		}

		try {
			setEditRoleLoading(true);
			const response = await fetch(
				`/api/organizations/${organizationSlug}/admin/roles/${editingRole.id}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						description: editRoleDescription.trim(),
						applicableScope: editRoleScope.trim() || null,
					}),
				},
			);

			if (!response.ok) {
				const errorData = await safeJson(response);
				throw new Error(errorData?.error || "更新职能角色失败");
			}

			toast({
				title: "更新成功",
				description: "职能角色信息已更新",
			});

			setEditingRole(null);
			void fetchRoles();
		} catch (error) {
			toast({
				title: "更新失败",
				description:
					error instanceof Error ? error.message : "更新职能角色失败",
				variant: "destructive",
			});
		} finally {
			setEditRoleLoading(false);
		}
	}

	async function handleCreateAssignment() {
		if (!selectedMemberId || !selectedRoleId || !assignmentStartDate) {
			toast({
				title: "请填写完整信息",
				description: "成员、角色和开始时间不能为空",
				variant: "destructive",
			});
			return;
		}

		try {
			setCreateAssignmentLoading(true);
			const response = await fetch(
				`/api/organizations/${organizationSlug}/admin/roles/assignments`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: selectedMemberId,
						functionalRoleId: selectedRoleId,
						startDate: assignmentStartDate,
						endDate: assignmentEndDate || null,
						isActive: assignmentActive,
					}),
				},
			);

			if (!response.ok) {
				const errorData = await safeJson(response);
				throw new Error(errorData?.error || "创建任期失败");
			}

			toast({
				title: "创建成功",
				description: "职能角色任期已创建",
			});

			setSelectedMemberId("");
			setSelectedRoleId("");
			setAssignmentStartDate(DATE_INPUT_DEFAULT);
			setAssignmentEndDate("");
			setAssignmentActive(true);
			void fetchAssignments();
		} catch (error) {
			toast({
				title: "创建失败",
				description:
					error instanceof Error ? error.message : "创建任期失败",
				variant: "destructive",
			});
		} finally {
			setCreateAssignmentLoading(false);
		}
	}

	function startEditAssignment(assignment: RoleAssignmentItem) {
		setEditingAssignmentId(assignment.id);
		setEditAssignmentStart(formatDateInput(assignment.startDate));
		setEditAssignmentEnd(formatDateInput(assignment.endDate));
		setEditAssignmentActive(assignment.isActive);
	}

	function cancelEditAssignment() {
		setEditingAssignmentId(null);
		setUpdateAssignmentLoading(false);
	}

	async function handleUpdateAssignment() {
		if (!editingAssignmentId) {
			return;
		}

		try {
			setUpdateAssignmentLoading(true);
			const response = await fetch(
				`/api/organizations/${organizationSlug}/admin/roles/assignments/${editingAssignmentId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						startDate: editAssignmentStart,
						endDate: editAssignmentEnd || null,
						isActive: editAssignmentActive,
					}),
				},
			);

			if (!response.ok) {
				const errorData = await safeJson(response);
				throw new Error(errorData?.error || "更新任期失败");
			}

			toast({
				title: "更新成功",
				description: "职能角色任期已更新",
			});

			setEditingAssignmentId(null);
			void fetchAssignments();
		} catch (error) {
			toast({
				title: "更新失败",
				description:
					error instanceof Error ? error.message : "更新任期失败",
				variant: "destructive",
			});
		} finally {
			setUpdateAssignmentLoading(false);
		}
	}

	const memberOptions = useMemo(() => {
		return members.map((member) => {
			const userId = member.user?.id || member.userId || member.id;
			const displayName =
				member.user?.name ||
				member.name ||
				member.user?.email ||
				member.email ||
				"未命名成员";
			return {
				id: userId,
				name: displayName,
			};
		});
	}, [members]);

	const activeRoleOptions = useMemo(
		() => roles.filter((role) => role.isActive),
		[roles],
	);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>职能角色模板</CardTitle>
					<CardDescription>
						管理系统预设角色及本组织的自定义职能角色
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="space-y-3 rounded-lg border p-4">
						<h4 className="text-sm font-semibold text-muted-foreground">
							创建组织自定义角色
						</h4>
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="roleName">角色名称</Label>
								<Input
									id="roleName"
									placeholder="如：市场负责人"
									value={newRoleName}
									onChange={(event) =>
										setNewRoleName(event.target.value)
									}
									disabled={
										createRoleLoading || !organizationId
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="roleScope">
									适用场景（可选）
								</Label>
								<Input
									id="roleScope"
									placeholder="如：品牌宣传、活动策划"
									value={newRoleScope}
									onChange={(event) =>
										setNewRoleScope(event.target.value)
									}
									disabled={
										createRoleLoading || !organizationId
									}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="roleDescription">职责描述</Label>
							<Textarea
								id="roleDescription"
								placeholder="详细说明该角色的职责范围"
								value={newRoleDescription}
								onChange={(event) =>
									setNewRoleDescription(event.target.value)
								}
								disabled={createRoleLoading || !organizationId}
								rows={3}
							/>
						</div>
						<div className="flex justify-end">
							<Button
								onClick={() => void handleCreateRole()}
								disabled={createRoleLoading || !organizationId}
							>
								{createRoleLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Plus className="mr-2 h-4 w-4" />
								)}
								创建角色
							</Button>
						</div>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="text-sm font-semibold text-muted-foreground">
								角色列表
							</h4>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => void fetchRoles()}
								disabled={rolesLoading}
								className="h-8 w-8"
							>
								{rolesLoading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<RefreshCcw className="h-4 w-4" />
								)}
								<span className="sr-only">刷新</span>
							</Button>
						</div>

						{rolesError ? (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{rolesError}
							</div>
						) : rolesLoading ? (
							<div className="flex items-center justify-center py-6">
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							</div>
						) : roles.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								暂无职能角色，请先创建自定义角色
							</p>
						) : (
							<div className="space-y-2">
								{roles.map((role) => (
									<div
										key={role.id}
										className="rounded-lg border p-3"
									>
										<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
											<div className="space-y-1">
												<div className="flex flex-wrap items-center gap-2">
													<span className="font-medium">
														{resolveRoleDisplayName(
															role,
														)}
													</span>
													<Badge
														variant={
															role.organizationId
																? "secondary"
																: "outline"
														}
													>
														{role.organizationId
															? "自定义"
															: "系统预设"}
													</Badge>
													<Badge
														variant={
															role.isActive
																? "default"
																: "destructive"
														}
													>
														{role.isActive
															? "启用中"
															: "已停用"}
													</Badge>
												</div>
												{role.description && (
													<p className="text-xs text-muted-foreground">
														{role.description}
													</p>
												)}
											</div>
											<div className="flex items-center gap-3">
												{role.organizationId ? (
													<Switch
														checked={role.isActive}
														onCheckedChange={(
															checked,
														) =>
															handleToggleRole(
																role,
																checked,
															)
														}
													/>
												) : (
													<ToggleLeft className="h-4 w-4 text-muted-foreground" />
												)}

												{role.organizationId && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															openEditRole(role)
														}
													>
														<PenSquare className="mr-2 h-4 w-4" />
														编辑
													</Button>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>职能角色任期</CardTitle>
					<CardDescription>
						分配成员职能角色并管理任期，避免时间冲突
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-3 rounded-lg border p-4">
						<h4 className="text-sm font-semibold text-muted-foreground">
							新增任期
						</h4>
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="memberSelect">选择成员</Label>
								<Select
									value={selectedMemberId}
									onValueChange={setSelectedMemberId}
									disabled={memberOptions.length === 0}
								>
									<SelectTrigger className="w-full">
										<SelectValue
											placeholder={
												memberOptions.length === 0
													? "暂无成员"
													: "请选择成员"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{memberOptions.map((member) => (
											<SelectItem
												key={member.id}
												value={member.id}
											>
												{member.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="assignmentRole">
									选择职能角色
								</Label>
								<Select
									value={selectedRoleId}
									onValueChange={setSelectedRoleId}
									disabled={activeRoleOptions.length === 0}
								>
									<SelectTrigger className="w-full">
										<SelectValue
											placeholder={
												activeRoleOptions.length === 0
													? "暂无可用角色"
													: "请选择角色"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{activeRoleOptions.map((role) => (
											<SelectItem
												key={role.id}
												value={role.id}
											>
												{resolveRoleDisplayName(role)}{" "}
												<Badge
													variant={
														role.organizationId
															? "secondary"
															: "outline"
													}
													className="ml-2"
												>
													{role.organizationId
														? "自定义"
														: "系统"}
												</Badge>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="assignmentStart">
									开始时间
								</Label>
								<div className="flex items-center gap-2">
									<Input
										id="assignmentStart"
										type="date"
										value={assignmentStartDate}
										onChange={(event) =>
											setAssignmentStartDate(
												event.target.value,
											)
										}
									/>
									<CalendarIcon className="h-4 w-4 text-muted-foreground" />
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="assignmentEnd">
									结束时间（可选）
								</Label>
								<div className="flex items-center gap-2">
									<Input
										id="assignmentEnd"
										type="date"
										value={assignmentEndDate}
										onChange={(event) =>
											setAssignmentEndDate(
												event.target.value,
											)
										}
									/>
									<CalendarIcon className="h-4 w-4 text-muted-foreground" />
								</div>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Switch
								checked={assignmentActive}
								onCheckedChange={setAssignmentActive}
							/>
							<Label className="text-sm">立即生效</Label>
						</div>
						<div className="flex justify-end">
							<Button
								onClick={() => void handleCreateAssignment()}
								disabled={createAssignmentLoading}
							>
								{createAssignmentLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Plus className="mr-2 h-4 w-4" />
								)}
								新增任期
							</Button>
						</div>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="text-sm font-semibold text-muted-foreground">
								现有任期
							</h4>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => void fetchAssignments()}
								disabled={assignmentsLoading}
								className="h-8 w-8"
							>
								{assignmentsLoading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<RefreshCcw className="h-4 w-4" />
								)}
								<span className="sr-only">刷新</span>
							</Button>
						</div>

						{assignmentsError ? (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{assignmentsError}
							</div>
						) : assignmentsLoading ? (
							<div className="flex items-center justify-center py-6">
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							</div>
						) : assignments.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								暂无职能角色任期记录
							</p>
						) : (
							<div className="space-y-4">
								{activeAssignments.length > 0 && (
									<AssignmentSection
										title="在任 / 即将生效"
										icon={
											<ShieldCheck className="h-4 w-4" />
										}
										assignments={activeAssignments}
										onEdit={startEditAssignment}
										editingAssignmentId={
											editingAssignmentId
										}
										onCancelEdit={cancelEditAssignment}
										onSaveEdit={handleUpdateAssignment}
										editStartDate={editAssignmentStart}
										editEndDate={editAssignmentEnd}
										onEditStartDateChange={
											setEditAssignmentStart
										}
										onEditEndDateChange={
											setEditAssignmentEnd
										}
										editIsActive={editAssignmentActive}
										onEditIsActiveChange={
											setEditAssignmentActive
										}
										updateLoading={updateAssignmentLoading}
										resolveRoleName={resolveRoleDisplayName}
									/>
								)}
								{historicalAssignments.length > 0 && (
									<AssignmentSection
										title="历史任期"
										icon={<History className="h-4 w-4" />}
										assignments={historicalAssignments}
										onEdit={startEditAssignment}
										editingAssignmentId={
											editingAssignmentId
										}
										onCancelEdit={cancelEditAssignment}
										onSaveEdit={handleUpdateAssignment}
										editStartDate={editAssignmentStart}
										editEndDate={editAssignmentEnd}
										onEditStartDateChange={
											setEditAssignmentStart
										}
										onEditEndDateChange={
											setEditAssignmentEnd
										}
										editIsActive={editAssignmentActive}
										onEditIsActiveChange={
											setEditAssignmentActive
										}
										updateLoading={updateAssignmentLoading}
										resolveRoleName={resolveRoleDisplayName}
									/>
								)}
								{inactiveAssignments.length > 0 && (
									<AssignmentSection
										title="已停用"
										icon={<X className="h-4 w-4" />}
										assignments={inactiveAssignments}
										onEdit={startEditAssignment}
										editingAssignmentId={
											editingAssignmentId
										}
										onCancelEdit={cancelEditAssignment}
										onSaveEdit={handleUpdateAssignment}
										editStartDate={editAssignmentStart}
										editEndDate={editAssignmentEnd}
										onEditStartDateChange={
											setEditAssignmentStart
										}
										onEditEndDateChange={
											setEditAssignmentEnd
										}
										editIsActive={editAssignmentActive}
										onEditIsActiveChange={
											setEditAssignmentActive
										}
										updateLoading={updateAssignmentLoading}
										resolveRoleName={resolveRoleDisplayName}
									/>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Dialog
				open={!!editingRole}
				onOpenChange={(open) => {
					if (!open) {
						setEditingRole(null);
					}
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>编辑职能角色</DialogTitle>
						<DialogDescription>
							调整 {editingRoleDisplayName} 的职责描述或适用范围
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1">
							<Label>角色名称</Label>
							<p className="text-sm font-medium">
								{editingRoleDisplayName}
							</p>
							{editingRole &&
								!editingRole.organizationId &&
								editingRole.name && (
									<p className="text-xs text-muted-foreground">
										系统标识：{editingRole.name}
									</p>
								)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="editRoleDescription">
								职责描述
							</Label>
							<Textarea
								id="editRoleDescription"
								value={editRoleDescription}
								onChange={(event) =>
									setEditRoleDescription(event.target.value)
								}
								rows={3}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="editRoleScope">
								适用场景（可选）
							</Label>
							<Input
								id="editRoleScope"
								value={editRoleScope}
								onChange={(event) =>
									setEditRoleScope(event.target.value)
								}
							/>
						</div>
					</div>
					<DialogFooter className="mt-4">
						<Button
							variant="secondary"
							onClick={() => setEditingRole(null)}
							disabled={editRoleLoading}
						>
							取消
						</Button>
						<Button
							onClick={() => void handleUpdateRole()}
							disabled={editRoleLoading}
						>
							{editRoleLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<RefreshCcw className="mr-2 h-4 w-4" />
							)}
							保存修改
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

interface AssignmentSectionProps {
	title: string;
	icon: React.ReactNode;
	assignments: RoleAssignmentItem[];
	onEdit: (assignment: RoleAssignmentItem) => void;
	editingAssignmentId: string | null;
	onCancelEdit: () => void;
	onSaveEdit: () => Promise<void>;
	editStartDate: string;
	editEndDate: string;
	onEditStartDateChange: (value: string) => void;
	onEditEndDateChange: (value: string) => void;
	editIsActive: boolean;
	onEditIsActiveChange: (value: boolean) => void;
	updateLoading: boolean;
	resolveRoleName: (role: FunctionalRoleItem) => string;
}

function AssignmentSection({
	title,
	icon,
	assignments,
	onEdit,
	editingAssignmentId,
	onCancelEdit,
	onSaveEdit,
	editStartDate,
	editEndDate,
	onEditStartDateChange,
	onEditEndDateChange,
	editIsActive,
	onEditIsActiveChange,
	updateLoading,
	resolveRoleName,
}: AssignmentSectionProps) {
	if (assignments.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
				<span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
					{icon}
				</span>
				<span>{title}</span>
			</div>
			<div className="space-y-3">
				{assignments.map((assignment) => {
					const isEditing = editingAssignmentId === assignment.id;
					return (
						<div
							key={assignment.id}
							className="rounded-lg border p-3 text-sm"
						>
							<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
								<div className="space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-medium">
											{resolveRoleName(
												assignment.functionalRole,
											)}
										</span>
										<Badge
											variant={statusBadgeVariant(
												assignment.status,
											)}
										>
											{STATUS_LABEL[assignment.status]}
										</Badge>
										<Badge
											variant={
												assignment.roleType === "system"
													? "outline"
													: "secondary"
											}
										>
											{
												ROLE_TYPE_LABEL[
													assignment.roleType
												]
											}
										</Badge>
									</div>
									<p className="text-xs text-muted-foreground">
										{assignment.user?.name ||
											assignment.user?.username ||
											assignment.user?.email}
									</p>
									<p className="text-xs text-muted-foreground">
										任期：
										{formatDateDisplay(
											assignment.startDate,
										)}{" "}
										~{" "}
										{formatDateDisplay(assignment.endDate)}
									</p>
								</div>
								<div className="space-x-2 text-right">
									{isEditing ? (
										<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
											<div className="flex items-center gap-2">
												<Label className="text-xs">
													开始
												</Label>
												<Input
													type="date"
													value={editStartDate}
													onChange={(event) =>
														onEditStartDateChange(
															event.target.value,
														)
													}
													className="h-8 w-32"
												/>
											</div>
											<div className="flex items-center gap-2">
												<Label className="text-xs">
													结束
												</Label>
												<Input
													type="date"
													value={editEndDate}
													onChange={(event) =>
														onEditEndDateChange(
															event.target.value,
														)
													}
													className="h-8 w-32"
												/>
											</div>
											<div className="flex items-center gap-2">
												<Switch
													checked={editIsActive}
													onCheckedChange={
														onEditIsActiveChange
													}
												/>
												<Label className="text-xs">
													启用
												</Label>
											</div>
											<div className="flex items-center gap-2">
												<Button
													variant="secondary"
													size="sm"
													onClick={onCancelEdit}
													disabled={updateLoading}
												>
													取消
												</Button>
												<Button
													size="sm"
													onClick={() =>
														void onSaveEdit()
													}
													disabled={updateLoading}
												>
													{updateLoading ? (
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													) : (
														<RefreshCcw className="mr-2 h-4 w-4" />
													)}
													保存
												</Button>
											</div>
										</div>
									) : (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onEdit(assignment)}
										>
											<PenSquare className="mr-2 h-4 w-4" />
											调整任期
										</Button>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function statusBadgeVariant(status: RoleAssignmentItem["status"]) {
	switch (status) {
		case "ACTIVE":
			return "default" as const;
		case "UPCOMING":
			return "secondary" as const;
		case "HISTORICAL":
			return "outline" as const;
		case "INACTIVE":
			return "destructive" as const;
		default:
			return "outline" as const;
	}
}

async function safeJson(response: Response) {
	try {
		return await response.json();
	} catch (error) {
		return null;
	}
}

function formatDateDisplay(value: string | null) {
	if (!value) {
		return "长期";
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return format(date, "yyyy-MM-dd");
}

function formatDateInput(value: string | null) {
	if (!value) {
		return "";
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "";
	}
	return format(date, "yyyy-MM-dd");
}
