"use client";

import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { createFunctionalRoleDisplayNameResolver } from "@/features/functional-roles/display-name";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
	CalendarIcon,
	Check,
	ChevronsUpDown,
	History,
	Loader2,
	PenSquare,
	Plus,
	RefreshCcw,
	ShieldCheck,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

interface OrganizationSummary {
	id: string;
	name: string;
	slug?: string;
	logo?: string | null;
}

interface FunctionalRoleOption {
	id: string;
	name: string;
	description: string;
	applicableScope: string | null;
	organizationId: string | null;
	isActive: boolean;
}

interface FunctionalRoleAssignment {
	id: string;
	userId: string;
	organizationId: string;
	functionalRoleId: string;
	startDate: string;
	endDate: string | null;
	isActive: boolean;
	status: "ACTIVE" | "UPCOMING" | "HISTORICAL" | "INACTIVE";
	roleType: "system" | "custom";
	functionalRole: FunctionalRoleOption;
	organization?: OrganizationSummary;
}

interface UserSummary {
	id: string;
	name?: string | null;
	email?: string | null;
	username?: string | null;
}

interface UserFunctionalRoleDialogProps {
	user: UserSummary;
	trigger?: React.ReactNode;
}

const STATUS_LABEL: Record<FunctionalRoleAssignment["status"], string> = {
	ACTIVE: "在任",
	UPCOMING: "即将生效",
	HISTORICAL: "历史记录",
	INACTIVE: "已停用",
};

const ROLE_TYPE_LABEL: Record<FunctionalRoleAssignment["roleType"], string> = {
	system: "系统预设",
	custom: "组织自定义",
};

