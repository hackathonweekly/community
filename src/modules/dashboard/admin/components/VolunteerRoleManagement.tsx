"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	PlusIcon,
	PencilIcon,
	TrashIcon,
	EllipsisVerticalIcon,
	UserGroupIcon,
} from "@heroicons/react/24/outline";

const volunteerRoleSchema = z.object({
	name: z.string().min(1, "角色名称必填"),
	description: z.string().min(1, "职责描述必填"),
	detailDescription: z.string().optional(),
	cpPoints: z.number().min(0, "积分不能为负数"),
});

type VolunteerRoleFormData = z.infer<typeof volunteerRoleSchema>;

interface VolunteerRole {
	id: string;
	name: string;
	description: string;
	detailDescription?: string;
	cpPoints: number;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

// 默认志愿者角色配置
const DEFAULT_ROLES = [
	{
		name: "主持人",
		description: "活动流程主持",
		detailDescription:
			"负责活动全程主持，包括开场、介绍嘉宾、时间控制和结束致辞等。",
		cpPoints: 50,
	},
	{
		name: "签到接待组",
		description: "负责签到和引导",
		detailDescription: "负责参与者签到、引导入场、发放物料和回答基本问题。",
		cpPoints: 30,
	},
	{
		name: "技术支持组",
		description: "设备调试和场地布置",
		detailDescription:
			"负责音响、投影、网络等技术设备的调试和维护，以及场地布置。",
		cpPoints: 40,
	},
	{
		name: "记录摄影组",
		description: "活动记录和拍照",
		detailDescription:
			"负责活动全程拍照、录像、直播等记录工作，制作活动回顾材料。",
		cpPoints: 35,
	},
	{
		name: "计时员",
		description: "控制时间进度",
		detailDescription:
			"负责活动时间把控，提醒演讲者时间，确保活动按计划进行。",
		cpPoints: 25,
	},
	{
		name: "物料管理员",
		description: "物料准备和管理",
		detailDescription:
			"负责活动物料的准备、分发、回收和管理，确保物料充足。",
		cpPoints: 30,
	},
];

export function VolunteerRoleManagement() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingRole, setEditingRole] = useState<VolunteerRole | null>(null);
	const [roles, setRoles] = useState<VolunteerRole[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	const form = useForm<VolunteerRoleFormData>({
		resolver: zodResolver(volunteerRoleSchema),
		defaultValues: {
			name: "",
			description: "",
			detailDescription: "",
			cpPoints: 0,
		},
	});

	// 获取志愿者角色列表
	const fetchRoles = async () => {
		try {
			const response = await fetch("/api/volunteer-roles");
			if (response.ok) {
				const data = await response.json();
				setRoles(data.data || []);
			}
		} catch (error) {
			console.error("Error fetching volunteer roles:", error);
		} finally {
			setIsInitialLoading(false);
		}
	};

	useEffect(() => {
		fetchRoles();
	}, []);

	const handleSubmit = async (data: VolunteerRoleFormData) => {
		setIsLoading(true);
		try {
			const url = editingRole
				? `/api/volunteer-roles/${editingRole.id}`
				: "/api/volunteer-roles";

			const method = editingRole ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "操作失败");
			}

			const result = await response.json();
			toast.success(editingRole ? "角色更新成功" : "角色创建成功");

			setIsDialogOpen(false);
			form.reset();
			setEditingRole(null);
			await fetchRoles(); // 刷新列表
		} catch (error) {
			console.error("保存失败:", error);
			toast.error(error instanceof Error ? error.message : "保存失败");
		} finally {
			setIsLoading(false);
		}
	};

	const handleEdit = (role: VolunteerRole) => {
		setEditingRole(role);
		form.setValue("name", role.name);
		form.setValue("description", role.description);
		form.setValue("detailDescription", role.detailDescription || "");
		form.setValue("cpPoints", role.cpPoints);
		setIsDialogOpen(true);
	};

	const handleDelete = async (id: string) => {
		if (!confirm("确定要删除这个志愿者角色吗？")) {
			return;
		}

		try {
			const response = await fetch(`/api/volunteer-roles/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "删除失败");
			}

			toast.success("角色删除成功");
			await fetchRoles(); // 刷新列表
		} catch (error) {
			console.error("删除失败:", error);
			toast.error(error instanceof Error ? error.message : "删除失败");
		}
	};

	const initializeDefaultRoles = async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/volunteer-roles/batch", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					roles: DEFAULT_ROLES,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "初始化失败");
			}

			const result = await response.json();
			await fetchRoles(); // 刷新列表
			toast.success(`成功初始化 ${result.data.length} 个默认志愿者角色`);
		} catch (error) {
			console.error("初始化失败:", error);
			toast.error(error instanceof Error ? error.message : "初始化失败");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">志愿者角色管理</h1>
					<p className="text-muted-foreground mt-1">
						管理活动志愿者角色类型和积分设置
					</p>
				</div>
				<div className="flex gap-2">
					{roles.length === 0 && (
						<Button
							variant="outline"
							onClick={initializeDefaultRoles}
							disabled={isLoading}
						>
							<UserGroupIcon className="w-4 h-4 mr-2" />
							初始化默认角色
						</Button>
					)}
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button>
								<PlusIcon className="w-4 h-4 mr-2" />
								添加角色
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl">
							<DialogHeader>
								<DialogTitle>
									{editingRole
										? "编辑志愿者角色"
										: "添加志愿者角色"}
								</DialogTitle>
								<DialogDescription>
									配置志愿者角色的基本信息和积分奖励
								</DialogDescription>
							</DialogHeader>
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(handleSubmit)}
									className="space-y-6"
								>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														角色名称 *
													</FormLabel>
													<FormControl>
														<Input
															placeholder="如：主持人"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="cpPoints"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														积分奖励 *
													</FormLabel>
													<FormControl>
														<Input
															type="number"
															min="0"
															placeholder="30"
															{...field}
															onChange={(e) =>
																field.onChange(
																	Number.parseInt(
																		e.target
																			.value,
																	) || 0,
																)
															}
														/>
													</FormControl>
													<FormDescription>
														每次担任该角色可获得的积分
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name="description"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													职责描述 *
												</FormLabel>
												<FormControl>
													<Input
														placeholder="一句话描述该角色的主要职责"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="detailDescription"
										render={({ field }) => (
											<FormItem>
												<FormLabel>详细描述</FormLabel>
												<FormControl>
													<Textarea
														placeholder="详细描述该角色的工作内容和要求，支持Markdown格式"
														className="min-h-[80px]"
														{...field}
													/>
												</FormControl>
												<FormDescription>
													可选，为志愿者提供更详细的工作说明
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<DialogFooter>
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												setIsDialogOpen(false);
												form.reset();
												setEditingRole(null);
											}}
										>
											取消
										</Button>
										<Button
											type="submit"
											disabled={isLoading}
										>
											{isLoading
												? "保存中..."
												: editingRole
													? "更新"
													: "创建"}
										</Button>
									</DialogFooter>
								</form>
							</Form>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>志愿者角色列表</CardTitle>
					<CardDescription>
						管理活动中可用的志愿者角色类型
					</CardDescription>
				</CardHeader>
				<CardContent>
					{roles.length === 0 ? (
						<div className="text-center py-12">
							<UserGroupIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
							<h3 className="font-medium text-lg mb-2">
								暂无志愿者角色
							</h3>
							<p className="text-muted-foreground mb-4">
								创建志愿者角色来为活动招募不同类型的志愿者
							</p>
							<Button
								variant="outline"
								onClick={initializeDefaultRoles}
								disabled={isLoading}
							>
								<UserGroupIcon className="w-4 h-4 mr-2" />
								初始化默认角色
							</Button>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>角色信息</TableHead>
									<TableHead>职责描述</TableHead>
									<TableHead>积分</TableHead>
									<TableHead>状态</TableHead>
									<TableHead className="w-[50px]">
										操作
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{roles.map((role) => (
									<TableRow key={role.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<div>
													<div className="font-medium">
														{role.name}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="max-w-xs">
												<div className="truncate">
													{role.description}
												</div>
												{role.detailDescription && (
													<div className="text-sm text-muted-foreground truncate">
														{role.detailDescription}
													</div>
												)}
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="secondary">
												{role.cpPoints} CP
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant={
													role.isActive
														? "default"
														: "secondary"
												}
											>
												{role.isActive
													? "启用"
													: "禁用"}
											</Badge>
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
													>
														<EllipsisVerticalIcon className="w-4 h-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() =>
															handleEdit(role)
														}
													>
														<PencilIcon className="w-4 h-4 mr-2" />
														编辑
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															handleDelete(
																role.id,
															)
														}
														className="text-red-600"
													>
														<TrashIcon className="w-4 h-4 mr-2" />
														删除
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
