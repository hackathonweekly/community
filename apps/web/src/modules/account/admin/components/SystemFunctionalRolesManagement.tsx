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
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import { Switch } from "@community/ui/ui/switch";
import { Textarea } from "@community/ui/ui/textarea";
import { createFunctionalRoleDisplayNameResolver } from "@/features/functional-roles/display-name";
import {
	Loader2,
	Pencil,
	Plus,
	RefreshCcw,
	ShieldCheck,
	ShieldOff,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

interface FunctionalRoleItem {
	id: string;
	name: string;
	description: string;
	applicableScope: string | null;
	isActive: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export function SystemFunctionalRolesManagement() {
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

	const [createName, setCreateName] = useState("");
	const [createDescription, setCreateDescription] = useState("");
	const [createScope, setCreateScope] = useState("");
	const [createLoading, setCreateLoading] = useState(false);

	const [editingRole, setEditingRole] = useState<FunctionalRoleItem | null>(
		null,
	);
	const [editDescription, setEditDescription] = useState("");
	const [editScope, setEditScope] = useState("");
	const [editActive, setEditActive] = useState(true);
	const [editLoading, setEditLoading] = useState(false);

	useEffect(() => {
		void fetchRoles();
	}, []);

	async function fetchRoles() {
		try {
			setRolesLoading(true);
			setRolesError(null);
			const params = new URLSearchParams({
				roleType: "system",
				includeInactive: "true",
			});
			const response = await fetch(
				`/api/admin/functional-roles?${params.toString()}`,
			);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || "加载系统职能角色失败");
			}

			const data = await response.json();
			setRoles(data.roles || []);
		} catch (error) {
			setRolesError(
				error instanceof Error ? error.message : "加载系统职能角色失败",
			);
		} finally {
			setRolesLoading(false);
		}
	}

	async function handleCreateRole() {
		const trimmedName = createName.trim();
		const trimmedDescription = createDescription.trim();

		if (!trimmedName || !trimmedDescription) {
			toast({
				title: "请填写完整信息",
				description: "角色名称和描述不能为空",
				variant: "destructive",
			});
			return;
		}

		const keyPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
		if (!keyPattern.test(trimmedName)) {
			toast({
				title: "名称格式不正确",
				description:
					"翻译 key 仅支持字母、数字和下划线，且必须以字母开头",
				variant: "destructive",
			});
			return;
		}

		try {
			setCreateLoading(true);
			const response = await fetch("/api/admin/functional-roles", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: trimmedName,
					description: trimmedDescription,
					applicableScope: createScope.trim() || undefined,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(errorData?.error || "创建系统职能角色失败");
			}

			toast({
				title: "创建成功",
				description: "系统职能角色已创建，记得更新各语言的翻译显示",
			});

			setCreateName("");
			setCreateDescription("");
			setCreateScope("");
			void fetchRoles();
		} catch (error) {
			toast({
				title: "创建失败",
				description:
					error instanceof Error
						? error.message
						: "创建系统职能角色失败",
				variant: "destructive",
			});
		} finally {
			setCreateLoading(false);
		}
	}

	function openEditDialog(role: FunctionalRoleItem) {
		setEditingRole(role);
		setEditDescription(role.description);
		setEditScope(role.applicableScope ?? "");
		setEditActive(role.isActive);
	}

	function closeEditDialog() {
		setEditingRole(null);
		setEditDescription("");
		setEditScope("");
		setEditActive(true);
	}

	async function handleUpdateRole() {
		if (!editingRole) {
			return;
		}

		try {
			setEditLoading(true);
			const response = await fetch(
				`/api/admin/functional-roles/${editingRole.id}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						description: editDescription.trim(),
						applicableScope: editScope.trim() || null,
						isActive: editActive,
					}),
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(errorData?.error || "更新系统职能角色失败");
			}

			toast({
				title: "更新成功",
				description: "系统职能角色信息已更新",
			});

			closeEditDialog();
			void fetchRoles();
		} catch (error) {
			toast({
				title: "更新失败",
				description:
					error instanceof Error
						? error.message
						: "更新系统职能角色失败",
				variant: "destructive",
			});
		} finally {
			setEditLoading(false);
		}
	}

	async function handleToggleRole(role: FunctionalRoleItem) {
		try {
			const response = await fetch(
				`/api/admin/functional-roles/${role.id}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ isActive: !role.isActive }),
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(errorData?.error || "更新角色状态失败");
			}

			toast({
				title: role.isActive ? "已停用" : "已启用",
				description: `${resolveRoleDisplayName(role)} 已${
					role.isActive ? "停用" : "启用"
				}`,
			});

			void fetchRoles();
		} catch (error) {
			toast({
				title: "操作失败",
				description:
					error instanceof Error ? error.message : "更新角色状态失败",
				variant: "destructive",
			});
		}
	}

	return (
		<div className="space-y-6 p-4 sm:p-6">
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold">系统职能角色管理</h1>
				<p className="text-sm text-muted-foreground">
					这里管理所有系统预设的职能角色。角色名称会作为翻译 key
					使用， 如需调整各语言显示，请同步更新
					<code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
						src/lib/i18n/translations/*
					</code>
					文件中的对应文案。
				</p>
			</div>

			<Card>
				<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle>系统职能角色列表</CardTitle>
						<CardDescription>
							默认角色无法删除，但可以停用或更新描述
						</CardDescription>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => void fetchRoles()}
						disabled={rolesLoading}
						className="flex items-center gap-2"
					>
						{rolesLoading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<RefreshCcw className="h-4 w-4" />
						)}
						<span>刷新</span>
					</Button>
				</CardHeader>
				<CardContent>
					{rolesError ? (
						<p className="text-sm text-destructive">{rolesError}</p>
					) : rolesLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : roles.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							暂无系统职能角色
						</p>
					) : (
						<div className="space-y-3">
							{roles.map((role) => {
								const displayName =
									resolveRoleDisplayName(role);
								return (
									<Card
										key={role.id}
										className="border-muted-foreground/15"
									>
										<CardContent className="space-y-3 py-4">
											<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
												<div>
													<div className="flex flex-wrap items-center gap-2">
														<h3 className="text-base font-semibold">
															{displayName}
														</h3>
														<Badge
															variant={
																role.isActive
																	? "default"
																	: "secondary"
															}
														>
															{role.isActive
																? "启用"
																: "停用"}
														</Badge>
													</div>
													<p className="text-xs text-muted-foreground">
														翻译 key：{role.name}
													</p>
												</div>
												<div className="flex flex-wrap items-center gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															openEditDialog(role)
														}
													>
														<Pencil className="mr-2 h-4 w-4" />
														编辑
													</Button>
													<Button
														variant={
															role.isActive
																? "secondary"
																: "default"
														}
														size="sm"
														onClick={() =>
															void handleToggleRole(
																role,
															)
														}
													>
														{role.isActive ? (
															<ShieldOff className="mr-2 h-4 w-4" />
														) : (
															<ShieldCheck className="mr-2 h-4 w-4" />
														)}
														{role.isActive
															? "停用"
															: "启用"}
													</Button>
												</div>
											</div>

											<div className="space-y-1 text-sm">
												<p>
													<span className="font-medium">
														职责描述：
													</span>
													{role.description}
												</p>
												<p className="text-muted-foreground">
													<span className="font-medium">
														适用范围：
													</span>
													{role.applicableScope ||
														"社区通用"}
												</p>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>新增系统职能角色</CardTitle>
					<CardDescription>
						在此创建新的系统级职能角色，创建后可在上方列表管理
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="roleName">
								角色翻译 key（英文）
							</Label>
							<Input
								id="roleName"
								placeholder="例如 founder"
								value={createName}
								onChange={(event) =>
									setCreateName(event.target.value)
								}
							/>
							<p className="text-xs text-muted-foreground">
								仅允许字母、下划线，作为 i18n key。
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="roleScope">适用范围（可选）</Label>
							<Input
								id="roleScope"
								placeholder="例如 community / campus / chapter"
								value={createScope}
								onChange={(event) =>
									setCreateScope(event.target.value)
								}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="roleDescription">职责描述</Label>
						<Textarea
							id="roleDescription"
							placeholder="简要描述角色的核心职责"
							rows={3}
							value={createDescription}
							onChange={(event) =>
								setCreateDescription(event.target.value)
							}
						/>
					</div>
					<div className="flex justify-end">
						<Button
							onClick={() => void handleCreateRole()}
							disabled={createLoading}
						>
							{createLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Plus className="mr-2 h-4 w-4" />
							)}
							创建角色
						</Button>
					</div>
				</CardContent>
			</Card>

			<Dialog
				open={!!editingRole}
				onOpenChange={(open) => !open && closeEditDialog()}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>编辑系统职能角色</DialogTitle>
						<p className="text-sm text-muted-foreground">
							角色翻译 key：{editingRole?.name}
						</p>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1">
							<Label>当前显示名称</Label>
							<p className="text-sm font-medium">
								{editingRole
									? resolveRoleDisplayName(editingRole)
									: ""}
							</p>
							<p className="text-xs text-muted-foreground">
								若需修改各语言显示，仍需同步改动翻译文件。
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="editDescription">职责描述</Label>
							<Textarea
								id="editDescription"
								value={editDescription}
								onChange={(event) =>
									setEditDescription(event.target.value)
								}
								rows={3}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="editScope">适用范围（可选）</Label>
							<Input
								id="editScope"
								value={editScope}
								onChange={(event) =>
									setEditScope(event.target.value)
								}
							/>
						</div>
						<div className="flex items-center gap-2">
							<Switch
								checked={editActive}
								onCheckedChange={setEditActive}
							/>
							<span className="text-sm">启用该角色</span>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={closeEditDialog}
							disabled={editLoading}
						>
							取消
						</Button>
						<Button
							onClick={() => void handleUpdateRole()}
							disabled={editLoading}
						>
							{editLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Pencil className="mr-2 h-4 w-4" />
							)}
							保存修改
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