const DATE_INPUT_DEFAULT = format(new Date(), "yyyy-MM-dd");
export function UserFunctionalRoleDialog({
	user,
	trigger,
}: UserFunctionalRoleDialogProps) {
	const [open, setOpen] = useState(false);
	const [assignments, setAssignments] = useState<FunctionalRoleAssignment[]>(
		[],
	);
	const [assignmentsLoading, setAssignmentsLoading] = useState(false);
	const [assignmentsError, setAssignmentsError] = useState<string | null>(
		null,
	);

	const [organizationSearch, setOrganizationSearch] = useState("");
	const [organizationOptions, setOrganizationOptions] = useState<
		OrganizationSummary[]
	>([]);
	const [organizationLoading, setOrganizationLoading] = useState(false);
	const [organizationsError, setOrganizationsError] = useState<string | null>(
		null,
	);
	const [selectedOrganizationId, setSelectedOrganizationId] = useState("");

	const [roleOptions, setRoleOptions] = useState<FunctionalRoleOption[]>([]);
	const [roleLoading, setRoleLoading] = useState(false);
	const [roleError, setRoleError] = useState<string | null>(null);
	const [selectedRoleId, setSelectedRoleId] = useState("");

	const [startDate, setStartDate] = useState<string>(DATE_INPUT_DEFAULT);
	const [endDate, setEndDate] = useState<string>("");
	const [createLoading, setCreateLoading] = useState(false);

	const [editingAssignmentId, setEditingAssignmentId] = useState<
		string | null
	>(null);
	const [editStartDate, setEditStartDate] =
		useState<string>(DATE_INPUT_DEFAULT);
	const [editEndDate, setEditEndDate] = useState<string>("");
	const [editIsActive, setEditIsActive] = useState(true);
	const [updateLoading, setUpdateLoading] = useState(false);

	const organizationInitializedRef = useRef(false);

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

	const [organizationPopoverOpen, setOrganizationPopoverOpen] =
		useState(false);
	const [rolePopoverOpen, setRolePopoverOpen] = useState(false);
	const [selectedOrganization, setSelectedOrganization] =
		useState<OrganizationSummary | null>(null);

	const selectedRole = useMemo(
		() => roleOptions.find((role) => role.id === selectedRoleId) ?? null,
		[roleOptions, selectedRoleId],
	);

	const { systemRoles, customRoles } = useMemo(() => {
		const system = roleOptions.filter(
			(role) => role.organizationId === null,
		);
		const custom = roleOptions.filter(
			(role) => role.organizationId !== null,
		);
		return { systemRoles: system, customRoles: custom };
	}, [roleOptions]);

	useEffect(() => {
		if (!open) {
			return;
		}

		setAssignmentsError(null);
		void fetchAssignments();
	}, [open]);

	useEffect(() => {
		if (!open || !organizationPopoverOpen) {
			return;
		}

		const controller = new AbortController();
		const handler = setTimeout(
			() => {
				void fetchOrganizations(organizationSearch, controller.signal);
			},
			organizationInitializedRef.current ? 250 : 0,
		);

		organizationInitializedRef.current = true;

		return () => {
			controller.abort();
			clearTimeout(handler);
		};
	}, [organizationSearch, open, organizationPopoverOpen]);

	useEffect(() => {
		if (!open) {
			return;
		}

		if (!selectedOrganizationId) {
			setRoleOptions([]);
			setSelectedRoleId("");
			setRoleError(null);
			setRoleLoading(false);
			return;
		}

		void fetchRoles(selectedOrganizationId);
	}, [selectedOrganizationId, open]);

	useEffect(() => {
		if (!selectedOrganizationId) {
			setSelectedOrganization(null);
			return;
		}

		setSelectedOrganization((current) => {
			const match = organizationOptions.find(
				(option) => option.id === selectedOrganizationId,
			);
			if (!match) {
				return current ?? null;
			}
			return match;
		});
	}, [organizationOptions, selectedOrganizationId]);

	useEffect(() => {
		if (!selectedOrganizationId) {
			setRolePopoverOpen(false);
		}
	}, [selectedOrganizationId]);

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

	async function fetchAssignments() {
		try {
			setAssignmentsLoading(true);
			const params = new URLSearchParams({
				userId: user.id,
				includeInactive: "true",
				status: "all",
				limit: "100",
			});
			const response = await fetch(
				`/api/admin/functional-roles/assignments?${params.toString()}`,
			);

			if (!response.ok) {
				const errorData = await safeJson(response);
				throw new Error(errorData?.error || "加载职能角色列表失败");
			}

			const data = await response.json();
			setAssignments(data.assignments || []);
		} catch (error) {
			if (error instanceof Error) {
				setAssignmentsError(error.message);
			} else {
				setAssignmentsError("加载职能角色失败");
			}
		} finally {
			setAssignmentsLoading(false);
		}
	}

	async function fetchOrganizations(search: string, signal?: AbortSignal) {
		try {
			setOrganizationLoading(true);
			setOrganizationsError(null);

			const params = new URLSearchParams({ limit: "20", offset: "0" });
			if (search.trim().length > 0) {
				params.set("query", search.trim());
			}

			const response = await fetch(
				`/api/admin/organizations?${params.toString()}`,
				{ signal },
			);

			if (!response.ok) {
				if (response.status === 403) {
					setOrganizationsError("暂无权限查看组织列表");
					setOrganizationOptions([]);
					return;
				}

				const errorData = await safeJson(response);
				throw new Error(errorData?.error || "加载组织列表失败");
			}

			const data = await response.json();
			setOrganizationOptions(data.organizations || []);
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				return;
			}
			if (error instanceof Error) {
				setOrganizationsError(error.message);
			} else {
				setOrganizationsError("加载组织列表失败");
			}
		} finally {
			setOrganizationLoading(false);
		}
	}

	async function fetchRoles(organizationId: string) {
		try {
			setRoleLoading(true);
			setRoleError(null);
			const params = new URLSearchParams({
				organizationId,
				includeInactive: "false",
				roleType: "all",
			});
			const response = await fetch(
				`/api/admin/functional-roles?${params.toString()}`,
			);

			if (!response.ok) {
				const errorData = await safeJson(response);
				throw new Error(errorData?.error || "加载职能角色失败");
			}

			const data = await response.json();
			setRoleOptions(data.roles || []);
			setSelectedRoleId("");
		} catch (error) {
			if (error instanceof Error) {
				setRoleError(error.message);
			} else {
				setRoleError("加载职能角色失败");
			}
			setRoleOptions([]);
		} finally {
			setRoleLoading(false);
		}
	}

	async function handleCreateAssignment() {
		if (!selectedOrganizationId) {
			toast({
				title: "请选择组织",
				description: "分配职能角色前需要选择组织",
				variant: "destructive",
			});
			return;
		}

		if (!selectedRoleId) {
			toast({
				title: "请选择职能角色",
				description: "请选择一个职能角色后再创建任期",
				variant: "destructive",
			});
			return;
		}

		if (!startDate) {
			toast({
				title: "请选择任期开始时间",
				description: "任期开始时间不能为空",
				variant: "destructive",
			});
			return;
		}

		try {
			setCreateLoading(true);
			const response = await fetch(
				"/api/admin/functional-roles/assignments",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						userId: user.id,
						organizationId: selectedOrganizationId,
						functionalRoleId: selectedRoleId,
						startDate,
						endDate: endDate ? endDate : null,
					}),
				},
			);

			if (!response.ok) {
				const errorData = await safeJson(response);
				throw new Error(errorData?.error || "创建职能角色任期失败");
			}

			toast({
				title: "创建成功",
				description: "职能角色任期已创建",
			});

			setSelectedRoleId("");
			setEndDate("");
			setStartDate(DATE_INPUT_DEFAULT);

			void fetchAssignments();
		} catch (error) {
			toast({
				title: "操作失败",
				description:
					error instanceof Error
						? error.message
						: "创建职能角色任期失败",
				variant: "destructive",
			});
		} finally {
			setCreateLoading(false);
		}
	}

	function startEdit(assignment: FunctionalRoleAssignment) {
		setEditingAssignmentId(assignment.id);
		setEditStartDate(formatDateInput(assignment.startDate));
		setEditEndDate(formatDateInput(assignment.endDate));
		setEditIsActive(assignment.isActive);
	}

	function cancelEdit() {
		setEditingAssignmentId(null);
		setUpdateLoading(false);
	}

	async function handleUpdateAssignment() {
		if (!editingAssignmentId) {
			return;
		}

		try {
			setUpdateLoading(true);
			const response = await fetch(
				`/api/admin/functional-roles/assignments/${editingAssignmentId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						startDate: editStartDate,
						endDate: editEndDate || null,
						isActive: editIsActive,
					}),
				},
			);

			if (!response.ok) {
				const errorData = await safeJson(response);
				throw new Error(errorData?.error || "更新职能角色任期失败");
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
					error instanceof Error
						? error.message
						: "更新职能角色任期失败",
				variant: "destructive",
			});
		} finally {
			setUpdateLoading(false);
		}
	}

	function resetDialogState() {
		setAssignments([]);
		setAssignmentsError(null);
		setOrganizationSearch("");
		setOrganizationOptions([]);
		setOrganizationsError(null);
		setOrganizationLoading(false);
		setOrganizationPopoverOpen(false);
		setSelectedOrganizationId("");
		setSelectedOrganization(null);
		setRoleOptions([]);
		setSelectedRoleId("");
		setRoleError(null);
		setRoleLoading(false);
		setStartDate(DATE_INPUT_DEFAULT);
		setEndDate("");
		setRolePopoverOpen(false);
		setEditingAssignmentId(null);
		organizationInitializedRef.current = false;
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen);
				if (!nextOpen) {
					resetDialogState();
				}
			}}
		>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline" size="sm" className="text-xs">
						<ShieldCheck className="mr-2 h-4 w-4" />
						职能角色
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>管理职能角色</DialogTitle>
					<DialogDescription>
						为 {user.name || user.email || user.username}{" "}
						管理组织职能角色和任期
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					<section className="space-y-3">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-semibold text-muted-foreground">
								当前任期
							</h3>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									void fetchAssignments();
								}}
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
										onEdit={startEdit}
										editingAssignmentId={
											editingAssignmentId
										}
										onCancelEdit={cancelEdit}
										onSaveEdit={handleUpdateAssignment}
										editStartDate={editStartDate}
										editEndDate={editEndDate}
										onEditStartDateChange={setEditStartDate}
										onEditEndDateChange={setEditEndDate}
										editIsActive={editIsActive}
										onEditIsActiveChange={setEditIsActive}
										updateLoading={updateLoading}
										resolveRoleName={resolveRoleDisplayName}
									/>
								)}
								{historicalAssignments.length > 0 && (
									<AssignmentSection
										title="历史任期"
										icon={<History className="h-4 w-4" />}
										assignments={historicalAssignments}
										onEdit={startEdit}
										editingAssignmentId={
											editingAssignmentId
										}
										onCancelEdit={cancelEdit}
										onSaveEdit={handleUpdateAssignment}
										editStartDate={editStartDate}
										editEndDate={editEndDate}
										onEditStartDateChange={setEditStartDate}
										onEditEndDateChange={setEditEndDate}
										editIsActive={editIsActive}
										onEditIsActiveChange={setEditIsActive}
										updateLoading={updateLoading}
										resolveRoleName={resolveRoleDisplayName}
									/>
								)}
								{inactiveAssignments.length > 0 && (
									<AssignmentSection
										title="已停用"
										icon={<X className="h-4 w-4" />}
										assignments={inactiveAssignments}
										onEdit={startEdit}
										editingAssignmentId={
											editingAssignmentId
										}
										onCancelEdit={cancelEdit}
										onSaveEdit={handleUpdateAssignment}
										editStartDate={editStartDate}
										editEndDate={editEndDate}
										onEditStartDateChange={setEditStartDate}
										onEditEndDateChange={setEditEndDate}
										editIsActive={editIsActive}
										onEditIsActiveChange={setEditIsActive}
										updateLoading={updateLoading}
										resolveRoleName={resolveRoleDisplayName}
									/>
								)}
							</div>
						)}
					</section>

					<section className="space-y-4 rounded-lg border p-4">
						<h3 className="text-sm font-semibold text-muted-foreground">
							新增职能角色任期
						</h3>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>选择组织</Label>
								<Popover
									open={organizationPopoverOpen}
									onOpenChange={(nextOpen) => {
										setOrganizationPopoverOpen(nextOpen);
										if (!nextOpen) {
											setOrganizationSearch("");
										}
									}}
								>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											role="combobox"
											aria-expanded={
												organizationPopoverOpen
											}
											className="w-full justify-between"
										>
											<span className="flex-1 truncate text-left">
												{organizationsError
													? organizationsError
													: selectedOrganization
														? selectedOrganization.name
														: organizationLoading
															? "加载组织中..."
															: "选择组织"}
											</span>
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-[320px] p-0"
										align="start"
									>
										<Command shouldFilter={false}>
											<CommandInput
												placeholder="搜索组织名称..."
												value={organizationSearch}
												onValueChange={
													setOrganizationSearch
												}
											/>
											<CommandList>
												{organizationLoading ? (
													<div className="py-6 text-center text-sm text-muted-foreground">
														<Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
														加载中...
													</div>
												) : (
													<>
														<CommandEmpty>
															未找到匹配的组织
														</CommandEmpty>
														<CommandGroup>
															{organizationOptions.map(
																(
																	organization,
																) => (
																	<CommandItem
																		key={
																			organization.id
																		}
																		value={`${organization.name} ${organization.slug ?? ""}`}
																		onSelect={() => {
																			setSelectedOrganizationId(
																				organization.id,
																			);
																			setSelectedOrganization(
																				organization,
																			);
																			setSelectedRoleId(
																				"",
																			);
																			setRoleError(
																				null,
																			);
																			setOrganizationPopoverOpen(
																				false,
																			);
																			setOrganizationSearch(
																				"",
																			);
																		}}
																	>
																		<Check
																			className={cn(
																				"mr-2 h-4 w-4",
																				selectedOrganizationId ===
																					organization.id
																					? "opacity-100"
																					: "opacity-0",
																			)}
																		/>
																		<div className="flex flex-col">
																			<span className="font-medium">
																				{
																					organization.name
																				}
																			</span>
																			{organization.slug && (
																				<span className="text-xs text-muted-foreground">
																					/
																					{
																						organization.slug
																					}
																				</span>
																			)}
																		</div>
																	</CommandItem>
																),
															)}
														</CommandGroup>
													</>
												)}
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
								{organizationsError && (
									<p className="text-xs text-destructive">
										{organizationsError}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label>选择职能角色</Label>
								<Popover
									open={rolePopoverOpen}
									onOpenChange={(nextOpen) => {
										if (!selectedOrganizationId) {
											return;
										}
										setRolePopoverOpen(nextOpen);
									}}
								>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											role="combobox"
											aria-expanded={rolePopoverOpen}
											className="w-full justify-between"
											disabled={!selectedOrganizationId}
										>
											<span className="flex-1 truncate text-left">
												{roleError
													? roleError
													: !selectedOrganizationId
														? "请先选择组织"
														: roleLoading
															? "加载角色中..."
															: selectedRole
																? resolveRoleDisplayName(
																		selectedRole,
																	)
																: "选择职能角色"}
											</span>
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-[320px] p-0"
										align="start"
									>
										<Command>
											<CommandInput placeholder="搜索职能角色..." />
											<CommandList>
												{roleLoading ? (
													<div className="py-6 text-center text-sm text-muted-foreground">
														<Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
														加载中...
													</div>
												) : (
													<>
														<CommandEmpty>
															{selectedOrganizationId
																? roleOptions.length ===
																	0
																	? "该组织暂无可用职能角色"
																	: "未找到匹配的职能角色"
																: "请先选择组织"}
														</CommandEmpty>
														{systemRoles.length >
															0 && (
															<CommandGroup heading="系统预设角色">
																{systemRoles.map(
																	(role) => (
																		<CommandItem
																			key={
																				role.id
																			}
																			value={`${resolveRoleDisplayName(role)} ${role.name} ${role.description ?? ""}`}
																			onSelect={() => {
																				setSelectedRoleId(
																					role.id,
																				);
																				setRolePopoverOpen(
																					false,
																				);
																			}}
																		>
																			<Check
																				className={cn(
																					"mr-2 h-4 w-4",
																					selectedRoleId ===
																						role.id
																						? "opacity-100"
																						: "opacity-0",
																				)}
																			/>
																			<div className="flex flex-col">
																				<span className="flex items-center gap-2 font-medium">
																					{resolveRoleDisplayName(
																						role,
																					)}
																					<Badge
																						variant="outline"
																						className="rounded-full px-2 text-xs font-normal"
																					>
																						系统
																					</Badge>
																				</span>
																				{role.description && (
																					<span className="text-xs text-muted-foreground">
																						{
																							role.description
																						}
																					</span>
																				)}
																			</div>
																		</CommandItem>
																	),
																)}
															</CommandGroup>
														)}
														{customRoles.length >
															0 && (
															<CommandGroup
																heading={
																	selectedOrganization?.name ??
																	"自定义角色"
																}
															>
																{customRoles.map(
																	(role) => (
																		<CommandItem
																			key={
																				role.id
																			}
																			value={`${resolveRoleDisplayName(role)} ${role.name} ${role.description ?? ""}`}
																			onSelect={() => {
																				setSelectedRoleId(
																					role.id,
																				);
																				setRolePopoverOpen(
																					false,
																				);
																			}}
																		>
																			<Check
																				className={cn(
																					"mr-2 h-4 w-4",
																					selectedRoleId ===
																						role.id
																						? "opacity-100"
																						: "opacity-0",
																				)}
																			/>
																			<div className="flex flex-col">
																				<span className="flex items-center gap-2 font-medium">
																					{resolveRoleDisplayName(
																						role,
																					)}
																					<Badge
																						variant="secondary"
																						className="rounded-full px-2 text-xs font-normal"
																					>
																						自定义
																					</Badge>
																				</span>
																				{role.description && (
																					<span className="text-xs text-muted-foreground">
																						{
																							role.description
																						}
																					</span>
																				)}
																			</div>
																		</CommandItem>
																	),
																)}
															</CommandGroup>
														)}
													</>
												)}
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
								{roleError && (
									<p className="text-xs text-destructive">
										{roleError}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="startDate">开始时间</Label>
								<div className="flex items-center gap-2">
									<Input
										type="date"
										id="startDate"
										value={startDate}
										onChange={(event) =>
											setStartDate(event.target.value)
										}
									/>
									<CalendarIcon className="h-4 w-4 text-muted-foreground" />
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="endDate">
									结束时间（可选）
								</Label>
								<div className="flex items-center gap-2">
									<Input
										type="date"
										id="endDate"
										value={endDate}
										onChange={(event) =>
											setEndDate(event.target.value)
										}
									/>
									<CalendarIcon className="h-4 w-4 text-muted-foreground" />
								</div>
							</div>
						</div>
						<div className="flex justify-end">
							<Button
								onClick={() => void handleCreateAssignment()}
								disabled={createLoading}
							>
								{createLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Plus className="mr-2 h-4 w-4" />
								)}
								新增任期
							</Button>
						</div>
					</section>
				</div>
			</DialogContent>
		</Dialog>
	);
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

async function safeJson(response: Response) {
	try {
		return await response.json();
	} catch (error) {
		return null;
	}
}

interface AssignmentSectionProps {
	title: string;
	icon: React.ReactNode;
	assignments: FunctionalRoleAssignment[];
	onEdit: (assignment: FunctionalRoleAssignment) => void;
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
	resolveRoleName: (role: FunctionalRoleOption) => string;
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
										<Badge variant="outline">
											{
												ROLE_TYPE_LABEL[
													assignment.roleType
												]
											}
										</Badge>
										{assignment.organization && (
											<Badge variant="secondary">
												{assignment.organization.name}
											</Badge>
										)}
										<Badge
											variant={statusBadgeVariant(
												assignment.status,
											)}
										>
											{STATUS_LABEL[assignment.status]}
										</Badge>
									</div>
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
										<div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
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
							{assignment.functionalRole.description && (
								<p className="text-xs text-muted-foreground">
									说明：
									{assignment.functionalRole.description}
								</p>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function statusBadgeVariant(status: FunctionalRoleAssignment["status"]) {
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
