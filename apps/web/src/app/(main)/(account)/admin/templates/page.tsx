"use client";

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
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@community/ui/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@community/ui/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@community/ui/ui/tabs";
import { useSession } from "@shared/auth/hooks/use-session";
import {
	CogIcon,
	EllipsisHorizontalIcon,
	EyeIcon,
	EyeSlashIcon,
	StarIcon,
	UserIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EventTemplate {
	id: string;
	name: string;
	type: string;
	description: string;
	title: string;
	defaultDescription: string;
	duration?: number;
	maxAttendees?: number;
	requireApproval: boolean;
	isSystemTemplate: boolean;
	isFeatured: boolean;
	isPublic: boolean;
	isActive: boolean;
	usageCount: number;
	createdAt: string;
	updatedAt: string;
	creator?: {
		id: string;
		name: string;
		image?: string;
	};
	organization?: {
		id: string;
		name: string;
		logo?: string;
	};
}

export default function AdminTemplatesPage() {
	const router = useRouter();
	const { user } = useSession();
	const [templates, setTemplates] = useState<EventTemplate[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("all");
	const [selectedTemplate, setSelectedTemplate] =
		useState<EventTemplate | null>(null);
	const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
	const [actionType, setActionType] = useState<
		"feature" | "unfeature" | "activate" | "deactivate"
	>("feature");
	const [isProcessing, setIsProcessing] = useState(false);

	// 检查是否为超级管理员
	useEffect(() => {
		if (!user || user.role !== "super_admin") {
			router.push("/");
			return;
		}
	}, [user, router]);

	const fetchAllTemplates = async () => {
		try {
			// 这里需要一个超级管理员专用的 API 来获取所有模板
			const response = await fetch("/api/admin/event-templates");
			if (response.ok) {
				const data = await response.json();
				setTemplates(data.data || []);
			} else {
				toast.error("获取模板列表失败");
			}
		} catch (error) {
			console.error("Error fetching templates:", error);
			toast.error("获取模板列表时发生错误");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (user?.role === "super_admin") {
			fetchAllTemplates();
		}
	}, [user]);

	const handleAction = async () => {
		if (!selectedTemplate) {
			return;
		}

		setIsProcessing(true);
		try {
			const response = await fetch(
				`/api/admin/event-templates/${selectedTemplate.id}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						isFeatured: actionType === "feature",
						isActive:
							actionType === "activate" ||
							actionType !== "deactivate",
					}),
				},
			);

			if (response.ok) {
				const actionMessages = {
					feature: "模板已设为精选",
					unfeature: "模板已取消精选",
					activate: "模板已激活",
					deactivate: "模板已停用",
				};
				toast.success(actionMessages[actionType]);
				setIsActionDialogOpen(false);
				fetchAllTemplates();
			} else {
				const error = await response.json();
				toast.error(error.message || "操作失败");
			}
		} catch (error) {
			console.error("Error updating template:", error);
			toast.error("操作时发生错误");
		} finally {
			setIsProcessing(false);
		}
	};

	const openActionDialog = (
		template: EventTemplate,
		action: typeof actionType,
	) => {
		setSelectedTemplate(template);
		setActionType(action);
		setIsActionDialogOpen(true);
	};

	const getTypeLabel = (type: string) => {
		const labels: Record<string, string> = {
			HACKATHON_LEARNING: "迷你黑客松",
			MEETUP: "常规活动",
			CUSTOM: "自定义",
		};
		return labels[type] || type;
	};

	const getActionTitle = () => {
		const titles = {
			feature: "设为精选模板",
			unfeature: "取消精选模板",
			activate: "激活模板",
			deactivate: "停用模板",
		};
		return titles[actionType];
	};

	const getActionDescription = () => {
		const descriptions = {
			feature: "将此模板设为精选，会在模板选择页面优先显示",
			unfeature: "取消此模板的精选状态",
			activate: "激活此模板，用户将能看到并使用它",
			deactivate: "停用此模板，用户将无法看到和使用它",
		};
		return descriptions[actionType];
	};

	// 根据选项卡过滤模板
	const filteredTemplates = templates.filter((template) => {
		switch (activeTab) {
			case "featured":
				return template.isFeatured;
			case "system":
				return template.isSystemTemplate;
			case "personal":
				return !template.isSystemTemplate;
			default:
				return true;
		}
	});

	if (!user || user.role !== "super_admin") {
		return null;
	}

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-6xl mx-auto">
					<div className="mb-8">
						<h1 className="text-3xl font-bold">
							模板管理 - 超级管理员
						</h1>
						<p className="text-muted-foreground mt-2">
							管理所有模板的状态和精选设置...
						</p>
					</div>
					<div className="text-center py-8">加载中...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-2 mb-2">
						<CogIcon className="w-6 h-6 text-primary" />
						<h1 className="text-3xl font-bold">模板管理</h1>
						<Badge
							variant="outline"
							className="bg-red-50 text-red-600 border-red-200"
						>
							超级管理员
						</Badge>
					</div>
					<p className="text-muted-foreground">
						管理所有活动模板的状态、精选设置和可见性
					</p>
				</div>

				{/* Statistics */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
					<Card>
						<CardContent className="p-4">
							<div className="text-2xl font-bold">
								{templates.length}
							</div>
							<div className="text-sm text-muted-foreground">
								总模板数
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="text-2xl font-bold">
								{templates.filter((t) => t.isFeatured).length}
							</div>
							<div className="text-sm text-muted-foreground">
								精选模板
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="text-2xl font-bold">
								{
									templates.filter((t) => t.isSystemTemplate)
										.length
								}
							</div>
							<div className="text-sm text-muted-foreground">
								系统模板
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="text-2xl font-bold">
								{
									templates.filter((t) => !t.isSystemTemplate)
										.length
								}
							</div>
							<div className="text-sm text-muted-foreground">
								个人模板
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Templates List */}
				<Card>
					<CardHeader>
						<div className="flex justify-between items-center">
							<div>
								<CardTitle>模板列表</CardTitle>
								<CardDescription>
									查看和管理所有活动模板
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="mb-4"
						>
							<TabsList>
								<TabsTrigger value="all">
									全部 ({templates.length})
								</TabsTrigger>
								<TabsTrigger value="featured">
									精选 (
									{
										templates.filter((t) => t.isFeatured)
											.length
									}
									)
								</TabsTrigger>
								<TabsTrigger value="system">
									系统 (
									{
										templates.filter(
											(t) => t.isSystemTemplate,
										).length
									}
									)
								</TabsTrigger>
								<TabsTrigger value="personal">
									个人 (
									{
										templates.filter(
											(t) => !t.isSystemTemplate,
										).length
									}
									)
								</TabsTrigger>
							</TabsList>
						</Tabs>

						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>模板信息</TableHead>
									<TableHead>创建者</TableHead>
									<TableHead>类型</TableHead>
									<TableHead>状态</TableHead>
									<TableHead>使用次数</TableHead>
									<TableHead>创建时间</TableHead>
									<TableHead className="w-20">操作</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredTemplates.map((template) => (
									<TableRow key={template.id}>
										<TableCell>
											<div>
												<div className="flex items-center gap-2">
													{template.isFeatured && (
														<StarIconSolid className="w-4 h-4 text-amber-500" />
													)}
													<div className="font-medium">
														{template.name}
													</div>
												</div>
												<div className="text-sm text-muted-foreground line-clamp-1">
													{template.description}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<UserIcon className="w-4 h-4 text-muted-foreground" />
												<span className="text-sm">
													{template.creator?.name ||
														"系统"}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex gap-1">
												<Badge variant="outline">
													{getTypeLabel(
														template.type,
													)}
												</Badge>
												{template.isSystemTemplate && (
													<Badge variant="secondary">
														系统
													</Badge>
												)}
												{!template.isSystemTemplate && (
													<Badge variant="outline">
														个人
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell>
											<div className="flex gap-1">
												{template.isFeatured && (
													<Badge
														variant="default"
														className="bg-amber-100 text-amber-800"
													>
														精选
													</Badge>
												)}
												{template.isPublic && (
													<Badge variant="outline">
														公开
													</Badge>
												)}
												{!template.isActive && (
													<Badge variant="secondary">
														已停用
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell>
											{template.usageCount}
										</TableCell>
										<TableCell>
											{format(
												new Date(template.createdAt),
												"yyyy-MM-dd",
											)}
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
													>
														<EllipsisHorizontalIcon className="w-4 h-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													{!template.isFeatured ? (
														<DropdownMenuItem
															onClick={() =>
																openActionDialog(
																	template,
																	"feature",
																)
															}
														>
															<StarIcon className="w-4 h-4 mr-2" />
															设为精选
														</DropdownMenuItem>
													) : (
														<DropdownMenuItem
															onClick={() =>
																openActionDialog(
																	template,
																	"unfeature",
																)
															}
														>
															<StarIcon className="w-4 h-4 mr-2" />
															取消精选
														</DropdownMenuItem>
													)}
													{template.isActive ? (
														<DropdownMenuItem
															onClick={() =>
																openActionDialog(
																	template,
																	"deactivate",
																)
															}
															className="text-orange-600"
														>
															<EyeSlashIcon className="w-4 h-4 mr-2" />
															停用模板
														</DropdownMenuItem>
													) : (
														<DropdownMenuItem
															onClick={() =>
																openActionDialog(
																	template,
																	"activate",
																)
															}
															className="text-green-600"
														>
															<EyeIcon className="w-4 h-4 mr-2" />
															激活模板
														</DropdownMenuItem>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>

						{filteredTemplates.length === 0 && (
							<div className="text-center py-8 text-muted-foreground">
								当前分类下没有模板
							</div>
						)}
					</CardContent>
				</Card>

				{/* Action Confirmation Dialog */}
				<Dialog
					open={isActionDialogOpen}
					onOpenChange={setIsActionDialogOpen}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{getActionTitle()}</DialogTitle>
							<DialogDescription>
								{getActionDescription()}
								{selectedTemplate && (
									<div className="mt-2 p-2 bg-muted rounded text-sm">
										<strong>{selectedTemplate.name}</strong>
										<br />
										{selectedTemplate.description}
									</div>
								)}
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsActionDialogOpen(false)}
								disabled={isProcessing}
							>
								取消
							</Button>
							<Button
								onClick={handleAction}
								disabled={isProcessing}
								variant={
									actionType === "deactivate"
										? "destructive"
										: "default"
								}
							>
								{isProcessing ? "处理中..." : "确认"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
