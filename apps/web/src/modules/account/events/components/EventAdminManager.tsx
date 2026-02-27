"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@community/ui/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@community/ui/ui/avatar";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Checkbox } from "@community/ui/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import { Label } from "@community/ui/ui/label";
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
import {
	AlertCircle,
	CheckCircle,
	Clock,
	Mail,
	Trash2,
	UserPlus,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	MemberSearchInput,
	type MemberSearchUser,
} from "@shared/components/MemberSearchInput";

interface EventAdmin {
	id: string;
	eventId: string;
	userId?: string;
	email: string;
	role: "ADMIN" | "SUPER_ADMIN";
	status: "PENDING" | "ACCEPTED" | "REJECTED" | "REMOVED";
	canEditEvent: boolean;
	canManageRegistrations: boolean;
	canManageAdmins: boolean;
	invitedAt: string;
	acceptedAt?: string;
	user?: {
		id: string;
		name: string;
		email: string;
		image?: string;
		username?: string;
	};
	inviter: {
		id: string;
		name: string;
		username?: string;
	};
}

interface EventAdminManagerProps {
	eventId: string;
}

export function EventAdminManager({ eventId }: EventAdminManagerProps) {
	const [admins, setAdmins] = useState<EventAdmin[]>([]);
	const [loading, setLoading] = useState(true);
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [inviteForm, setInviteForm] = useState({
		userId: "",
		role: "ADMIN" as "ADMIN" | "SUPER_ADMIN",
		canEditEvent: true,
		canManageRegistrations: true,
		canManageAdmins: false,
	});
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedUser, setSelectedUser] = useState<MemberSearchUser | null>(
		null,
	);
	const [submitting, setSubmitting] = useState(false);
	const [adminToRemove, setAdminToRemove] = useState<EventAdmin | null>(null);
	const toastsT = useTranslations("dashboard.events.adminManager.toasts");

	// 处理用户选择
	const handleUserSelect = (user: MemberSearchUser) => {
		setSelectedUser(user);
		setInviteForm((current) => ({ ...current, userId: user.id }));
		setSearchQuery(user.name);
	};

	const clearSelectedUser = () => {
		setSelectedUser(null);
		setInviteForm((current) => ({ ...current, userId: "" }));
	};

	// 清除选择
	const clearSelection = () => {
		clearSelectedUser();
		setSearchQuery("");
	};

	useEffect(() => {
		fetchAdmins();
	}, [eventId]);

	const fetchAdmins = async () => {
		try {
			const response = await fetch(`/api/events/${eventId}/admins`);
			if (response.ok) {
				const data = await response.json();
				setAdmins(data.data || []);
			} else {
				toast.error(toastsT("fetchFailed"));
			}
		} catch (error) {
			console.error("Failed to fetch admins:", error);
			toast.error(toastsT("fetchFailed"));
		} finally {
			setLoading(false);
		}
	};

	const handleInviteSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);

		try {
			const response = await fetch(
				`/api/events/${eventId}/admins/invite`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(inviteForm),
				},
			);

			if (response.ok) {
				toast.success(toastsT("addSuccess"));
				setInviteDialogOpen(false);
				setInviteForm({
					userId: "",
					role: "ADMIN",
					canEditEvent: true,
					canManageRegistrations: true,
					canManageAdmins: false,
				});
				clearSelection();
				fetchAdmins();
			} else {
				const errorData = await response.json();
				toast.error(errorData.error || toastsT("addFailed"));
			}
		} catch (error) {
			console.error("Error adding admin:", error);
			toast.error(toastsT("addFailed"));
		} finally {
			setSubmitting(false);
		}
	};

	const handleRemoveAdmin = async (admin: EventAdmin) => {
		if (!admin.id) {
			return;
		}

		try {
			const response = await fetch(
				`/api/events/${eventId}/admins/${admin.id}`,
				{
					method: "DELETE",
				},
			);

			if (response.ok) {
				toast.success(toastsT("removeSuccess"));
				fetchAdmins();
			} else {
				const errorData = await response.json();
				toast.error(errorData.error || toastsT("removeFailed"));
			}
		} catch (error) {
			console.error("Error removing admin:", error);
			toast.error(toastsT("removeFailed"));
		}
		setAdminToRemove(null);
	};

	const getStatusBadge = (status: EventAdmin["status"]) => {
		const statusConfig = {
			PENDING: {
				variant: "outline" as const,
				text: "待接受",
				icon: Clock,
				color: "text-yellow-600",
			},
			ACCEPTED: {
				variant: "default" as const,
				text: "已接受",
				icon: CheckCircle,
				color: "text-green-600",
			},
			REJECTED: {
				variant: "destructive" as const,
				text: "已拒绝",
				icon: XCircle,
				color: "text-red-600",
			},
			REMOVED: {
				variant: "secondary" as const,
				text: "已移除",
				icon: AlertCircle,
				color: "text-muted-foreground",
			},
		};
		return (
			statusConfig[status] || {
				variant: "outline" as const,
				text: status,
				icon: Clock,
				color: "",
			}
		);
	};

	const getRoleBadge = (role: EventAdmin["role"]) => {
		return role === "SUPER_ADMIN"
			? { variant: "secondary" as const, text: "超级管理员" }
			: { variant: "outline" as const, text: "管理员" };
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<div className="animate-pulse space-y-3">
						<div className="h-6 bg-muted rounded w-32" />
						<div className="h-4 bg-muted rounded w-64" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="animate-pulse space-y-3">
						<div className="h-10 bg-muted rounded" />
						<div className="h-32 bg-muted rounded" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<CardTitle>活动管理员</CardTitle>
						<CardDescription>
							管理可以编辑活动和处理报名的管理员
						</CardDescription>
					</div>
					<Dialog
						open={inviteDialogOpen}
						onOpenChange={setInviteDialogOpen}
					>
						<DialogTrigger asChild>
							<Button size="sm" className="shrink-0">
								<UserPlus className="w-4 h-4 sm:mr-2" />
								<span className="hidden sm:inline">
									添加管理员
								</span>
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>添加活动管理员</DialogTitle>
								<DialogDescription>
									搜索并选择用户添加为活动管理员
								</DialogDescription>
							</DialogHeader>
							<form
								onSubmit={handleInviteSubmit}
								className="space-y-4"
							>
								<div className="space-y-2">
									<Label htmlFor="userSearch">搜索用户</Label>
									<MemberSearchInput
										id="userSearch"
										value={searchQuery}
										onValueChange={(query) => {
											setSearchQuery(query);
											if (selectedUser) {
												clearSelectedUser();
											}
										}}
										onSelect={handleUserSelect}
										placeholder="输入姓名、用户名或手机号搜索..."
									/>
									{selectedUser && (
										<div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
											<div className="flex items-center space-x-3">
												<Avatar className="h-8 w-8">
													<AvatarImage
														src={selectedUser.image}
													/>
													<AvatarFallback>
														{selectedUser.name[0]?.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="font-medium text-sm text-green-800">
														{selectedUser.name}
													</div>
													<div className="text-xs text-green-600">
														{selectedUser.username &&
															`@${selectedUser.username}`}
														{selectedUser.userRoleString && (
															<span
																className={
																	selectedUser.username
																		? " • "
																		: ""
																}
															>
																{
																	selectedUser.userRoleString
																}
															</span>
														)}
													</div>
												</div>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={clearSelection}
												className="text-green-600 hover:text-green-700"
											>
												×
											</Button>
										</div>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="role">角色</Label>
									<Select
										value={inviteForm.role}
										onValueChange={(value) =>
											setInviteForm({
												...inviteForm,
												role: value as
													| "ADMIN"
													| "SUPER_ADMIN",
												canManageAdmins:
													value === "SUPER_ADMIN",
											})
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ADMIN">
												管理员
											</SelectItem>
											<SelectItem value="SUPER_ADMIN">
												超级管理员
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-3">
									<Label>权限设置</Label>
									<div className="space-y-2">
										<div className="flex items-center space-x-2">
											<Checkbox
												id="canEditEvent"
												checked={
													inviteForm.canEditEvent
												}
												onCheckedChange={(checked) =>
													setInviteForm({
														...inviteForm,
														canEditEvent: !!checked,
													})
												}
											/>
											<Label htmlFor="canEditEvent">
												可以编辑活动信息
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Checkbox
												id="canManageRegistrations"
												checked={
													inviteForm.canManageRegistrations
												}
												onCheckedChange={(checked) =>
													setInviteForm({
														...inviteForm,
														canManageRegistrations:
															!!checked,
													})
												}
											/>
											<Label htmlFor="canManageRegistrations">
												可以管理活动报名
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Checkbox
												id="canManageAdmins"
												checked={
													inviteForm.canManageAdmins
												}
												onCheckedChange={(checked) =>
													setInviteForm({
														...inviteForm,
														canManageAdmins:
															!!checked,
													})
												}
												disabled={
													inviteForm.role !==
													"SUPER_ADMIN"
												}
											/>
											<Label
												htmlFor="canManageAdmins"
												className={
													inviteForm.role !==
													"SUPER_ADMIN"
														? "text-muted-foreground"
														: ""
												}
											>
												可以管理其他管理员{" "}
												{inviteForm.role !==
													"SUPER_ADMIN" &&
													"(仅超级管理员)"}
											</Label>
										</div>
									</div>
								</div>

								<div className="flex justify-end space-x-2">
									<Button
										type="button"
										variant="outline"
										onClick={() =>
											setInviteDialogOpen(false)
										}
									>
										取消
									</Button>
									<Button
										type="submit"
										disabled={submitting || !selectedUser}
									>
										{submitting
											? "添加中..."
											: "添加管理员"}
									</Button>
								</div>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</CardHeader>
			<CardContent>
				{admins.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						暂无活动管理员
						<div className="mt-2">
							<Button
								variant="outline"
								onClick={() => setInviteDialogOpen(true)}
							>
								添加第一个管理员
							</Button>
						</div>
					</div>
				) : (
					<>
						{/* Mobile card view */}
						<div className="space-y-3 md:hidden">
							{admins.map((admin) => {
								const statusConfig = getStatusBadge(
									admin.status,
								);
								const roleConfig = getRoleBadge(admin.role);
								const StatusIcon = statusConfig.icon;

								return (
									<div
										key={admin.id}
										className="rounded-lg border p-4 space-y-3"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-center gap-3 min-w-0">
												<Avatar className="h-10 w-10 shrink-0">
													<AvatarImage
														src={admin.user?.image}
													/>
													<AvatarFallback>
														{admin.user
															?.name?.[0] ||
															admin.email[0].toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="min-w-0">
													<div className="font-medium truncate">
														{admin.user?.name ||
															"未注册用户"}
													</div>
													<div className="text-xs text-muted-foreground flex items-center">
														<Mail className="w-3 h-3 mr-1 shrink-0" />
														<span className="truncate">
															{admin.email}
														</span>
													</div>
												</div>
											</div>
											{admin.status === "ACCEPTED" && (
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														setAdminToRemove(admin)
													}
													className="text-red-600 hover:text-red-700 shrink-0"
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											)}
										</div>
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant={roleConfig.variant}>
												{roleConfig.text}
											</Badge>
											<div className="flex items-center gap-1">
												<StatusIcon
													className={`w-3.5 h-3.5 ${statusConfig.color}`}
												/>
												<Badge
													variant={
														statusConfig.variant
													}
												>
													{statusConfig.text}
												</Badge>
											</div>
										</div>
										<div className="flex flex-wrap gap-1">
											{admin.canEditEvent && (
												<span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
													可编辑活动
												</span>
											)}
											{admin.canManageRegistrations && (
												<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
													可管理报名
												</span>
											)}
											{admin.canManageAdmins && (
												<span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
													可管理管理员
												</span>
											)}
										</div>
										<div className="text-xs text-muted-foreground">
											{new Date(
												admin.invitedAt,
											).toLocaleDateString()}{" "}
											由 {admin.inviter.name} 邀请
										</div>
									</div>
								);
							})}
						</div>

						{/* Desktop table view */}
						<div className="hidden md:block">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>用户</TableHead>
										<TableHead>角色</TableHead>
										<TableHead>权限</TableHead>
										<TableHead>状态</TableHead>
										<TableHead>邀请时间</TableHead>
										<TableHead>操作</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{admins.map((admin) => {
										const statusConfig = getStatusBadge(
											admin.status,
										);
										const roleConfig = getRoleBadge(
											admin.role,
										);
										const StatusIcon = statusConfig.icon;

										return (
											<TableRow key={admin.id}>
												<TableCell>
													<div className="flex items-center space-x-3">
														<Avatar className="h-8 w-8">
															<AvatarImage
																src={
																	admin.user
																		?.image
																}
															/>
															<AvatarFallback>
																{admin.user
																	?.name?.[0] ||
																	admin.email[0].toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div>
															<div className="font-medium">
																{admin.user
																	?.name ||
																	"未注册用户"}
															</div>
															<div className="text-sm text-muted-foreground flex items-center">
																<Mail className="w-3 h-3 mr-1" />
																{admin.email}
															</div>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<Badge
														variant={
															roleConfig.variant
														}
													>
														{roleConfig.text}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="space-y-1">
														{admin.canEditEvent && (
															<div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
																可编辑活动
															</div>
														)}
														{admin.canManageRegistrations && (
															<div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
																可管理报名
															</div>
														)}
														{admin.canManageAdmins && (
															<div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
																可管理管理员
															</div>
														)}
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center space-x-2">
														<StatusIcon
															className={`w-4 h-4 ${statusConfig.color}`}
														/>
														<Badge
															variant={
																statusConfig.variant
															}
														>
															{statusConfig.text}
														</Badge>
													</div>
												</TableCell>
												<TableCell>
													<div className="text-sm text-muted-foreground">
														{new Date(
															admin.invitedAt,
														).toLocaleDateString()}
													</div>
													<div className="text-xs text-muted-foreground">
														由 {admin.inviter.name}{" "}
														邀请
													</div>
												</TableCell>
												<TableCell>
													{admin.status ===
														"ACCEPTED" && (
														<Button
															size="sm"
															variant="outline"
															onClick={() =>
																setAdminToRemove(
																	admin,
																)
															}
															className="text-red-600 hover:text-red-700"
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					</>
				)}
			</CardContent>

			<AlertDialog
				open={!!adminToRemove}
				onOpenChange={() => setAdminToRemove(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>确认移除管理员</AlertDialogTitle>
						<AlertDialogDescription>
							确定要移除 {adminToRemove?.email}{" "}
							的活动管理员权限吗？ 此操作无法撤销。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								adminToRemove &&
								handleRemoveAdmin(adminToRemove)
							}
							className="bg-red-600 hover:bg-red-700"
						>
							移除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
}
